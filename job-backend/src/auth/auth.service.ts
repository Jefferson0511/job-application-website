import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CredentialsDto } from './dto/credentials.dto';

/** What a successful register or login hands back to the client. */
export interface AuthResult {
  accessToken: string;
  user: { id: number; email: string };
}

/** The shape encoded into, and decoded from, the JWT. */
export interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  // 10 rounds is the usual balance between resistance to offline cracking and
  // keeping login latency tolerable.
  private static readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: CredentialsDto): Promise<AuthResult> {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      AuthService.SALT_ROUNDS,
    );
    const user = await this.users.save(
      this.users.create({ email: dto.email, passwordHash }),
    );

    return this.sign(user);
  }

  async login(dto: CredentialsDto): Promise<AuthResult> {
    // passwordHash is `select: false` on the entity, so ask for it explicitly.
    const user = await this.users.findOne({
      where: { email: dto.email },
      select: { id: true, email: true, passwordHash: true },
    });

    // Hash a throwaway value when the account does not exist so that a missing
    // email and a wrong password take roughly the same time to reject, and the
    // response cannot be used to enumerate registered addresses.
    const hash = user?.passwordHash ?? (await AuthService.dummyHash());
    const matches = await bcrypt.compare(dto.password, hash);

    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.sign(user);
  }

  async findById(id: number): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  private sign(user: User): AuthResult {
    const payload: JwtPayload = { sub: user.id, email: user.email };
    return {
      accessToken: this.jwt.sign(payload),
      user: { id: user.id, email: user.email },
    };
  }

  /** Cached so the timing-equalising compare does not pay a hash per request. */
  private static dummyHashPromise?: Promise<string>;
  private static dummyHash(): Promise<string> {
    AuthService.dummyHashPromise ??= bcrypt.hash(
      'invalid-password-placeholder',
      AuthService.SALT_ROUNDS,
    );
    return AuthService.dummyHashPromise;
  }
}
