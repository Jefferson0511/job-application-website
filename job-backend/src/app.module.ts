// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobModule } from './job/job.module';
import { Job } from './job/job.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'jeff@0511',
      database: 'postgres',
      entities: [Job],
      synchronize: true,
    }),
    JobModule,
  ],
})
export class AppModule {}
