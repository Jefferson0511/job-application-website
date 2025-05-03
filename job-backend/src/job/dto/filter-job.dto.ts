// src/job/dto/filter-job.dto.ts
import { IsString, IsOptional, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class FilterJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  @IsIn(['remote', 'onsite', 'hybrid'], { message: 'Location must be remote, onsite, or hybrid' })
  location?: string;

  @IsOptional()
  @IsString()
  @IsIn(['full-time', 'part-time', 'contract', 'internship'], { message: 'Job type must be full-time, part-time, contract, or internship' })
  jobType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minSalary?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxSalary?: number;
}