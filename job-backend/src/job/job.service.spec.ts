import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobService } from './job.service';
import { Job } from './job.entity';
import { JobSearchService } from '../search/job-search.service';

const OWNER_ID = 7;
const OTHER_USER_ID = 8;

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
    ownerId: OWNER_ID,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeQueryBuilder() {
  return {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
  };
}

describe('JobService', () => {
  let service: JobService;
  let repository: jest.Mocked<Repository<Job>>;
  let search: jest.Mocked<Pick<JobSearchService, 'indexJob' | 'search'>>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    } as unknown as jest.Mocked<Repository<Job>>;

    search = { indexJob: jest.fn(), search: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobService,
        { provide: getRepositoryToken(Job), useValue: repository },
        { provide: JobSearchService, useValue: search },
      ],
    }).compile();

    service = module.get<JobService>(JobService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    beforeEach(() => {
      const job = makeJob();
      repository.create.mockReturnValue(job);
      repository.save.mockResolvedValue(job);
    });

    it('composes salaryRange from the separate salary fields', async () => {
      await service.create(
        { ...makeJob(), salaryFrom: 90, salaryTo: 120 } as never,
        OWNER_ID,
      );

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ salaryRange: '90-120' }),
      );
    });

    it('takes ownership from the authenticated user, not the request body', async () => {
      await service.create({ ...makeJob(), ownerId: 999 } as never, OWNER_ID);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerId: OWNER_ID }),
      );
    });

    it('indexes the saved job for semantic search', async () => {
      await service.create(makeJob() as never, OWNER_ID);

      expect(search.indexJob).toHaveBeenCalledWith(makeJob());
    });

    it('still returns the job when indexing fails, and logs why', async () => {
      search.indexJob.mockRejectedValue(new Error('model unavailable'));
      // Spying also keeps the expected stack trace out of the test output.
      const logged = jest
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});

      await expect(
        service.create(makeJob() as never, OWNER_ID),
      ).resolves.toEqual(makeJob());

      expect(logged).toHaveBeenCalledWith(
        expect.stringContaining('Failed to index job 1'),
        expect.stringContaining('model unavailable'),
      );
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException for a missing id', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(42)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('returns the job when it exists', async () => {
      const job = makeJob();
      repository.findOne.mockResolvedValue(job);

      await expect(service.findOne(1)).resolves.toBe(job);
    });
  });

  describe('findOnePublished', () => {
    it('does not distinguish a draft from a missing job', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOnePublished(1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: 1, isDraft: false },
      });
    });
  });

  describe('authorization', () => {
    it('lets an owner update their own posting', async () => {
      const job = makeJob();
      repository.findOne.mockResolvedValue(job);
      repository.save.mockResolvedValue(job);

      await expect(
        service.update(1, { title: 'Renamed' }, OWNER_ID),
      ).resolves.toBe(job);
    });

    it('refuses an update from a different user', async () => {
      repository.findOne.mockResolvedValue(makeJob());

      await expect(
        service.update(1, { title: 'Hijacked' }, OTHER_USER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('refuses a delete from a different user', async () => {
      repository.findOne.mockResolvedValue(makeJob());

      await expect(service.remove(1, OTHER_USER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('treats an unowned legacy posting as read-only', async () => {
      repository.findOne.mockResolvedValue(makeJob({ ownerId: null }));

      await expect(service.remove(1, OWNER_ID)).rejects.toThrow(
        /claim-orphans/,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('reports a missing job as 404 before checking ownership', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(42, OWNER_ID)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('deletes when the owner matches', async () => {
      repository.findOne.mockResolvedValue(makeJob());
      repository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove(1, OWNER_ID)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith(1);
    });
  });

  describe('draft visibility', () => {
    it('keeps drafts out of the public listing', async () => {
      repository.find.mockResolvedValue([]);

      await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: { isDraft: false },
      });
    });

    it('scopes drafts to the requesting user', async () => {
      repository.find.mockResolvedValue([]);

      await service.findDrafts(OWNER_ID);

      expect(repository.find).toHaveBeenCalledWith({
        where: { isDraft: true, ownerId: OWNER_ID },
      });
    });

    it('excludes drafts from filtered results', async () => {
      const queryBuilder = makeQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(queryBuilder as never);

      await service.filter({ location: 'remote' });

      expect(queryBuilder.where).toHaveBeenCalledWith('job.isDraft = false');
    });
  });

  describe('clearOwnJobs', () => {
    it('deletes only the caller’s postings', async () => {
      repository.delete.mockResolvedValue({ affected: 3, raw: [] });

      await expect(service.clearOwnJobs(OWNER_ID)).resolves.toEqual({
        deleted: 3,
      });
      expect(repository.delete).toHaveBeenCalledWith({ ownerId: OWNER_ID });
    });
  });

  describe('filter', () => {
    it('only applies the filters that were supplied', async () => {
      const queryBuilder = makeQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(queryBuilder as never);

      await service.filter({ location: 'remote' });

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('job.location'),
        { location: 'remote' },
      );
    });

    it('compares salary bounds numerically, not as strings', async () => {
      const queryBuilder = makeQueryBuilder();
      repository.createQueryBuilder.mockReturnValue(queryBuilder as never);

      await service.filter({ minSalary: 100, maxSalary: 200 });

      const clauses = queryBuilder.andWhere.mock.calls.map(
        ([sql]) => sql as string,
      );
      expect(clauses).toHaveLength(2);
      expect(clauses.every((sql) => sql.includes('::int'))).toBe(true);
    });
  });

  it('delegates semantic search to JobSearchService', async () => {
    const hits = [{ job: makeJob(), similarity: 0.87 }];
    search.search.mockResolvedValue(hits);

    await expect(service.semanticSearch({ q: 'remote backend' })).resolves.toBe(
      hits,
    );
  });
});
