# job-backend

NestJS API for the job marketplace. See the [root README](../README.md) for
architecture, the search API reference, and how to run the whole stack.

## Layout

```
src/
  auth/                 registration, login, JWT, ownership
    auth.service.ts       bcrypt hashing, timing-equalised login
    jwt.strategy.ts       re-reads the user per request
    jwt-auth.guard.ts     registered globally in AppModule
    public.decorator.ts   opts a route out of the global guard
    jwt.config.ts         refuses to start without JWT_SECRET
  job/                  CRUD + structured filtering
    job.controller.ts     literal routes precede ':id' — see the comment there
    job.service.ts        ownership checks live here
    job.entity.ts
    dto/
  search/               semantic search
    embedding.service.ts    text → 384-dim vector, model runs in-process
    job-search.service.ts   pgvector schema, indexing, similarity query
    dto/
  scripts/
    reindex-embeddings.ts   backfill embeddings for existing postings
    claim-orphan-jobs.ts    give pre-auth postings an owner
main.ts                 bootstrap, CORS, ValidationPipe, model warm-up
test/
  auth.e2e-spec.ts              real JWTs, cross-user authorization
  semantic-search.e2e-spec.ts   real model + real pgvector
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Watch mode on port 3002 |
| `npm run build` | Compile to `dist/` |
| `npm run typecheck` | `tsc --noEmit`, strict |
| `npm run lint` | eslint with `--fix` |
| `npm run lint:ci` | eslint, fails on any warning |
| `npm test` | Unit tests (model mocked) |
| `npm run test:e2e` | Integration tests (needs `DATABASE_URL` with pgvector) |
| `npm run search:reindex` | Backfill embeddings; safe to re-run |
| `npm run auth:claim-orphans -- <email>` | Assign pre-auth postings to an account |

## Configuration

Copy `.env.example` to `.env`. `DATABASE_URL` and `JWT_SECRET` are both
required — the app refuses to start without a secret rather than falling back
to a default — and the database must have the pgvector extension available.
