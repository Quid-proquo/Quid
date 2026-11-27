const SENSITIVE_KEY = /^(authorization|cookie|set-cookie|password|token|signature|xdr|email)$|secret/i;
export const REDACTED = '[REDACTED]';

/** Deep-copies `value`, replacing sensitive fields and Bearer tokens. */
export function redact<T>(value: T): T {
  const walk = (v: unknown, depth: number): unknown => {
    if (typeof v === 'string') return v.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, `Bearer ${REDACTED}`);
    if (v === null || typeof v !== 'object' || depth > 8) return v;
    if (Array.isArray(v)) return v.map((x) => walk(x, depth + 1));
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [
        k,
        SENSITIVE_KEY.test(k) ? REDACTED : walk(x, depth + 1),
      ]),
    );
  };
  return walk(value, 0) as T;
}

/** One-line structured JSON log with secrets redacted. */
export function logJson(
  level: 'debug' | 'info' | 'warn' | 'error',
  msg: string,
  context: Record<string, unknown> = {},
): void {
  const line = JSON.stringify(redact({ level, time: new Date().toISOString(), msg, ...context }));
  (level === 'error' ? process.stderr : process.stdout).write(line + '\n');
}
