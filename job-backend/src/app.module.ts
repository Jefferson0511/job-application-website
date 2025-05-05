// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JobModule } from './job/job.module';
import { Job } from './job/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot(), // Load environment variables
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // ✅ Use the full DB URL
      entities: [Job],
      synchronize: true, // set to false in production if you use migrations
      ssl: {
        rejectUnauthorized: false, // required for Neon and Railway
      },
    }),
    JobModule,
  ],
})
export class AppModule {}
