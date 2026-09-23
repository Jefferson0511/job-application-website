import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CredentialsDto {
  // Normalised so "User@Example.com" and "user@example.com" cannot become two
  // accounts that collide on the unique index only by luck of casing.
  @IsEmail({}, { message: 'A valid email address is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  // bcrypt silently truncates beyond 72 bytes, so reject longer rather than
  // accepting a password whose tail is ignored.
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  password!: string;
}
