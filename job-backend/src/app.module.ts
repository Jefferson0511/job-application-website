import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JobModule } from './job/job.module';
import { Job } from './job/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // Load .env file globally
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,           // Use full database URL from .env
      entities: [Job],                          // Your entity here
      synchronize: true,                        // Set false in production
      logging: true,                            // Optional: shows SQL logs
    }),
    JobModule,
  ],
})
export class AppModule {}
