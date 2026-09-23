import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { AppModule } from './../src/app.module';

/**
 * Exercises the real JWT path end to end: a token issued by /api/auth/login
 * is what actually unlocks the write routes, and one user's token must not
 * unlock another user's postings.
 */
const ALICE = { email: 'alice-e2e@example.com', password: 'alice-password-1' };
const BOB = { email: 'bob-e2e@example.com', password: 'bob-password-1' };

const POSTING = {
  title: 'Platform Engineer',
  company: 'Northwind',
  location: 'remote',
  jobType: 'full-time',
  salaryRange: '120-160',
  description: 'Operate the deployment pipeline.',
  requirements: 'Kubernetes, Terraform',
  responsibilities: 'Keep the platform healthy',
  deadline: '2026-12-31',
  isDraft: false,
};

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const http = () => request(app.getHttpServer() as never);

  const register = async (creds: typeof ALICE): Promise<string> => {
    const response = await http()
      .post('/api/auth/register')
      .send(creds)
      .expect(201);
    return (response.body as { accessToken: string }).accessToken;
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
  }, 300_000);

  beforeEach(async () => {
    await dataSource.query('DELETE FROM job');
    await dataSource.query('DELETE FROM "user" WHERE email LIKE $1', [
      '%-e2e@example.com',
    ]);
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query('DELETE FROM job');
      await dataSource.query('DELETE FROM "user" WHERE email LIKE $1', [
        '%-e2e@example.com',
      ]);
    }
    await app?.close();
  });

  describe('register', () => {
    it('issues a usable token and never returns the password hash', async () => {
      const response = await http()
        .post('/api/auth/register')
        .send(ALICE)
        .expect(201);

      const body = response.body as Record<string, unknown>;
      expect(body.accessToken).toEqual(expect.any(String));
      expect(JSON.stringify(body)).not.toContain('passwordHash');

      await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${body.accessToken as string}`)
        .expect(200, { id: expect.any(Number), email: ALICE.email });
    });

    it('rejects a duplicate email', async () => {
      await register(ALICE);
      await http().post('/api/auth/register').send(ALICE).expect(409);
    });

    it('rejects a password shorter than 8 characters', async () => {
      await http()
        .post('/api/auth/register')
        .send({ email: 'short-e2e@example.com', password: 'abc' })
        .expect(400);
    });

    it('rejects a malformed email', async () => {
      await http()
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'password1' })
        .expect(400);
    });
  });

  describe('login', () => {
    it('returns a token for correct credentials', async () => {
      await register(ALICE);

      const response = await http()
        .post('/api/auth/login')
        .send(ALICE)
        .expect(200);

      expect((response.body as { accessToken: string }).accessToken).toEqual(
        expect.any(String),
      );
    });

    it('is case-insensitive about the email', async () => {
      await register(ALICE);

      await http()
        .post('/api/auth/login')
        .send({ email: ALICE.email.toUpperCase(), password: ALICE.password })
        .expect(200);
    });

    it('rejects a wrong password', async () => {
      await register(ALICE);

      await http()
        .post('/api/auth/login')
        .send({ email: ALICE.email, password: 'wrong-password' })
        .expect(401);
    });

    it('rejects an unknown account with the same status as a wrong password', async () => {
      await http()
        .post('/api/auth/login')
        .send({ email: 'nobody-e2e@example.com', password: 'password1' })
        .expect(401);
    });
  });

  describe('guarded routes', () => {
    it('refuses to create a posting without a token', async () => {
      await http().post('/api/jobs').send(POSTING).expect(401);
    });

    it('refuses a malformed token', async () => {
      await http()
        .post('/api/jobs')
        .set('Authorization', 'Bearer not.a.real.token')
        .send(POSTING)
        .expect(401);
    });

    it('still allows anonymous reads', async () => {
      await http().get('/api/jobs').expect(200);
      await http().get('/api/jobs/published').expect(200);
      await http().get('/api/jobs/search').query({ q: 'engineer' }).expect(200);
    });
  });

  describe('ownership', () => {
    it('records the creating user as the owner', async () => {
      const token = await register(ALICE);

      const created = await http()
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send(POSTING)
        .expect(201);

      const me = await http()
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect((created.body as { ownerId: number }).ownerId).toBe(
        (me.body as { id: number }).id,
      );
    });

    it("stops one user editing another user's posting", async () => {
      const aliceToken = await register(ALICE);
      const bobToken = await register(BOB);

      const created = await http()
        .post('/api/jobs')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send(POSTING)
        .expect(201);
      const id = (created.body as { id: number }).id;

      await http()
        .patch(`/api/jobs/${id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ title: 'Hijacked' })
        .expect(403);

      await http()
        .delete(`/api/jobs/${id}`)
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(403);

      // And the owner can still do both.
      await http()
        .patch(`/api/jobs/${id}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ title: 'Renamed by owner' })
        .expect(200);
    });

    it('keeps drafts out of public listings but shows them to their owner', async () => {
      const aliceToken = await register(ALICE);
      const bobToken = await register(BOB);

      await http()
        .post('/api/jobs')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ ...POSTING, title: 'Secret Draft', isDraft: true })
        .expect(201);

      const publicList = await http().get('/api/jobs').expect(200);
      expect(JSON.stringify(publicList.body)).not.toContain('Secret Draft');

      const aliceDrafts = await http()
        .get('/api/jobs/drafts')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200);
      expect(JSON.stringify(aliceDrafts.body)).toContain('Secret Draft');

      const bobDrafts = await http()
        .get('/api/jobs/drafts')
        .set('Authorization', `Bearer ${bobToken}`)
        .expect(200);
      expect(bobDrafts.body).toEqual([]);
    });

    it('clears only the caller’s own postings', async () => {
      const aliceToken = await register(ALICE);
      const bobToken = await register(BOB);

      await http()
        .post('/api/jobs')
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ ...POSTING, title: 'Alice posting' })
        .expect(201);
      await http()
        .post('/api/jobs')
        .set('Authorization', `Bearer ${bobToken}`)
        .send({ ...POSTING, title: 'Bob posting' })
        .expect(201);

      await http()
        .delete('/api/jobs/clear')
        .set('Authorization', `Bearer ${aliceToken}`)
        .expect(200, { deleted: 1 });

      const remaining = await http().get('/api/jobs').expect(200);
      expect(JSON.stringify(remaining.body)).toContain('Bob posting');
      expect(JSON.stringify(remaining.body)).not.toContain('Alice posting');
    });
  });
});
