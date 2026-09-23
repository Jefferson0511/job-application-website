// src/job/job.service.ts
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { SemanticSearchDto } from '../search/dto/semantic-search.dto';
import { JobSearchService, JobSearchHit } from '../search/job-search.service';

@Injectable()
export class JobService {
  private readonly logger = new Logger(JobService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly jobSearchService: JobSearchService,
  ) {}

  async create(createJobDto: CreateJobDto, ownerId: number): Promise<Job> {
    // If separate salary fields are provided, create a range string
    if (
      createJobDto.salaryFrom !== undefined &&
      createJobDto.salaryTo !== undefined
    ) {
      createJobDto.salaryRange = `${createJobDto.salaryFrom}-${createJobDto.salaryTo}`;
    }

    // Ownership comes from the authenticated token, never from the request
    // body, so a client cannot post a job into someone else's name.
    const job = this.jobRepository.create({ ...createJobDto, ownerId });
    const saved = await this.jobRepository.save(job);
    await this.index(saved);
    return saved;
  }

  /**
   * Public listing. Drafts belong to their author until published, so they are
   * excluded here and served only by findDrafts, which requires a token.
   */
  async findAll(): Promise<Job[]> {
    return this.jobRepository.find({ where: { isDraft: false } });
  }

  /** Used internally by the write paths, which need the row regardless of draft state. */
  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  /** Public single-job read: a draft is indistinguishable from a missing job. */
  async findOnePublished(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({
      where: { id, isDraft: false },
    });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async update(
    id: number,
    updateJobDto: UpdateJobDto,
    actorId: number,
  ): Promise<Job> {
    const job = await this.findOne(id);
    JobService.assertOwnedBy(job, actorId);

    Object.assign(job, updateJobDto);
    const saved = await this.jobRepository.save(job);
    await this.index(saved);
    return saved;
  }

  async remove(id: number, actorId: number): Promise<void> {
    const job = await this.findOne(id);
    JobService.assertOwnedBy(job, actorId);

    // The job_embedding row is removed by its ON DELETE CASCADE foreign key.
    await this.jobRepository.delete(id);
  }

  /**
   * Authorization for the write paths.
   *
   * Deliberately throws 403 rather than 404 for a posting owned by someone
   * else: the listing endpoints are public, so which jobs exist is not a
   * secret worth hiding behind a misleading status code.
   */
  private static assertOwnedBy(job: Job, actorId: number): void {
    if (job.ownerId === null) {
      throw new ForbiddenException(
        `Job ${job.id} predates authentication and has no owner. ` +
          'Assign it with `npm run auth:claim-orphans -- <email>` before editing.',
      );
    }

    if (job.ownerId !== actorId) {
      throw new ForbiddenException('You can only modify your own postings');
    }
  }

  async filter(filters: FilterJobDto): Promise<Job[]> {
    const queryBuilder = this.jobRepository.createQueryBuilder('job');

    // Public endpoint, so drafts stay out regardless of the other filters.
    queryBuilder.where('job.isDraft = false');

    if (filters.title) {
      queryBuilder.andWhere('LOWER(job.title) LIKE LOWER(:title)', {
        title: `%${filters.title}%`,
      });
    }

    if (filters.location) {
      queryBuilder.andWhere('LOWER(job.location) = LOWER(:location)', {
        location: filters.location,
      });
    }

    if (filters.jobType) {
      queryBuilder.andWhere('LOWER(job.jobType) = LOWER(:jobType)', {
        jobType: filters.jobType,
      });
    }

    // salaryRange is stored as a "from-to" string, so the bounds have to be
    // pulled out and compared as integers. The previous BETWEEN compared the
    // raw strings, which sorted "90-120" above "1000-1200" lexicographically.
    if (filters.minSalary !== undefined) {
      queryBuilder.andWhere(
        `NULLIF(substring(job."salaryRange" from '^[0-9]+'), '')::int >= :minSalary`,
        { minSalary: filters.minSalary },
      );
    }

    if (filters.maxSalary !== undefined) {
      queryBuilder.andWhere(
        `NULLIF(substring(job."salaryRange" from '[0-9]+$'), '')::int <= :maxSalary`,
        { maxSalary: filters.maxSalary },
      );
    }

    return queryBuilder.getMany();
  }

  /** Meaning-based search. See JobSearchService for the vector query. */
  async semanticSearch(dto: SemanticSearchDto): Promise<JobSearchHit[]> {
    return this.jobSearchService.search(dto);
  }

  /**
   * Scoped to the caller. This used to truncate the whole table for anyone who
   * found the route, which is not something an authenticated multi-user API
   * can offer.
   */
  async clearOwnJobs(actorId: number): Promise<{ deleted: number }> {
    const result = await this.jobRepository.delete({ ownerId: actorId });
    return { deleted: result.affected ?? 0 };
  }

  /** A user's own unpublished postings. */
  async findDrafts(actorId: number): Promise<Job[]> {
    return this.jobRepository.find({
      where: { isDraft: true, ownerId: actorId },
    });
  }

  async findPublished(): Promise<Job[]> {
    return this.jobRepository.find({ where: { isDraft: false } });
  }

  /**
   * Indexing must not fail a write. A posting that saved but did not embed is
   * recoverable with `npm run search:reindex`; a 500 on an otherwise good
   * create is not.
   */
  private async index(job: Job): Promise<void> {
    try {
      await this.jobSearchService.indexJob(job);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to index job ${job.id} for semantic search`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
