import { Injectable, Logger } from '@nestjs/common';
import {
  env as transformersEnv,
  pipeline,
  type FeatureExtractionPipeline,
} from '@huggingface/transformers';

// Docker bakes the model into the image at build time and points this at the
// baked cache, so containers start without reaching out to the network.
if (process.env.TRANSFORMERS_CACHE_DIR) {
  transformersEnv.cacheDir = process.env.TRANSFORMERS_CACHE_DIR;
}

/**
 * Turns free text into a dense vector so the database can compare meaning
 * rather than characters.
 *
 * The model runs locally through ONNX Runtime, which means the repo has no
 * embedding API key to configure and CI can exercise the real code path.
 * `all-MiniLM-L6-v2` emits 384 dimensions; that number is duplicated in the
 * `vector(384)` column definition, so EMBEDDING_DIMENSIONS is the one place to
 * change if the model is ever swapped.
 */
@Injectable()
export class EmbeddingService {
  static readonly MODEL = 'Xenova/all-MiniLM-L6-v2';
  static readonly DIMENSIONS = 384;

  private readonly logger = new Logger(EmbeddingService.name);

  /**
   * Held as a promise rather than an instance so that concurrent callers
   * during startup share one model load instead of each triggering their own.
   */
  private extractor?: Promise<FeatureExtractionPipeline>;

  get dimensions(): number {
    return EmbeddingService.DIMENSIONS;
  }

  private load(): Promise<FeatureExtractionPipeline> {
    if (!this.extractor) {
      this.logger.log(`Loading embedding model ${EmbeddingService.MODEL}`);
      this.extractor = pipeline(
        'feature-extraction',
        EmbeddingService.MODEL,
      ).catch((error: unknown) => {
        // Clear the cached promise so a transient failure (first-run model
        // download, offline CI) does not poison every later request.
        this.extractor = undefined;
        throw error;
      });
    }
    return this.extractor;
  }

  /** Warms the model so the first real search does not pay the load cost. */
  async warmUp(): Promise<void> {
    await this.load();
  }

  async embed(text: string): Promise<number[]> {
    const [vector] = await this.embedMany([text]);
    if (!vector) {
      throw new Error('Embedding pipeline returned no vector');
    }
    return vector;
  }

  async embedMany(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const extractor = await this.load();

    // Mean pooling collapses per-token vectors into one vector per document.
    // Normalising to unit length makes cosine distance equivalent to a dot
    // product, which is what the pgvector index is configured for.
    const output = await extractor(texts, {
      pooling: 'mean',
      normalize: true,
    });

    const rows = output.tolist() as number[][];
    for (const row of rows) {
      if (row.length !== EmbeddingService.DIMENSIONS) {
        throw new Error(
          `Expected ${EmbeddingService.DIMENSIONS}-dimension embeddings from ` +
            `${EmbeddingService.MODEL}, got ${row.length}`,
        );
      }
    }
    return rows;
  }
}
