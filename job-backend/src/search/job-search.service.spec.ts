import { Test, TestingModule } from '@nestjs/testing';
import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JobSearchService } from './job-search.service';
import { EmbeddingService } from './embedding.service';
import { Job } from '../job/job.entity';

const VECTOR = Array.from({ length: EmbeddingService.DIMENSIONS }, () => 0.1);

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 1,
    title: 'Backend Engineer',
    company: 'Acme',
    location: 'remote',
    jobType: 'full-time',
    salaryRange: '90-120',
    description: 'Build services',
    requirements: 'TypeScript',
    responsibilities: 'Ship features',
    deadline: '2026-12-01',
    isDraft: false,
    logo: 'acme.png',
    ownerId: 7,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('JobSearchService', () => {
  let service: JobSearchService;
  let query: jest.Mock;
  let embeddings: jest.Mocked<Pick<EmbeddingService, 'embed' | 'dimensions'>>;

  beforeEach(async () => {
    query = jest.fn().mockResolvedValue([]);
    embeddings = {
      embed: jest.fn().mockResolvedValue(VECTOR),
      dimensions: EmbeddingService.DIMENSIONS,
    } as unknown as jest.Mocked<Pick<EmbeddingService, 'embed' | 'dimensions'>>;

    const dataSource = {
      query,
      getRepository: jest.fn(),
    } as unknown as DataSource;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobSearchService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: EmbeddingService, useValue: embeddings },
      ],
    }).compile();

    service = module.get(JobSearchService);
  });

  describe('toSearchDocument', () => {
    it('includes the fields a candidate would actually search on', () => {
      const document = JobSearchService.toSearchDocument(makeJob());

      expect(document).toContain('Backend Engineer');
      expect(document).toContain('Acme');
      expect(document).toContain('full-time role, remote');
      expect(document).toContain('Ship features');
    });

    it('skips empty fields rather than emitting blank lines', () => {
      const document = JobSearchService.toSearchDocument(
        makeJob({ requirements: '' }),
      );

      expect(document.split('\n')).not.toContain('');
    });
  });

  describe('ensureSchema', () => {
    it('creates the extension, table and HNSW index idempotently', async () => {
      await service.ensureSchema();

      const statements = query.mock.calls.map(([sql]) => sql as string);
      expect(statements[0]).toContain('CREATE EXTENSION IF NOT EXISTS vector');
      expect(statements[1]).toContain(
        'CREATE TABLE IF NOT EXISTS job_embedding',
      );
      expect(statements[1]).toContain(`vector(${EmbeddingService.DIMENSIONS})`);
      expect(statements[1]).toContain('ON DELETE CASCADE');
      expect(statements[2]).toContain('USING hnsw');
      expect(statements[2]).toContain('vector_cosine_ops');
    });
  });

  describe('indexJob', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      query.mockClear();
      query.mockResolvedValue([]);
    });

    it('embeds and upserts a job with no existing row', async () => {
      await service.indexJob(makeJob());

      expect(embeddings.embed).toHaveBeenCalledTimes(1);
      const upsert = query.mock.calls.find(([sql]) =>
        (sql as string).includes('INSERT INTO job_embedding'),
      );
      expect(upsert).toBeDefined();
      expect(upsert?.[0]).toContain('ON CONFLICT (job_id) DO UPDATE');
    });

    it('skips re-embedding when the posting text is unchanged', async () => {
      const job = makeJob();
      // First pass records the hash the service would have stored.
      await service.indexJob(job);
      const storedHash = (
        query.mock.calls.find(([sql]) =>
          (sql as string).includes('INSERT INTO job_embedding'),
        )?.[1] as unknown[]
      )[2];

      embeddings.embed.mockClear();
      query.mockClear();
      query.mockResolvedValue([{ content_hash: storedHash }]);

      await service.indexJob(job);

      expect(embeddings.embed).not.toHaveBeenCalled();
      expect(
        query.mock.calls.some(([sql]) =>
          (sql as string).includes('INSERT INTO job_embedding'),
        ),
      ).toBe(false);
    });

    it('re-embeds when the posting text changed', async () => {
      await service.indexJob(makeJob());
      embeddings.embed.mockClear();
      query.mockClear();
      query.mockResolvedValue([{ content_hash: 'a-stale-hash' }]);

      await service.indexJob(makeJob({ description: 'Completely rewritten' }));

      expect(embeddings.embed).toHaveBeenCalledTimes(1);
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      await service.onModuleInit();
      query.mockClear();
      query.mockResolvedValue([]);
    });

    it('orders by cosine distance and parameterises the query vector', async () => {
      await service.search({ q: 'remote backend work' });

      const [sql, params] = query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('e.embedding <=> $1::vector');
      expect(sql).toContain('ORDER BY e.embedding <=> $1::vector');
      expect(params[0]).toBe(`[${VECTOR.join(',')}]`);
    });

    it('never returns drafts, since search is a public endpoint', async () => {
      await service.search({ q: 'engineer' });
      expect((query.mock.calls[0] as [string])[0]).toContain(
        'j."isDraft" = false',
      );

      query.mockClear();
      // No caller-supplied option can switch this off.
      await service.search({
        q: 'engineer',
        location: 'remote',
        jobType: 'full-time',
        limit: 50,
      });
      expect((query.mock.calls[0] as [string])[0]).toContain(
        'j."isDraft" = false',
      );
    });

    it('binds structured filters as parameters rather than inlining them', async () => {
      await service.search({
        q: 'engineer',
        location: 'remote',
        jobType: 'full-time',
      });

      const [sql, params] = query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('LOWER(j.location) = LOWER($2)');
      expect(sql).toContain('LOWER(j."jobType") = LOWER($3)');
      expect(params).toContain('remote');
      expect(params).toContain('full-time');
      // Query vector, two filters, similarity floor, limit.
      expect(params).toHaveLength(5);
    });

    it('applies the default similarity floor and limit', async () => {
      await service.search({ q: 'engineer' });

      const params = (query.mock.calls[0] as [string, unknown[]])[1];
      expect(params).toEqual([expect.any(String), 0.2, 10]);
    });

    it('maps rows into job plus similarity', async () => {
      query.mockResolvedValue([{ ...makeJob(), similarity: '0.8123' }]);

      const [hit] = await service.search({ q: 'engineer' });

      expect(hit?.similarity).toBeCloseTo(0.8123);
      expect(hit?.job.title).toBe('Backend Engineer');
      expect(hit?.job).not.toHaveProperty('similarity');
    });
  });

  describe('when the pgvector schema is unavailable', () => {
    let logged: jest.SpyInstance;

    beforeEach(async () => {
      // Spying asserts the operator gets told what went wrong, and keeps the
      // expected stack trace out of the test output.
      logged = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      query.mockRejectedValue(new Error('extension "vector" is not available'));
      await service.onModuleInit();
      query.mockReset();
      query.mockResolvedValue([]);
    });

    afterEach(() => {
      logged.mockRestore();
    });

    it('logs an actionable reason on boot rather than throwing', () => {
      expect(logged).toHaveBeenCalledWith(
        expect.stringContaining('pgvector'),
        expect.stringContaining('is not available'),
      );
    });

    it('reports search as unavailable instead of crashing on boot', async () => {
      await expect(service.search({ q: 'engineer' })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it('silently skips indexing so writes still succeed', async () => {
      await expect(service.indexJob(makeJob())).resolves.toBeUndefined();
      expect(embeddings.embed).not.toHaveBeenCalled();
    });
  });
});
