// src/job/dto/create-job.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, IsNumber } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: 'Job title is required' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  company: string;

  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location: string;

  @IsString()
  @IsNotEmpty({ message: 'Job type is required' })
  jobType: string;

  @IsOptional()
  @IsString()
  salaryRange?: string;

  @IsOptional()
  @IsNumber()
  salaryFrom?: number;

  @IsOptional()
  @IsNumber()
  salaryTo?: number;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsString()
  @IsNotEmpty({ message: 'Requirements are required' })
  requirements: string;

  @IsString()
  @IsNotEmpty({ message: 'Responsibilities are required' })
  responsibilities: string;

  @IsDateString()
  @IsNotEmpty({ message: 'Deadline is required' })
  deadline: string;

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  experience?: string;
}