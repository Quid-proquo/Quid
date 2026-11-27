export interface AppConfig {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CORS_ALLOWED_ORIGINS: string;
  ADMIN_ADDRESSES: string;
}

type Raw = Record<string, string | undefined>;

export class ConfigValidationError extends Error {
  constructor(public readonly problems: string[]) {
    super(`Invalid configuration:\n- ${problems.join('\n- ')}`);
    this.name = 'ConfigValidationError';
  }
}

/**
 * Validate and type environment variables. Throws one error listing every
 * problem, so it can be passed as `ConfigModule.forRoot({ validate })`.
 */
export function validateConfig(env: Raw = process.env): AppConfig {
  const problems: string[] = [];
  const get = (k: string) => (env[k] ?? '').trim() || undefined;
  const prod = env.NODE_ENV === 'production';

  const nodeEnv = get('NODE_ENV') ?? 'development';
  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    problems.push('NODE_ENV must be one of development, test, production');
  }

  const portRaw = get('PORT') ?? '3001';
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    problems.push(`PORT must be an integer between 1 and 65535 (got "${portRaw}")`);
  }

  const required = (k: string, onlyProd = false): string => {
    const v = get(k);
    if (!v && (!onlyProd || prod)) problems.push(`${k} is required`);
    return v ?? '';
  };

  const databaseUrl = required('DATABASE_URL', true);
  const jwtSecret = required('JWT_SECRET', true);
  if (prod && jwtSecret && jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters in production');
  }
  const cors = required('CORS_ALLOWED_ORIGINS', true);

  if (problems.length > 0) throw new ConfigValidationError(problems);

  return {
    NODE_ENV: nodeEnv as AppConfig['NODE_ENV'],
    PORT: port,
    DATABASE_URL: databaseUrl,
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: get('JWT_EXPIRES_IN') ?? '15m',
    CORS_ALLOWED_ORIGINS: cors,
    ADMIN_ADDRESSES: get('ADMIN_ADDRESSES') ?? '',
  };
}
