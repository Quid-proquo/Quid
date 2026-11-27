import { REDACTED, redact } from './redact';

describe('redact', () => {
  it('removes bearer tokens and sensitive keys', () => {
    const out = redact({
      headers: { authorization: 'Bearer abc.def.ghi', accept: 'json' },
      user: { email: 'a@b.c', clientSecret: 'x', name: 'ok' },
      note: 'sent Bearer abc.def.ghi',
    });
    const text = JSON.stringify(out);
    expect(text).not.toContain('abc.def.ghi');
    expect(out.headers.authorization).toBe(REDACTED);
    expect(out.user).toEqual({ email: REDACTED, clientSecret: REDACTED, name: 'ok' });
    expect(out.headers.accept).toBe('json');
  });
});
