import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmbeddingService } from './embedding.service';
import { JobSearchService } from './job-search.service';
import { Job } from '../job/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [EmbeddingService, JobSearchService],
  exports: [EmbeddingService, JobSearchService],
})
export class SearchModule {}
