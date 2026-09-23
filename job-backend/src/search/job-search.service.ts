import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { toSql } from 'pgvector';
import { createHash } from 'node:crypto';
import { EmbeddingService } from './embedding.service';
import { Job } from '../job/job.entity';
import { SemanticSearchDto } from './dto/semantic-search.dto';

/**
 * pgvector's helpers are untyped, so the `any` is contained here: everywhere
 * else a vector is a plain '[0.1,0.2,...]' string literal Postgres can cast.
 */
function vectorLiteral(values: number[]): string {
  return toSql(values) as string;
}

export interface JobSearchHit {
  job: Job;
  /** Cosine similarity in [0, 1]; 1 means the query and posting match exactly. */
  similarity: number;
}

/**
 * Vector search over job postings.
 *
 * Embeddings live in a side table rather than on the `Job` entity for two
 * reasons: TypeORM has no native `vector` column type, and keeping the vector
 * out of the entity means every existing `find()` keeps its current shape and
 * does not drag 384 floats across the wire.
 */
@Injectable()
export class JobSearchService implements OnModuleInit {
  private static readonly TABLE = 'job_embedding';

  private readonly logger = new Logger(JobSearchService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly embeddings: EmbeddingService,
  ) {}

  private schemaReady = false;

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureSchema();
      this.schemaReady = true;
    } catch (error: unknown) {
      // A Postgres image without pgvector should degrade to "search is
      // unavailable", not take the whole API down on boot.
      this.logger.error(
        'Vector search schema unavailable; semantic search is disabled. ' +
          'Is the pgvector extension installed? (docker compose uses pgvector/pgvector)',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private assertReady(): void {
    if (!this.schemaReady) {
      throw new ServiceUnavailableException(
        'Semantic search is unavailable: the pgvector schema failed to initialize.',
      );
    }
  }

  /**
   * Idempotent DDL. The pgvector extension cannot be created by TypeORM's
   * `synchronize`, so the search schema owns its own setup and is safe to run
   * on every boot.
   */
  async ensureSchema(): Promise<void> {
    const dims = this.embeddings.dimensions;

    await this.dataSource.query('CREATE EXTENSION IF NOT EXISTS vector');
    await this.dataSource.query(`
      CREATE TABLE IF NOT EXISTS ${JobSearchService.TABLE} (
        job_id       integer PRIMARY KEY REFERENCES job(id) ON DELETE CASCADE,
        embedding    vector(${dims}) NOT NULL,
        content_hash text NOT NULL,
        updated_at   timestamptz NOT NULL DEFAULT now()
      )
    `);
    // HNSW with cosine ops matches the normalised vectors the embedding
    // service produces. Built after the table so a fresh database and an
    // existing one converge on the same shape.
    await this.dataSource.query(`
      CREATE INDEX IF NOT EXISTS job_embedding_hnsw_idx
      ON ${JobSearchService.TABLE}
      USING hnsw (embedding vector_cosine_ops)
    `);

    this.logger.log(`Vector search schema ready (${dims} dimensions)`);
  }

  /**
   * The text a job is matched on. Kept in one place so indexing and any future
   * re-indexing cannot drift apart.
   */
  static toSearchDocument(job: Job): string {
    return [
      job.title,
      job.company,
      `${job.jobType} role, ${job.location}`,
      job.description,
      job.requirements,
      job.responsibilities,
    ]
      .filter((part): part is string => Boolean(part))
      .join('\n');
  }

  private static hash(document: string): string {
    return createHash('sha256').update(document).digest('hex');
  }

  /**
   * Embeds and stores a single job. Skips the model call when the posting's
   * text is unchanged, so routine edits (toggling a draft flag, fixing a
   * salary) do not re-run inference.
   */
  async indexJob(job: Job): Promise<void> {
    if (!this.schemaReady) {
      return;
    }

    const document = JobSearchService.toSearchDocument(job);
    const contentHash = JobSearchService.hash(document);

    const existing: Array<{ content_hash: string }> =
      await this.dataSource.query(
        `SELECT content_hash FROM ${JobSearchService.TABLE} WHERE job_id = $1`,
        [job.id],
      );
    if (existing[0]?.content_hash === contentHash) {
      return;
    }

    const vector = await this.embeddings.embed(document);
    await this.dataSource.query(
      `INSERT INTO ${JobSearchService.TABLE} (job_id, embedding, content_hash, updated_at)
       VALUES ($1, $2::vector, $3, now())
       ON CONFLICT (job_id) DO UPDATE
       SET embedding = EXCLUDED.embedding,
           content_hash = EXCLUDED.content_hash,
           updated_at = now()`,
      [job.id, vectorLiteral(vector), contentHash],
    );
  }

  /**
   * Brings every posting's embedding up to date. Used by the backfill script
   * and safe to re-run: unchanged postings are skipped by the hash check.
   */
  async reindexAll(batchSize = 32): Promise<number> {
    this.assertReady();

    const jobs = await this.dataSource.getRepository(Job).find();
    let indexed = 0;

    for (let start = 0; start < jobs.length; start += batchSize) {
      const batch = jobs.slice(start, start + batchSize);
      for (const job of batch) {
        await this.indexJob(job);
        indexed += 1;
      }
      this.logger.log(
        `Indexed ${Math.min(start + batchSize, jobs.length)}/${jobs.length} jobs`,
      );
    }

    return indexed;
  }

  /**
   * Ranks postings by meaning. Structured filters are applied in the same
   * query so the limit is reached with rows the caller can actually use,
   * instead of filtering a vector top-K down to nothing afterwards.
   */
  async search(dto: SemanticSearchDto): Promise<JobSearchHit[]> {
    this.assertReady();

    const limit = dto.limit ?? 10;
    const minSimilarity = dto.minSimilarity ?? 0.2;

    const queryVector = vectorLiteral(await this.embeddings.embed(dto.q));

    const params: unknown[] = [queryVector];
    const conditions: string[] = [];

    const addFilter = (sql: string, value: unknown): void => {
      params.push(value);
      conditions.push(sql.replace('$?', `$${params.length}`));
    };

    if (dto.location) {
      addFilter('LOWER(j.location) = LOWER($?)', dto.location);
    }
    if (dto.jobType) {
      addFilter('LOWER(j."jobType") = LOWER($?)', dto.jobType);
    }
    // Search is a public endpoint and drafts are private to their author, so
    // this is unconditional rather than a caller-supplied option.
    conditions.push('j."isDraft" = false');

    // Similarity threshold and LIMIT are the last two placeholders.
    params.push(minSimilarity);
    const similarityParam = `$${params.length}`;
    params.push(limit);
    const limitParam = `$${params.length}`;

    const where =
      conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    const rows: Array<Record<string, unknown>> = await this.dataSource.query(
      `SELECT j.*, 1 - (e.embedding <=> $1::vector) AS similarity
       FROM ${JobSearchService.TABLE} e
       JOIN job j ON j.id = e.job_id
       WHERE 1 - (e.embedding <=> $1::vector) >= ${similarityParam}
       ${where}
       ORDER BY e.embedding <=> $1::vector
       LIMIT ${limitParam}`,
      params,
    );

    return rows.map((row) => {
      const { similarity, ...job } = row;
      return {
        job: job as unknown as Job,
        similarity: Number(similarity),
      };
    });
  }
}
