// src/job/job.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere, QueryBuilder } from 'typeorm';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { FilterJobDto } from './dto/filter-job.dto';

@Injectable()
export class JobService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
  ) {}

  async create(createJobDto: CreateJobDto): Promise<Job> {
    // If separate salary fields are provided, create a range string
    if (createJobDto.salaryFrom !== undefined && createJobDto.salaryTo !== undefined) {
      createJobDto.salaryRange = `${createJobDto.salaryFrom}-${createJobDto.salaryTo}`;
    }

    const job = this.jobRepository.create(createJobDto);
    return this.jobRepository.save(job);
  }

  async findAll(): Promise<Job[]> {
    try {
      console.log('Attempting to fetch all jobs');
      const jobs = await this.jobRepository.find();
      console.log('Jobs found:', jobs);
      return jobs;
    } catch (error) {
      console.error('Error fetching jobs:', error);
      throw new Error(`Failed to fetch jobs from backend: ${error.message}`);
    }
  }

  async findOne(id: number): Promise<Job> {
    const job = await this.jobRepository.findOne({ where: { id } });
    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
    return job;
  }

  async update(id: number, updateJobDto: UpdateJobDto): Promise<Job> {
    const job = await this.findOne(id);
    Object.assign(job, updateJobDto);
    return this.jobRepository.save(job);
  }

  async remove(id: number): Promise<void> {
    const result = await this.jobRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }
  }

  async filter(filters: FilterJobDto): Promise<Job[]> {
    try {
      console.log('Received filters:', {
        title: filters.title,
        location: filters.location,
        jobType: filters.jobType,
        minSalary: filters.minSalary,
        maxSalary: filters.maxSalary
      });
      
      const queryBuilder = this.jobRepository.createQueryBuilder('job');
      
      // Start with a base condition that will always be true
      queryBuilder.where('1=1');
      
      if (filters.title) {
        queryBuilder.andWhere('LOWER(job.title) LIKE LOWER(:title)', { title: `%${filters.title}%` });
      }
      
      if (filters.location) {
        console.log('Applying location filter:', filters.location);
        queryBuilder.andWhere('LOWER(job.location) = LOWER(:location)', { location: filters.location });
      }
      
      if (filters.jobType) {
        console.log('Applying jobType filter:', filters.jobType);
        queryBuilder.andWhere('LOWER(job.jobType) = LOWER(:jobType)', { jobType: filters.jobType });
      }

      if (filters.minSalary !== undefined && filters.maxSalary !== undefined) {
        const minRange = `${filters.minSalary}-0`;
        const maxRange = `${filters.maxSalary}-999999`;
        queryBuilder.andWhere('job.salaryRange BETWEEN :min AND :max', {
          min: minRange,
          max: maxRange
        });
      }

      // Log the generated SQL query
      console.log('Generated SQL query:', queryBuilder.getQuery());
      
      const jobs = await queryBuilder.getMany();
      console.log('Filtered jobs:', jobs);
      return jobs;
    } catch (error) {
      console.error('Error filtering jobs:', {
        error: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to filter jobs: ${error.message}`);
    }
  }
  
  async clearAllJobs(): Promise<void> {
    await this.jobRepository.clear(); // if using TypeORM
    // or: await this.jobModel.deleteMany({}); // if using Mongoose
  }
  
  async findDrafts(): Promise<Job[]> {
    return this.jobRepository.find({ where: { isDraft: true } });
  }

  async findPublished(): Promise<Job[]> {
    return this.jobRepository.find({ where: { isDraft: false } });
  }
}
