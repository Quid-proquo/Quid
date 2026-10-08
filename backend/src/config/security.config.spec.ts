import { Keypair } from '@stellar/stellar-sdk';
import {
  SecurityConfigError,
  assertProductionSecrets,
  getAllowedOrigins,
  getJwtExpiresIn,
} from './security.config';

describe('getAllowedOrigins', () => {
  it('falls back to localhost:3000 outside production', () => {
    expect(getAllowedOrigins({ NODE_ENV: 'development' })).toEqual([
      'http://localhost:3000',
    ]);
    expect(getAllowedOrigins({})).toEqual(['http://localhost:3000']);
  });

  it('parses a comma-separated allowlist, trimming whitespace', () => {
    const origins = getAllowedOrigins({
      NODE_ENV: 'production',
      CORS_ALLOWED_ORIGINS:
        'https://quid.app,  https://staging.quid.app , https://admin.quid.app',
    });

    expect(origins).toEqual([
      'https://quid.app',
      'https://staging.quid.app',
      'https://admin.quid.app',
    ]);
  });

  it('fails closed when CORS_ALLOWED_ORIGINS is unset in production', () => {
    const env = { NODE_ENV: 'production' };

    expect(() => getAllowedOrigins(env)).toThrow(SecurityConfigError);
    expect(() => getAllowedOrigins(env)).toThrow(
      'CORS_ALLOWED_ORIGINS must be set in production',
    );
  });

  it('fails closed when CORS_ALLOWED_ORIGINS is empty in production', () => {
    expect(() =>
      getAllowedOrigins({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: ' , ',
      }),
    ).toThrow(SecurityConfigError);
  });

  it('rejects a malformed URL', () => {
    expect(() =>
      getAllowedOrigins({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: 'not a url',
      }),
    ).toThrow(SecurityConfigError);
  });

  it('rejects an origin with a trailing slash or path', () => {
    expect(() =>
      getAllowedOrigins({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: 'https://quid.app/',
      }),
    ).toThrow(SecurityConfigError);
  });

  it('rejects a plain http origin in production', () => {
    expect(() =>
      getAllowedOrigins({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS: 'http://quid.app',
      }),
    ).toThrow(/https/);
  });

  it('allows http origins outside production (e.g. ngrok for staging)', () => {
    const origins = getAllowedOrigins({
      NODE_ENV: 'development',
      CORS_ALLOWED_ORIGINS: 'http://192.168.1.20:3000,http://localhost:5173',
    });

    expect(origins).toHaveLength(2);
  });
});

describe('assertProductionSecrets', () => {
  it('is a no-op outside production so CI and local dev can boot', () => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV: 'test',
        JWT_SECRET: 'x',
        STELLAR_SERVER_SECRET: 'x',
      }),
    ).not.toThrow();
  });

  it('accepts a well-formed production configuration', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(64),
      STELLAR_SERVER_SECRET: Keypair.random().secret(),
      PINATA_JWT: 'pinata-jwt',
    };

    expect(() => assertProductionSecrets(env)).not.toThrow();
  });

  it('accepts the legacy Pinata key pair', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(64),
      STELLAR_SERVER_SECRET: Keypair.random().secret(),
      PINATA_API_KEY: 'pk',
      PINATA_API_SECRET: 'psk',
    };

    expect(() => assertProductionSecrets(env)).not.toThrow();
  });

  it('rejects a missing JWT_SECRET', () => {
    expect(() => assertProductionSecrets({ NODE_ENV: 'production' })).toThrow(
      SecurityConfigError,
    );
  });

  it('rejects the committed example JWT_SECRET', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
      STELLAR_SERVER_SECRET: Keypair.random().secret(),
      PINATA_JWT: 'pinata-jwt',
    };

    expect(() => assertProductionSecrets(env)).toThrow(
      /still the example value/,
    );
  });

  it('rejects a short JWT_SECRET', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'short',
      STELLAR_SERVER_SECRET: Keypair.random().secret(),
      PINATA_JWT: 'pinata-jwt',
    };

    expect(() => assertProductionSecrets(env)).toThrow(/at least/);
  });

  it('rejects the committed example STELLAR_SERVER_SECRET', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(64),
      STELLAR_SERVER_SECRET: 'S...',
      PINATA_JWT: 'pinata-jwt',
    };

    expect(() => assertProductionSecrets(env)).toThrow(
      /STELLAR_SERVER_SECRET is still the example value/,
    );
  });

  it('rejects a non-seed STELLAR_SERVER_SECRET', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(64),
      // Valid length but the checksum is wrong, so it is not a seed.
      STELLAR_SERVER_SECRET: 'S'.repeat(56),
      PINATA_JWT: 'pinata-jwt',
    };

    expect(() => assertProductionSecrets(env)).toThrow(
      /not a valid Stellar secret seed/,
    );
  });

  it('rejects production without IPFS credentials', () => {
    const env = {
      NODE_ENV: 'production',
      JWT_SECRET: 'x'.repeat(64),
      STELLAR_SERVER_SECRET: Keypair.random().secret(),
    };

    expect(() => assertProductionSecrets(env)).toThrow(/PINATA/);
  });
});

describe('getJwtExpiresIn', () => {
  it('defaults to 7d', () => {
    expect(getJwtExpiresIn({})).toBe('7d');
  });

  it('reads JWT_EXPIRES_IN', () => {
    expect(getJwtExpiresIn({ JWT_EXPIRES_IN: '1h' })).toBe('1h');
  });
});
