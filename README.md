# Job Marketplace

A job posting platform with **semantic search**: candidates describe the work
they want in their own words, and the API ranks postings by meaning rather than
by keyword overlap. A query like *"someone to look after our servers and
databases"* surfaces a DevOps posting that contains none of those words.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Mantine |
| API | NestJS 11, TypeScript in `strict` mode |
| Database | PostgreSQL + [pgvector](https://github.com/pgvector/pgvector) |
| ORM | TypeORM 0.3 |
| Embeddings | `all-MiniLM-L6-v2` via Transformers.js, running locally |
| Auth | JWT via Passport, bcrypt password hashing |
| Validation | class-validator / class-transformer |
| Tests | Jest, supertest |
| CI / packaging | GitHub Actions, multi-stage Docker |

## How semantic search works

```
POST /api/jobs                GET /api/jobs/search?q=...
       │                                │
       ▼                                ▼
  job row saved                  query → embedding
       │                                │
       ▼                                ▼
 text → embedding  ──────►  job_embedding  ──────►  ORDER BY embedding <=> query
   (384 floats)              vector(384)             (HNSW, cosine distance)
                             HNSW index
```

Four decisions worth calling out:

- **Embeddings run locally.** `all-MiniLM-L6-v2` executes in-process through
  ONNX Runtime, so there is no embedding API key to configure, CI exercises the
  real inference path, and anyone who clones the repo can run it. The Docker
  image bakes the model in at build time, so containers start offline.
- **Vectors live in a side table, not on the entity.** TypeORM has no `vector`
  column type, and keeping 384 floats out of `Job` means every existing
  `find()` keeps its current shape and payload size. `job_embedding` is created
  by idempotent DDL at boot, because `CREATE EXTENSION` is outside what
  TypeORM's `synchronize` can do.
- **Re-embedding is content-addressed.** Each row stores a SHA-256 of the text
  it was built from, so editing a salary or toggling a draft flag does not
  re-run inference.
- **Filters are applied in the same query as the ranking.** Narrowing after a
  vector top-K would return a short list that the filters then empty.

If the database has no pgvector extension, search reports itself unavailable
and writes keep working — the API does not fail to boot.

## Quick start

### With Docker (recommended)

```bash
docker compose up --build
```

That starts Postgres with pgvector on `5432` and the API on `3002`. Then run
the frontend on the host:

```bash
npm install
npm run dev            # http://localhost:3000
```

If you already had postings in the database, backfill their embeddings once:

```bash
docker compose exec api npm run search:reindex
```

### Without Docker

You need a PostgreSQL instance **with the pgvector extension available**.

```bash
cd job-backend
cp .env.example .env    # then set DATABASE_URL
npm install
npm run start:dev       # http://localhost:3002
```

## Search API

```
GET /api/jobs/search?q=remote%20backend%20work
```

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `q` | string | required | Natural-language query, max 512 chars |
| `location` | enum | — | `remote` \| `onsite` \| `hybrid` |
| `jobType` | enum | — | `full-time` \| `part-time` \| `contract` \| `internship` |
| `limit` | 1–50 | `10` | |
| `minSimilarity` | 0–1 | `0.2` | Below ~0.2, matches are boilerplate overlap |

Returns hits in descending relevance:

```json
[
  {
    "job": { "id": 3, "title": "Backend Engineer", "company": "Northwind" },
    "similarity": 0.62
  }
]
```

## Authentication

Reading postings is public. Creating and modifying them is not.

```
POST /api/auth/register   { email, password }  -> { accessToken, user }
POST /api/auth/login      { email, password }  -> { accessToken, user }
GET  /api/auth/me                              -> { id, email }
```

Send the token as `Authorization: Bearer <accessToken>`.

| Endpoint | Access |
| --- | --- |
| `GET /api/jobs`, `/published`, `/filter`, `/search`, `/:id` | Public |
| `POST /api/jobs` | Any signed-in user |
| `PATCH`, `DELETE /api/jobs/:id` | The posting's owner only |
| `GET /api/jobs/drafts` | Your own drafts only |
| `DELETE /api/jobs/clear` | Deletes only your own postings |

The design decisions behind it:

- **Authentication is the default.** `JwtAuthGuard` is registered globally and
  public routes opt out with `@Public()`. Defaulting the other way means a new
  endpoint is unprotected until someone remembers to guard it.
- **Ownership comes from the token, never the request body**, so a client
  cannot post a job into someone else's name.
- **Drafts are private to their author.** They are excluded from every public
  read path, and a draft fetched by id is indistinguishable from a missing job.
- **Login is constant-ish time.** An unknown email still pays for a bcrypt
  comparison, so response timing cannot be used to enumerate accounts.
- **`JWT_SECRET` has no default.** The app refuses to start without one, rather
  than letting a development fallback reach production and make every token
  forgeable.

Postings created before authentication existed have no owner and are read-only
through the API. Assign them to an account once:

```bash
npm run auth:claim-orphans -- you@example.com
```

## Tests

```bash
cd job-backend
npm run typecheck      # tsc --noEmit, strict
npm run lint:ci        # eslint, no warnings tolerated
npm test               # unit tests, embeddings mocked
npm run test:e2e       # integration: real model + real pgvector
```

The unit suite mocks the model so it stays fast and offline. The integration
suite does not: it seeds three deliberately unrelated postings (engineering,
pastry, design) and asserts that each is ranked first for a query sharing none
of its distinctive words. That is what proves the search is semantic rather
than lexical, so it runs in CI against a `pgvector/pgvector` service container.

The auth e2e suite registers two real accounts and checks that one user's token
cannot edit or delete the other's postings, that drafts stay private, and that
`DELETE /api/jobs/clear` touches only the caller's rows.

## CI

`.github/workflows/ci.yml` runs on every pull request:

| Job | Checks |
| --- | --- |
| `backend` | lint, strict typecheck, unit tests |
| `backend-integration` | auth and search integration tests against pgvector, with the model cached |
| `frontend` | lint, typecheck, production build |
| `docker` | image builds, contains the compiled app and baked model, runs as non-root |
