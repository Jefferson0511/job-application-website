import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { JobService } from './job.service';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';
import { SemanticSearchDto } from '../search/dto/semantic-search.dto';
import { JobSearchHit } from '../search/job-search.service';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/jwt.strategy';

/**
 * Reading postings is public; creating and modifying them is not. The
 * JwtAuthGuard is registered globally, so the @Public() routes below are the
 * explicit exceptions and anything new is protected by default.
 *
 * Route order matters: every literal path segment ('search', 'filter',
 * 'drafts', 'published', 'clear') must be declared before the ':id' wildcard,
 * or Nest matches the wildcard first and ParseIntPipe rejects the request.
 */
@Controller('api/jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Job> {
    return this.jobService.create(createJobDto, user.id);
  }

  /** Meaning-based search: GET /api/jobs/search?q=remote+backend+work */
  @Public()
  @Get('search')
  async search(@Query() dto: SemanticSearchDto): Promise<JobSearchHit[]> {
    return this.jobService.semanticSearch(dto);
  }

  @Public()
  @Get('filter')
  async filter(@Query() filters: FilterJobDto): Promise<Job[]> {
    return this.jobService.filter(filters);
  }

  @Public()
  @Post('filter')
  async filterPost(@Body() filterDto: FilterJobDto): Promise<Job[]> {
    return this.jobService.filter(filterDto);
  }

  /** Your own unpublished postings. */
  @Get('drafts')
  async findDrafts(@CurrentUser() user: AuthenticatedUser): Promise<Job[]> {
    return this.jobService.findDrafts(user.id);
  }

  @Public()
  @Get('published')
  async findPublished(): Promise<Job[]> {
    return this.jobService.findPublished();
  }

  /** Deletes every posting you own. */
  @Delete('clear')
  async clearOwnJobs(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ deleted: number }> {
    return this.jobService.clearOwnJobs(user.id);
  }

  @Public()
  @Get()
  async findAll(): Promise<Job[]> {
    return this.jobService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Job> {
    return this.jobService.findOnePublished(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Job> {
    return this.jobService.update(id, updateJobDto, user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.jobService.remove(id, user.id);
  }
}
