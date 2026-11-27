export interface RefreshTokenRecord {
  id: string;
  userId: string;
  address: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

/** Persistence port; the default implementation is in-memory. */
export abstract class RefreshTokenStore {
  abstract save(record: RefreshTokenRecord): Promise<void>;
  abstract findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  abstract revoke(id: string): Promise<void>;
  abstract revokeFamily(familyId: string): Promise<void>;
  abstract revokeAllForUser(userId: string): Promise<void>;
}

export class InMemoryRefreshTokenStore extends RefreshTokenStore {
  private readonly records = new Map<string, RefreshTokenRecord>();

  save(record: RefreshTokenRecord): Promise<void> {
    this.records.set(record.id, { ...record });
    return Promise.resolve();
  }

  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    for (const r of this.records.values()) {
      if (r.tokenHash === tokenHash) return Promise.resolve({ ...r });
    }
    return Promise.resolve(null);
  }

  revoke(id: string): Promise<void> {
    const r = this.records.get(id);
    if (r && !r.revokedAt) r.revokedAt = new Date();
    return Promise.resolve();
  }

  revokeFamily(familyId: string): Promise<void> {
    for (const r of this.records.values()) {
      if (r.familyId === familyId && !r.revokedAt) r.revokedAt = new Date();
    }
    return Promise.resolve();
  }

  revokeAllForUser(userId: string): Promise<void> {
    for (const r of this.records.values()) {
      if (r.userId === userId && !r.revokedAt) r.revokedAt = new Date();
    }
    return Promise.resolve();
  }
}
