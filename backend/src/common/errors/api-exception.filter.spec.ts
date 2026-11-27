import { ArgumentsHost, ConflictException } from '@nestjs/common';
import { ApiExceptionFilter } from './api-exception.filter';

function run(exception: unknown) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/x', headers: {}, requestId: 'rid' }),
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  new ApiExceptionFilter().catch(exception, host);
  return { status: status.mock.calls[0][0], body: json.mock.calls[0][0] };
}

describe('ApiExceptionFilter', () => {
  it('maps a Prisma unique violation to 409 without SQL text', () => {
    const out = run({ code: 'P2002', message: 'Unique constraint on INSERT INTO' });
    expect(out.status).toBe(409);
    expect(out.body.error).toEqual({ code: 'CONFLICT', message: 'Resource already exists', requestId: 'rid' });
  });

  it('keeps HttpException status and hides internals on 500', () => {
    expect(run(new ConflictException('dup')).body.error.code).toBe('CONFLICT');
    const out = run(new Error('secret stack'));
    expect(out.status).toBe(500);
    expect(JSON.stringify(out.body)).not.toContain('secret stack');
  });
});
