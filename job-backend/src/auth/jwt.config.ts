export const JWT_EXPIRES_IN = '7d';

/**
 * Resolves the signing secret, refusing to fall back to a default.
 *
 * A hardcoded development secret is the kind of thing that reaches production
 * unnoticed and makes every token forgeable, so a missing JWT_SECRET is a
 * startup failure instead.
 */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to at least 32 characters. ' +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  return secret;
}
