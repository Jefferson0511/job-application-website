import { Test, TestingModule } from '@nestjs/testing';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import request from 'supertest';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { IS_PUBLIC_KEY } from '../auth/public.decorator';

const USER = { id: 7, email: 'owner@example.com' };

/**
 * Stands in for JwtAuthGuard: honours @Public() the same way, and attaches a
 * fixed user to guarded requests. Token verification itself is covered by the
 * auth e2e suite; what matters here is which routes demand a user at all.
 */
class StubAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    if (!StubAuthGuard.authenticated) {
      // Mirrors the real guard, which rejects a missing token with 401.
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<{ user?: unknown }>();
    request.user = USER;
    return true;
  }

  /** Flipped per test to simulate an anonymous caller. */
  static authenticated = true;
}

/**
 * These run against a real Nest HTTP stack with the service mocked out, which
 * is what makes them able to catch route-ordering regressions: a literal path
 * declared after ':id' gets swallowed by the wildcard and never reaches the
 * handler these assertions check.
 */
describe('JobController', () => {
  let app: INestApplication;
  let jobService: jest.Mocked<
    Pick<
      JobService,
      | 'findAll'
      | 'findOnePublished'
      | 'findDrafts'
      | 'findPublished'
      | 'filter'
      | 'semanticSearch'
      | 'clearOwnJobs'
      | 'create'
      | 'update'
      | 'remove'
    >
  >;

  beforeEach(async () => {
    StubAuthGuard.authenticated = true;
    jobService = {
      findAll: jest.fn().mockResolvedValue([]),
      findOnePublished: jest.fn().mockResolvedValue(null),
      findDrafts: jest.fn().mockResolvedValue([]),
      findPublished: jest.fn().mockResolvedValue([]),
      filter: jest.fn().mockResolvedValue([]),
      semanticSearch: jest.fn().mockResolvedValue([]),
      clearOwnJobs: jest.fn().mockResolvedValue({ deleted: 0 }),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      remove: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobController],
      providers: [
        { provide: JobService, useValue: jobService },
        {
          provide: APP_GUARD,
          useFactory: (reflector: Reflector) => new StubAuthGuard(reflector),
          inject: [Reflector],
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app.get(JobController)).toBeDefined();
  });

  describe('route ordering', () => {
    it('routes GET /api/jobs/search to semantic search, not to :id', async () => {
      await request(app.getHttpServer())
        .get('/api/jobs/search')
        .query({ q: 'remote backend work' })
        .expect(200);

      expect(jobService.semanticSearch).toHaveBeenCalled();
      expect(jobService.findOnePublished).not.toHaveBeenCalled();
    });

    it('routes GET /api/jobs/drafts to findDrafts, not to :id', async () => {
      await request(app.getHttpServer()).get('/api/jobs/drafts').expect(200);

      expect(jobService.findDrafts).toHaveBeenCalledWith(USER.id);
      expect(jobService.findOnePublished).not.toHaveBeenCalled();
    });

    it('routes DELETE /api/jobs/clear to clearOwnJobs, not to :id', async () => {
      await request(app.getHttpServer()).delete('/api/jobs/clear').expect(200);

      expect(jobService.clearOwnJobs).toHaveBeenCalledWith(USER.id);
      expect(jobService.remove).not.toHaveBeenCalled();
    });

    it('still routes a numeric id to findOnePublished', async () => {
      await request(app.getHttpServer()).get('/api/jobs/7').expect(200);

      expect(jobService.findOnePublished).toHaveBeenCalledWith(7);
    });
  });

  describe('which routes require authentication', () => {
    beforeEach(() => {
      StubAuthGuard.authenticated = false;
    });

    it.each([
      ['get', '/api/jobs'],
      ['get', '/api/jobs/published'],
      ['get', '/api/jobs/filter'],
      ['get', '/api/jobs/7'],
    ])('allows anonymous %s %s', async (method, path) => {
      await request(app.getHttpServer())[method as 'get'](path).expect(200);
    });

    it('allows anonymous search', async () => {
      await request(app.getHttpServer())
        .get('/api/jobs/search')
        .query({ q: 'engineer' })
        .expect(200);
    });

    it.each([
      ['post', '/api/jobs'],
      ['patch', '/api/jobs/7'],
      ['delete', '/api/jobs/7'],
      ['delete', '/api/jobs/clear'],
      ['get', '/api/jobs/drafts'],
    ])('rejects anonymous %s %s', async (method, path) => {
      await request(app.getHttpServer())[method as 'get'](path).expect(401);
    });
  });

  describe('passing the authenticated user through', () => {
    it('creates with the caller as owner', async () => {
      await request(app.getHttpServer())
        .post('/api/jobs')
        .send({
          title: 'Backend Engineer',
          company: 'Acme',
          location: 'remote',
          jobType: 'full-time',
          description: 'Build services',
          requirements: 'TypeScript',
          responsibilities: 'Ship features',
          deadline: '2026-12-01',
        })
        .expect(201);

      expect(jobService.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Backend Engineer' }),
        USER.id,
      );
    });

    it('passes the caller into update and delete', async () => {
      await request(app.getHttpServer())
        .patch('/api/jobs/7')
        .send({ title: 'Renamed' })
        .expect(200);
      expect(jobService.update).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ title: 'Renamed' }),
        USER.id,
      );

      await request(app.getHttpServer()).delete('/api/jobs/7').expect(200);
      expect(jobService.remove).toHaveBeenCalledWith(7, USER.id);
    });
  });

  describe('GET /api/jobs/search validation', () => {
    it('rejects a request with no query', async () => {
      await request(app.getHttpServer()).get('/api/jobs/search').expect(400);
    });

    it('rejects an out-of-range limit', async () => {
      await request(app.getHttpServer())
        .get('/api/jobs/search')
        .query({ q: 'engineer', limit: 500 })
        .expect(400);
    });

    it('coerces numeric query-string params to numbers', async () => {
      await request(app.getHttpServer())
        .get('/api/jobs/search')
        .query({ q: 'engineer', limit: '5', minSimilarity: '0.4' })
        .expect(200);

      expect(jobService.semanticSearch).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 5, minSimilarity: 0.4 }),
      );
    });
  });
});
