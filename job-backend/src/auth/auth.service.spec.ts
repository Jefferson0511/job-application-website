import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let users: jest.Mocked<Repository<User>>;
  let jwt: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    users = {
      findOne: jest.fn(),
      create: jest.fn((input) => input as User),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    jwt = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: users },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('stores a bcrypt hash, never the plaintext password', async () => {
      users.findOne.mockResolvedValue(null);
      users.save.mockImplementation((user) =>
        Promise.resolve({ ...user, id: 1 } as User),
      );

      await service.register({
        email: 'new@example.com',
        password: 'correct horse battery',
      });

      const saved = users.save.mock.calls[0]?.[0] as User;
      expect(saved.passwordHash).not.toContain('correct horse battery');
      expect(saved.passwordHash).toMatch(/^\$2[aby]\$/);
      await expect(
        bcrypt.compare('correct horse battery', saved.passwordHash),
      ).resolves.toBe(true);
    });

    it('rejects an email that is already registered', async () => {
      users.findOne.mockResolvedValue({ id: 1 } as User);

      await expect(
        service.register({ email: 'taken@example.com', password: 'password1' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(users.save).not.toHaveBeenCalled();
    });

    it('returns a token and the user without the hash', async () => {
      users.findOne.mockResolvedValue(null);
      users.save.mockImplementation((user) =>
        Promise.resolve({ ...user, id: 42 } as User),
      );

      const result = await service.register({
        email: 'new@example.com',
        password: 'password1',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 42, email: 'new@example.com' });
      expect(JSON.stringify(result)).not.toContain('passwordHash');
    });

    it('signs the user id as the subject claim', async () => {
      users.findOne.mockResolvedValue(null);
      users.save.mockResolvedValue({
        id: 42,
        email: 'new@example.com',
      } as User);

      await service.register({
        email: 'new@example.com',
        password: 'password1',
      });

      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 42,
        email: 'new@example.com',
      });
    });
  });

  describe('login', () => {
    const password = 'correct horse battery';

    async function existingUser(): Promise<User> {
      return {
        id: 5,
        email: 'user@example.com',
        passwordHash: await bcrypt.hash(password, 10),
      } as User;
    }

    it('accepts the correct password', async () => {
      users.findOne.mockResolvedValue(await existingUser());

      const result = await service.login({
        email: 'user@example.com',
        password,
      });

      expect(result.user).toEqual({ id: 5, email: 'user@example.com' });
    });

    it('asks for the hash explicitly, since the column is select:false', async () => {
      users.findOne.mockResolvedValue(await existingUser());

      await service.login({ email: 'user@example.com', password });

      expect(users.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          select: { id: true, email: true, passwordHash: true },
        }),
      );
    });

    it('rejects a wrong password', async () => {
      users.findOne.mockResolvedValue(await existingUser());

      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('gives the same error for an unknown email, so accounts cannot be enumerated', async () => {
      users.findOne.mockResolvedValue(null);

      const unknown = service.login({
        email: 'nobody@example.com',
        password,
      });
      await expect(unknown).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(unknown).rejects.toThrow('Invalid email or password');

      users.findOne.mockResolvedValue(await existingUser());
      await expect(
        service.login({ email: 'user@example.com', password: 'wrong' }),
      ).rejects.toThrow('Invalid email or password');
    });

    it('still spends time hashing when the account is missing, so timing cannot enumerate accounts', async () => {
      users.findOne.mockResolvedValue(null);

      const started = process.hrtime.bigint();
      await expect(
        service.login({ email: 'nobody@example.com', password }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      const elapsedMs = Number(process.hrtime.bigint() - started) / 1_000_000;

      // A bcrypt comparison at 10 rounds costs tens of milliseconds. Returning
      // early on a missing account would land near zero, which is the leak
      // this guards against; the threshold is far below the real cost so the
      // assertion does not depend on machine speed.
      expect(elapsedMs).toBeGreaterThan(5);
    });
  });
});
