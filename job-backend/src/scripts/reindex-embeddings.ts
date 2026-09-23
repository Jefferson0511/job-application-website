/**
 * Backfills semantic-search embeddings for every job already in the database.
 *
 *   npm run search:reindex
 *
 * Safe to re-run: postings whose text has not changed are skipped.
 */
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { JobSearchService } from '../search/job-search.service';

async function main(): Promise<void> {
  const logger = new Logger('Reindex');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const indexed = await app.get(JobSearchService).reindexAll();
    logger.log(`Reindex complete: ${indexed} jobs processed`);
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  new Logger('Reindex').error(
    error instanceof Error ? error.message : String(error),
    error instanceof Error ? error.stack : undefined,
  );
  process.exitCode = 1;
});
