import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Creator, Hunter, Admin } from './roles.decorator';
import { RolesGuard } from './roles.guard';

class Ctl {
  @Creator() creatorOnly(this: void) {}
  @Hunter() hunterOnly(this: void) {}
  @Admin() adminOnly(this: void) {}
  open(this: void) {}
}

function ctx(handler: () => void, address = 'GADDR') {
  return {
    getHandler: () => handler,
    getClass: () => Ctl,
    switchToHttp: () => ({ getRequest: () => ({ user: { address } }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const build = (role?: string) =>
    new RolesGuard(new Reflector(), {
      user: { findUnique: jest.fn().mockResolvedValue(role ? { role } : null) },
    } as never);
  const c = new Ctl();

  afterEach(() => delete process.env.ADMIN_ADDRESSES);

  it('allows routes without roles', async () => {
    await expect(build().canActivate(ctx(c.open))).resolves.toBe(true);
  });

  it('allows a creator on a creator route', async () => {
    await expect(
      build('CREATOR').canActivate(ctx(c.creatorOnly)),
    ).resolves.toBe(true);
  });

  it('rejects a hunter on a creator route', async () => {
    await expect(
      build('EARNER').canActivate(ctx(c.creatorOnly)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows admin addresses from ADMIN_ADDRESSES', async () => {
    process.env.ADMIN_ADDRESSES = 'GADDR, GOTHER';
    await expect(build().canActivate(ctx(c.adminOnly))).resolves.toBe(true);
  });
});
