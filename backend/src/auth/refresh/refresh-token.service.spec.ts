import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from './refresh-token.service';
import { InMemoryRefreshTokenStore } from './refresh-token.store';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;

  beforeEach(() => {
    service = new RefreshTokenService(
      new JwtService({ secret: 'test-secret' }),
      new InMemoryRefreshTokenStore(),
    );
  });

  it('rotates a refresh token', async () => {
    const first = await service.issue('u1', 'GADDR');
    const second = await service.rotate(first.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(second.token).toEqual(expect.any(String));
  });

  it('revokes the family when an old token is reused', async () => {
    const first = await service.issue('u1', 'GADDR');
    const second = await service.rotate(first.refreshToken);
    await expect(service.rotate(first.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.rotate(second.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects unknown tokens and revoked tokens', async () => {
    await expect(service.rotate('nope')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    const pair = await service.issue('u1', 'GADDR');
    await service.revoke(pair.refreshToken);
    await expect(service.rotate(pair.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('revokeAll invalidates every token of the user', async () => {
    const a = await service.issue('u1', 'GADDR');
    const b = await service.issue('u1', 'GADDR');
    await service.revokeAll('u1');
    await expect(service.rotate(a.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(service.rotate(b.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
