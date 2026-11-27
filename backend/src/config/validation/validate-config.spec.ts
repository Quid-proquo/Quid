import { ConfigValidationError, validateConfig } from './validate-config';

describe('validateConfig', () => {
  it('applies defaults outside production', () => {
    const cfg = validateConfig({});
    expect(cfg.PORT).toBe(3001);
    expect(cfg.NODE_ENV).toBe('development');
  });

  it('names PORT when it is not a number', () => {
    expect(() => validateConfig({ PORT: 'abc' })).toThrow(/PORT/);
  });

  it('requires secrets in production and reports all problems', () => {
    expect.assertions(2);
    try {
      validateConfig({ NODE_ENV: 'production' });
    } catch (e) {
      expect(e).toBeInstanceOf(ConfigValidationError);
      expect((e as ConfigValidationError).problems.length).toBeGreaterThan(2);
    }
  });

  it('accepts a valid production config', () => {
    const cfg = validateConfig({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://x',
      JWT_SECRET: 'x'.repeat(32),
      CORS_ALLOWED_ORIGINS: 'https://quid.app',
    });
    expect(cfg.NODE_ENV).toBe('production');
  });
});
