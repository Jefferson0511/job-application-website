// src/job/dto/update-job.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateJobDto } from './create-job.dto';

export class UpdateJobDto extends PartialType(CreateJobDto) {}