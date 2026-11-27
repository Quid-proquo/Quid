/** Hook for external error tracking (e.g. Sentry). Implementations must scrub PII. */
export interface ErrorTracker {
  capture(error: unknown, context: { requestId?: string; path?: string }): void;
}

let tracker: ErrorTracker | null = null;

export function setErrorTracker(next: ErrorTracker | null): void {
  tracker = next;
}

export function getErrorTracker(): ErrorTracker | null {
  return tracker;
}
