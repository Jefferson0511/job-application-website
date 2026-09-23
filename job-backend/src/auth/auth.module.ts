import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from './user.entity';
import { JWT_EXPIRES_IN, jwtSecret } from './jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    // Resolved lazily via the factory so that a missing JWT_SECRET fails at
    // application startup with jwt.config's actionable message.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: jwtSecret(),
        signOptions: { expiresIn: JWT_EXPIRES_IN },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
