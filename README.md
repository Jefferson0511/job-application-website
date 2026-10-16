# Job Application Marketplace

A two-sided job marketplace platform built end to end: job seekers can browse and filter listings, and employers can create and manage postings.

**Live:** [job-application-website-flame.vercel.app](https://job-application-website-flame.vercel.app)

## Stack
- **Frontend:** Next.js
- **Backend:** Node.js, NestJS, TypeORM, TypeScript (strict mode)
- **Database:** PostgreSQL (Neon), with pgvector-backed semantic search over job postings
- **Infra:** Docker (multi-stage build), GitHub Actions CI (lint, typecheck, tests on every PR)
- **Deployment:** Vercel (frontend), Railway (backend)

## What it does
- Full job listing CRUD with multi-field filtering (title, location, job type, salary range)
- Employer-side job creation flow, with partial support for candidate discovery
- User authentication
- Semantic search combining structured filters with embedding-based similarity ranking (all-MiniLM-L6-v2 via Transformers.js)

## Engineering notes
This project went through a real audit pass after the initial build. I found and fixed 3 production bugs:
- An unreachable delete route
- A salary filter comparing ranges as strings instead of numbers
- An error handler silently converting 404s into 500s

Backend test coverage grew from 2 non-functional stubs to 41 unit tests and 6 integration tests as part of that process.

## Running locally
[Add your actual setup steps here — install, env vars, migrations, start command]
