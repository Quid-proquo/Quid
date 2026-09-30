import { StrKey } from '@stellar/stellar-sdk';

/** Minimum entropy for a production JWT signing key. */
export const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Values that ship in `backend/.env.example`. Accepting them in production
 * would mean every deployment shares a publicly-known signing key, so they are
 * rejected explicitly rather than merely "not empty".
 */
const PLACEHOLDER_SECRETS = new Set([
  'your-super-secret-jwt-key-change-this-in-production',
  'changeme',
  'change-me',
  'secret',
  's...',
  'replace-me',
]);

export class SecurityConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SecurityConfigError';
  }
}

function isProduction(env: NodeJS.ProcessEnv): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Parse `CORS_ALLOWED_ORIGINS` into an explicit allowlist.
 *
 * In production an unset or malformed value is a hard failure: silently
 * falling back to `localhost:3000` would make the API unreachable in a way
 * that is annoying, but silently allowing all origins would be a security
 * incident. Failing at boot is the safe option.
 */
export function getAllowedOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const raw = env.CORS_ALLOWED_ORIGINS;
  const production = isProduction(env);

  if (!raw || !raw.trim()) {
    if (production) {
      throw new SecurityConfigError(
        'CORS_ALLOWED_ORIGINS must be set in production, e.g. https://quid.app',
      );
    }
    return ['http://localhost:3000'];
  }

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new SecurityConfigError(
      'CORS_ALLOWED_ORIGINS was set but contained no usable origins',
    );
  }

  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new SecurityConfigError(
        `CORS_ALLOWED_ORIGINS entry is not a valid URL: '${origin}'`,
      );
    }

    // Compare against the serialized origin so trailing slashes, paths, query
    // strings, and fragments are rejected — the browser sends none of those.
    if (parsed.origin !== origin) {
      throw new SecurityConfigError(
        `CORS_ALLOWED_ORIGINS entry must be a bare origin (no path, query, or trailing slash): '${origin}'`,
      );
    }

    if (production && parsed.protocol !== 'https:') {
      throw new SecurityConfigError(
        `CORS_ALLOWED_ORIGINS entry must use https in production: '${origin}'`,
      );
    }
  }

  return origins;
}

/**
 * Verify that no credential is missing or left at its documented placeholder.
 *
 * Only enforced in production so local development and CI can boot without a
 * full set of secrets, but a deployment that reaches production is exactly
 * where a default signing key becomes exploitable.
 */
export function assertProductionSecrets(
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!isProduction(env)) {
    return;
  }

  const jwtSecret = env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new SecurityConfigError('JWT_SECRET must be set in production');
  }
  if (PLACEHOLDER_SECRETS.has(jwtSecret.toLowerCase())) {
    throw new SecurityConfigError(
      'JWT_SECRET is still the example value; generate a unique secret',
    );
  }
  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new SecurityConfigError(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters in production`,
    );
  }

  const stellarSecret = env.STELLAR_SERVER_SECRET?.trim();
  if (!stellarSecret) {
    throw new SecurityConfigError(
      'STELLAR_SERVER_SECRET must be set in production',
    );
  }
  if (PLACEHOLDER_SECRETS.has(stellarSecret.toLowerCase())) {
    throw new SecurityConfigError(
      'STELLAR_SERVER_SECRET is still the example value; generate a fresh SEP-10 keypair',
    );
  }
  if (!StrKey.isValidEd25519SecretSeed(stellarSecret)) {
    throw new SecurityConfigError(
      'STELLAR_SERVER_SECRET is not a valid Stellar secret seed',
    );
  }

  // The upload stub was replaced by a real IPFS pin, so an unconfigured
  // provider now means /upload 503s. Booting anyway would hide that until a
  // hunter tried to attach proof of work.
  const hasPinata =
    !!env.PINATA_JWT || (!!env.PINATA_API_KEY && !!env.PINATA_API_SECRET);
  if (!hasPinata) {
    throw new SecurityConfigError(
      'PINATA_JWT (or PINATA_API_KEY and PINATA_API_SECRET) must be set in production',
    );
  }
}

/** Returns the JWT lifetime so it can be logged and documented from one place. */
export function getJwtExpiresIn(env: NodeJS.ProcessEnv = process.env): string {
  return env.JWT_EXPIRES_IN?.trim() || '7d';
}
