import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { Job } from './../src/job/job.entity';

/**
 * End-to-end proof that search matches meaning rather than keywords: every
 * query below is deliberately worded so that the posting it should rank first
 * shares no distinctive words with it.
 *
 * Requires a Postgres with pgvector (see docker-compose.yml) and downloads the
 * embedding model on first run, so it is slower than the unit suite.
 */
const SEED: Array<Partial<Job>> = [
  {
    title: 'Backend Engineer',
    company: 'Northwind',
    location: 'remote',
    jobType: 'full-time',
    salaryRange: '120-160',
    description:
      'Design and operate REST services that power our marketplace. You will own database schema design, query performance and the deployment pipeline.',
    requirements: 'Node.js, PostgreSQL, Docker, CI/CD',
    responsibilities: 'Build APIs, tune queries, run the on-call rotation',
    deadline: '2026-12-31',
    isDraft: false,
  },
  {
    title: 'Pastry Chef',
    company: 'Maison Claire',
    location: 'onsite',
    jobType: 'full-time',
    salaryRange: '40-60',
    description:
      'Produce viennoiserie and plated desserts for a busy service. You will manage the morning bake and train junior commis.',
    requirements: 'Culinary diploma, laminated dough experience',
    responsibilities: 'Bake, plate desserts, manage stock rotation',
    deadline: '2026-12-31',
    isDraft: false,
  },
  {
    title: 'Graphic Designer',
    company: 'Studio Ora',
    location: 'hybrid',
    jobType: 'contract',
    salaryRange: '50-80',
    description:
      'Create brand identity systems, campaign artwork and packaging for consumer clients.',
    requirements: 'Figma, Illustrator, strong typographic sense',
    responsibilities: 'Design brand assets, present concepts to clients',
    deadline: '2026-12-31',
    isDraft: false,
  },
];

interface SearchHit {
  job: Job;
  similarity: number;
}

const SEED_EMAIL = 'semantic-search-e2e@example.com';

describe('Semantic job search (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let token: string;

  /** supertest types `body` as `any`; narrow it once at the boundary. */
  const search = async (
    query: Record<string, string | number>,
  ): Promise<SearchHit[]> => {
    const response = await request(app.getHttpServer() as never)
      .get('/api/jobs/search')
      .query(query)
      .expect(200);
    return response.body as SearchHit[];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query('DELETE FROM job');
    await dataSource.query('DELETE FROM "user" WHERE email = $1', [SEED_EMAIL]);

    // Creating postings now requires a token, so the suite registers its own
    // account rather than reaching past the API to insert rows directly.
    const registered = await request(app.getHttpServer() as never)
      .post('/api/auth/register')
      .send({ email: SEED_EMAIL, password: 'seed-account-password' })
      .expect(201);
    token = (registered.body as { accessToken: string }).accessToken;

    for (const job of SEED) {
      await request(app.getHttpServer() as never)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send(job)
        .expect(201);
    }
  }, 300_000);

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query('DELETE FROM job');
      await dataSource.query('DELETE FROM "user" WHERE email = $1', [
        SEED_EMAIL,
      ]);
    }
    await app?.close();
  });

  it('ranks the engineering role first for a query with no shared keywords', async () => {
    const hits = await search({
      q: 'someone to maintain our server side code and databases',
    });

    expect(hits[0]?.job.title).toBe('Backend Engineer');
    expect(hits[0]?.similarity).toBeGreaterThan(hits[1]?.similarity ?? 1);
  }, 120_000);

  it('ranks the kitchen role first for a differently-worded food query', async () => {
    const hits = await search({
      q: 'making croissants and cakes in a restaurant kitchen',
    });

    expect(hits[0]?.job.title).toBe('Pastry Chef');
  }, 120_000);

  it('ranks the visual role first for a query about creative work', async () => {
    const hits = await search({
      q: 'visual identity and layout work for marketing materials',
    });

    expect(hits[0]?.job.title).toBe('Graphic Designer');
  }, 120_000);

  it('applies structured filters alongside the vector ranking', async () => {
    const hits = await search({ q: 'engineering work', jobType: 'contract' });

    expect(hits).toHaveLength(1);
    expect(hits[0]?.job.jobType).toBe('contract');
  }, 120_000);

  it('returns similarity scores in the unit interval', async () => {
    const hits = await search({ q: 'software engineering', limit: 3 });

    for (const hit of hits) {
      expect(hit.similarity).toBeGreaterThanOrEqual(0);
      expect(hit.similarity).toBeLessThanOrEqual(1);
    }
  }, 120_000);

  it('rejects a search with no query', async () => {
    await request(app.getHttpServer() as never)
      .get('/api/jobs/search')
      .expect(400);
  });
});
