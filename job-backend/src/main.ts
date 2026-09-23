// src/main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { EmbeddingService } from './search/embedding.service';

const DEFAULT_PORT = 3002;

/** Extra origins can be supplied as a comma-separated CORS_ORIGINS env var. */
function allowedOrigins(): string[] {
  const configured = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [
    'http://localhost:3000',
    'https://job-application-website-flame.vercel.app',
    ...configured,
  ];
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Fail fast on a bad DATABASE_URL rather than surfacing it as a 500 on the
  // first request.
  const dataSource = app.get(DataSource);
  if (!dataSource.isInitialized) {
    throw new Error('Database connection was not initialized');
  }
  logger.log('Database connection established successfully');

  const origins = allowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // A missing Origin header means a same-origin or non-browser client.
      if (!origin || origins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Pull the embedding model into memory now so the first search is fast.
  // Failure here is not fatal: the model is retried on demand.
  app
    .get(EmbeddingService)
    .warmUp()
    .catch((error: unknown) =>
      logger.warn(
        `Embedding model warm-up failed, will retry on first search: ${
          error instanceof Error ? error.message : String(error)
        }`,
      ),
    );

  const port = Number(process.env.PORT ?? DEFAULT_PORT);
  await app.listen(port);
  logger.log(`API listening on port ${port}`);
}

void bootstrap();
