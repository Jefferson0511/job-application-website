import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JobModule } from './job/job.module';
import { Job } from './job/job.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // 👈 This loads .env
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // 👈 Use this instead of host/username/password
      entities: [Job],
      synchronize: true,
    }),
    JobModule,
  ],
})
export class AppModule {}
