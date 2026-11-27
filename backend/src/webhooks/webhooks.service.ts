import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash, randomBytes } from 'crypto';
import { promises as dns } from 'dns';
import net from 'net';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerAddress: string, body: { url: string; events: string[]; missionId?: string }) {
    const existing = await (this.prisma as any).webhookSubscription.count({ where: { ownerAddress } });
    if (existing >= 10) throw new ConflictException('max 10 subscriptions per owner');
    await this.assertSafeUrl(body.url);
    const secret = randomBytes(32).toString('hex');
    const sub = (await (this.prisma as any).webhookSubscription.create({
      data: {
        ownerAddress,
        url: body.url,
        events: body.events ?? [],
        missionId: body.missionId,
        secretHash: createHash('sha256').update(secret).digest('hex'),
        active: true,
      },
    })) as Record<string, unknown>;
    return { ...sub, secret };
  }

  async list(ownerAddress: string): Promise<Record<string, unknown>[]> {
    return (await (this.prisma as any).webhookSubscription.findMany({
      where: { ownerAddress },
      orderBy: { createdAt: 'desc' },
    })) as Record<string, unknown>[];
  }

  async update(ownerAddress: string, id: string, body: { url?: string; events?: string[]; active?: boolean; missionId?: string | null }) {
    const sub = await this.getOwned(ownerAddress, id);
    if (body.url) await this.assertSafeUrl(body.url);
    return (await (this.prisma as any).webhookSubscription.update({
      where: { id: sub.id },
      data: {
        ...(body.url ? { url: body.url } : {}),
        ...(body.events ? { events: body.events } : {}),
        ...(typeof body.active === 'boolean' ? { active: body.active } : {}),
        ...(body.missionId !== undefined ? { missionId: body.missionId } : {}),
      },
    })) as Record<string, unknown>;
  }

  async remove(ownerAddress: string, id: string): Promise<{ ok: true }> {
    await this.getOwned(ownerAddress, id);
    await (this.prisma as any).webhookSubscription.delete({ where: { id } });
    return { ok: true };
  }

  async rotateSecret(ownerAddress: string, id: string) {
    await this.getOwned(ownerAddress, id);
    const secret = randomBytes(32).toString('hex');
    const sub = (await (this.prisma as any).webhookSubscription.update({
      where: { id },
      data: { secretHash: createHash('sha256').update(secret).digest('hex') },
    })) as Record<string, unknown>;
    return { ...sub, secret };
  }

  private async getOwned(ownerAddress: string, id: string): Promise<Record<string, unknown>> {
    const sub = (await (this.prisma as any).webhookSubscription.findFirst({
      where: { id, ownerAddress },
    })) as Record<string, unknown> | null;
    if (!sub) throw new NotFoundException('subscription not found');
    return sub;
  }

  async assertSafeUrl(url: string): Promise<void> {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new BadRequestException('invalid url'); }
    if (parsed.protocol !== 'https:') throw new BadRequestException('https only');
    const hostname = parsed.hostname;
    const addrs = net.isIP(hostname) ? [hostname] : (await dns.lookup(hostname, { all: true })).map((r) => r.address);
    for (const addr of addrs) {
      if (this.isPrivateIp(addr)) throw new BadRequestException('private ip rejected');
    }
  }

  isPrivateIp(ip: string): boolean {
    if (ip === '::1') return true;
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:')) return true;
    const parts = ip.split('.').map((n) => Number(n));
    if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n))) return false;
    const [a, b] = parts;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
}
