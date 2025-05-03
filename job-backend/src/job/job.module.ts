// src/job/job.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobService } from './job.service';
import { JobController } from './job.controller';
import { Job } from './job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [JobService],
  controllers: [JobController],
  exports: [JobService],
})
export class JobModule {}