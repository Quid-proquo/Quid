import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { TokenPair } from './dto/refresh-token.dto';
import { RefreshTokenStore } from './refresh-token.store';

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly store: RefreshTokenStore,
  ) {}

  /** Issue a short-lived access token plus an opaque refresh token. */
  issue(userId: string, address: string, familyId = randomUUID()) {
    return this.create(userId, address, familyId);
  }

  /** Exchange a refresh token for a new pair; reuse revokes the family. */
  async rotate(refreshToken: string): Promise<TokenPair> {
    const record = await this.store.findByHash(hash(refreshToken));
    if (!record) throw new UnauthorizedException('Invalid refresh token');

    if (record.revokedAt) {
      await this.store.revokeFamily(record.familyId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (record.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.store.revoke(record.id);
    return this.create(record.userId, record.address, record.familyId);
  }

  /** Revoke the family of the given refresh token (single-session logout). */
  async revoke(refreshToken: string): Promise<void> {
    const record = await this.store.findByHash(hash(refreshToken));
    if (record) await this.store.revokeFamily(record.familyId);
  }

  /** Revoke every refresh token of a user (log out everywhere). */
  revokeAll(userId: string): Promise<void> {
    return this.store.revokeAllForUser(userId);
  }

  private async create(
    userId: string,
    address: string,
    familyId: string,
  ): Promise<TokenPair> {
    const refreshToken = randomBytes(48).toString('base64url');
    await this.store.save({
      id: randomUUID(),
      userId,
      address,
      tokenHash: hash(refreshToken),
      familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
    });
    const token = this.jwtService.sign(
      { sub: userId, address },
      { expiresIn: ACCESS_TOKEN_TTL },
    );
    return { token, refreshToken };
  }
}
