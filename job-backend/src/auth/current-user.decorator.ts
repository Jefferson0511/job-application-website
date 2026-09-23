import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from './jwt.strategy';

/**
 * Reads the user the JwtAuthGuard attached to the request.
 *
 * Only valid on guarded routes: on a @Public() route there is no user and this
 * yields undefined, which the signature deliberately does not admit.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
