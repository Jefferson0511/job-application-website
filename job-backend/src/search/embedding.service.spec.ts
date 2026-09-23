import { Logger } from '@nestjs/common';
import { pipeline } from '@huggingface/transformers';
import { EmbeddingService } from './embedding.service';

// The model weights are ~87 MB, so the pipeline is mocked here and the real
// thing is exercised by the integration test instead. `env` is part
// of the mock because the service assigns a cache directory onto it at import
// time when TRANSFORMERS_CACHE_DIR is set.
jest.mock('@huggingface/transformers', () => ({
  pipeline: jest.fn(),
  env: {},
}));

const mockedPipeline = pipeline as unknown as jest.Mock;

function tensorOf(rows: number[][]): { tolist: () => number[][] } {
  return { tolist: () => rows };
}

function vector(fill = 0.1): number[] {
  return Array.from({ length: EmbeddingService.DIMENSIONS }, () => fill);
}

describe('EmbeddingService', () => {
  let service: EmbeddingService;
  let extractor: jest.Mock;

  beforeEach(() => {
    // The service announces each model load; that is useful in production and
    // just noise here.
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    extractor = jest.fn().mockResolvedValue(tensorOf([vector()]));
    mockedPipeline.mockReset();
    mockedPipeline.mockResolvedValue(extractor);
    service = new EmbeddingService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exposes the dimension count the vector column is built for', () => {
    expect(service.dimensions).toBe(384);
  });

  it('mean-pools and normalises so cosine distance is meaningful', async () => {
    await service.embed('remote backend work');

    expect(extractor).toHaveBeenCalledWith(['remote backend work'], {
      pooling: 'mean',
      normalize: true,
    });
  });

  it('loads the model once across concurrent callers', async () => {
    await Promise.all([
      service.embed('one'),
      service.embed('two'),
      service.embed('three'),
    ]);

    expect(mockedPipeline).toHaveBeenCalledTimes(1);
  });

  it('retries the load after a failure instead of caching the rejection', async () => {
    mockedPipeline.mockRejectedValueOnce(new Error('network down'));

    await expect(service.embed('first')).rejects.toThrow('network down');

    mockedPipeline.mockResolvedValue(extractor);
    await expect(service.embed('second')).resolves.toHaveLength(
      EmbeddingService.DIMENSIONS,
    );
  });

  it('returns an empty array without calling the model for no input', async () => {
    await expect(service.embedMany([])).resolves.toEqual([]);
    expect(mockedPipeline).not.toHaveBeenCalled();
  });

  it('rejects vectors whose width does not match the column', async () => {
    extractor.mockResolvedValue(tensorOf([[0.1, 0.2, 0.3]]));

    await expect(service.embed('short')).rejects.toThrow(
      /384-dimension embeddings/,
    );
  });

  it('embeds a batch in one model call', async () => {
    extractor.mockResolvedValue(tensorOf([vector(0.1), vector(0.2)]));

    const vectors = await service.embedMany(['a', 'b']);

    expect(vectors).toHaveLength(2);
    expect(extractor).toHaveBeenCalledTimes(1);
  });
});
