import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, HttpException, HttpStatus } from '@nestjs/common';
import { JobService } from './job.service';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';

@Controller('api/jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post()
  async create(@Body() createJobDto: CreateJobDto): Promise<Job> {
    try {
      console.log('Creating job with data:', createJobDto);  // Log request data
      const job = await this.jobService.create(createJobDto);
      console.log('Job created:', job);  // Log the created job
      return job;
    } catch (error) {
      console.error('Error creating job:', error);
      throw new HttpException('Failed to create job', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('filter')
  async filter(@Query() filters: FilterJobDto): Promise<Job[]> {
    try {
      console.log('Filtering jobs with:', filters);
      return this.jobService.filter(filters);
    } catch (error) {
      console.error('Error filtering jobs:', error);
      throw new HttpException('Failed to filter jobs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get()
  async findAll(): Promise<Job[]> {
    try {
      console.log('Fetching all jobs');
      const jobs = await this.jobService.findAll();
      console.log('Jobs found:', jobs);  // Log fetched jobs
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new HttpException('Failed to fetch jobs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('filter')
  async filterPost(@Body() filterDto: FilterJobDto): Promise<Job[]> {
    try {
      console.log('Filtering jobs with parameters (POST):', filterDto);
      const jobs = await this.jobService.filter(filterDto);
      console.log('Filtered jobs:', jobs);
      return jobs;
    } catch (error) {
      console.error('Error filtering jobs:', error);
      throw new HttpException('Failed to filter jobs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('drafts')
  async findDrafts(): Promise<Job[]> {
    try {
      console.log('Fetching job drafts');
      const drafts = await this.jobService.findDrafts();
      console.log('Draft jobs:', drafts);  // Log draft jobs
      return drafts;
    } catch (error) {
      console.error('Error fetching drafts:', error);
      throw new HttpException('Failed to fetch drafts', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('published')
  async findPublished(): Promise<Job[]> {
    try {
      console.log('Fetching published jobs');
      const published = await this.jobService.findPublished();
      console.log('Published jobs:', published);  // Log published jobs
      return published;
    } catch (error) {
      console.error('Error fetching published jobs:', error);
      throw new HttpException('Failed to fetch published jobs', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Job> {
    try {
      console.log(`Fetching job with ID: ${id}`);
      const job = await this.jobService.findOne(id);
      console.log('Job found:', job);  // Log job found
      return job;
    } catch (error) {
      console.error('Error fetching job:', error);
      throw new HttpException('Job not found', HttpStatus.NOT_FOUND);
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
  ): Promise<Job> {
    try {
      console.log(`Updating job with ID: ${id}`, updateJobDto);  // Log request data
      const job = await this.jobService.update(id, updateJobDto);
      console.log('Updated job:', job);  // Log updated job
      return job;
    } catch (error) {
      console.error('Error updating job:', error);
      throw new HttpException('Failed to update job', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      console.log(`Deleting job with ID: ${id}`);
      await this.jobService.remove(id);
      console.log(`Job with ID: ${id} deleted`);
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new HttpException('Failed to delete job', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Delete('clear')
clearAllJobs() {
  return this.jobService.clearAllJobs();
}

}
