import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JobModule } from './job/job.module';
import { SearchModule } from './search/search.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { Job } from './job/job.entity';
import { User } from './auth/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Job, User],
      // Schema auto-sync stays on by default because the project has no
      // migrations yet, but it can silently drop columns, so production
      // deployments should set DB_SYNCHRONIZE=false.
      synchronize: process.env.DB_SYNCHRONIZE !== 'false',
      logging: process.env.DB_LOGGING === 'true',
    }),
    AuthModule,
    JobModule,
    SearchModule,
  ],
  providers: [
    {
      // Authentication is the default for every route in the application.
      // Public endpoints opt out individually with @Public().
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
