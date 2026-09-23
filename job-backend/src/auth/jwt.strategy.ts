import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from './auth.service';
import { jwtSecret } from './jwt.config';

/** What the guard attaches to `request.user`. */
export interface AuthenticatedUser {
  id: number;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret(),
    });
  }

  /**
   * Re-reads the user on every request rather than trusting the token's claims
   * outright, so a deleted account stops working immediately instead of
   * staying valid until its token expires.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.authService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Account no longer exists');
    }
    return { id: user.id, email: user.email };
  }
}
