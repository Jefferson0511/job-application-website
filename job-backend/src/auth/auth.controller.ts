import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AuthResult, AuthService } from './auth.service';
import { CredentialsDto } from './dto/credentials.dto';
import { Public } from './public.decorator';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './jwt.strategy';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: CredentialsDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  // 200 rather than the default 201: logging in does not create a resource.
  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Body() dto: CredentialsDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  /** Lets a client check whether its stored token is still good. */
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }
}
