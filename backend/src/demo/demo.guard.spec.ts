import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DemoGuard } from './demo.guard';
import {
  DEFAULT_DEMO_ADDRESS,
  DEMO_READ_ONLY_CODE,
  DEMO_USER_ID,
} from './demo.constants';

interface TestRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  isDemoRequest?: boolean;
  user?: { userId: string; address: string };
}

function contextFor(request: TestRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('DemoGuard', () => {
  const guard = new DemoGuard();
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('allows every method when demo mode is disabled', () => {
    delete process.env.DEMO_MODE;
    const request: TestRequest = { method: 'POST', headers: {} };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.isDemoRequest).toBeUndefined();
  });

  it.each(['GET', 'HEAD', 'OPTIONS'])(
    'allows %s without credentials and assigns the demo user',
    (method) => {
      process.env.DEMO_MODE = 'true';
      const request: TestRequest = { method, headers: {} };

      expect(guard.canActivate(contextFor(request))).toBe(true);
      expect(request.isDemoRequest).toBe(true);
      expect(request.user).toEqual({
        userId: DEMO_USER_ID,
        address: DEFAULT_DEMO_ADDRESS,
      });
    },
  );

  it('does not override an authenticated request', () => {
    process.env.DEMO_MODE = 'true';
    const request: TestRequest = {
      method: 'GET',
      headers: { authorization: 'Bearer token' },
    };

    expect(guard.canActivate(contextFor(request))).toBe(true);
    expect(request.isDemoRequest).toBeUndefined();
    expect(request.user).toBeUndefined();
  });

  it.each(['POST', 'PUT', 'PATCH', 'DELETE'])(
    'rejects %s with DEMO_READ_ONLY',
    (method) => {
      process.env.DEMO_MODE = 'true';

      expect(() =>
        guard.canActivate(contextFor({ method, headers: {} })),
      ).toThrow(ForbiddenException);

      try {
        guard.canActivate(contextFor({ method, headers: {} }));
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect((error as ForbiddenException).getResponse()).toMatchObject({
          code: DEMO_READ_ONLY_CODE,
        });
      }
    },
  );

  it('uses DEMO_ADDRESS from the environment', () => {
    process.env.DEMO_MODE = 'true';
    process.env.DEMO_ADDRESS = 'GCUSTOMDEMOADDRESS';
    const request: TestRequest = { method: 'GET', headers: {} };

    guard.canActivate(contextFor(request));

    expect(request.user?.address).toBe('GCUSTOMDEMOADDRESS');
  });
});
