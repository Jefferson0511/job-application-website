/**
 * Assigns ownership of postings created before authentication existed.
 *
 *   npm run auth:claim-orphans -- someone@example.com
 *
 * Those rows have a null ownerId, which the API treats as read-only. This
 * gives them an owner so they can be edited again. The account must already
 * exist; register through POST /api/auth/register first.
 */
import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource, IsNull } from 'typeorm';
import { AppModule } from '../app.module';
import { Job } from '../job/job.entity';
import { User } from '../auth/user.entity';

async function main(): Promise<void> {
  const logger = new Logger('ClaimOrphans');
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      'Usage: npm run auth:claim-orphans -- <email-of-existing-account>',
    );
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const dataSource = app.get(DataSource);
    const user = await dataSource
      .getRepository(User)
      .findOne({ where: { email } });

    if (!user) {
      throw new Error(
        `No account found for ${email}. Register it first via POST /api/auth/register.`,
      );
    }

    const result = await dataSource
      .getRepository(Job)
      .update({ ownerId: IsNull() }, { ownerId: user.id });

    logger.log(
      `Assigned ${result.affected ?? 0} orphaned postings to ${email}`,
    );
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  new Logger('ClaimOrphans').error(
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
