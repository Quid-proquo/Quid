import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class DuplicateDetectorService {
  private readonly logger = new Logger(DuplicateDetectorService.name);
  constructor(private readonly prisma: PrismaService) {}

  async detectForSubmission(submissionId: string): Promise<void> {
    const sub = await (this.prisma as any).submission.findUnique({ where: { id: submissionId } });
    if (!sub) return;
    const others = await (this.prisma as any).submission.findMany({ where: { missionId: sub.missionId, id: { not: submissionId } } });
    for (const other of others) {
      const textScore = this.textSimilarity(sub.textPayload ?? sub.ipfsCid ?? '', other.textPayload ?? other.ipfsCid ?? '');
      if (textScore >= 0.8) {
        await (this.prisma as any).duplicateCandidate.create({
          data: { submissionId: sub.id, candidateOfId: other.id, score: textScore, kind: 'text' },
        }).catch(() => undefined);
      }
    }
  }

  textSimilarity(a: string, b: string): number {
    const sa = this.shingles(this.normalize(a));
    const sb = this.shingles(this.normalize(b));
    if (!sa.size && !sb.size) return 1;
    if (!sa.size || !sb.size) return 0;
    let inter = 0;
    for (const s of sa) if (sb.has(s)) inter += 1;
    const union = sa.size + sb.size - inter;
    return union === 0 ? 0 : inter / union;
  }

  normalize(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
  }

  shingles(text: string, k = 3): Set<string> {
    const s = new Set<string>();
    if (text.length <= k) { if (text) s.add(text); return s; }
    for (let i = 0; i <= text.length - k; i += 1) s.add(text.slice(i, i + k));
    return s;
  }

  dHashHex(buffer: Buffer, size = 8): string {
    // Lightweight fallback hash over bytes; real perceptual dHash requires image decode (sharp).
    // Keeps deterministic behavior in tests without adding native deps.
    const hash = createHash('sha256').update(buffer).digest();
    return hash.subarray(0, Math.ceil((size * size) / 8)).toString('hex');
  }

  hammingDistance(a: string, b: string): number {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    const len = Math.max(ba.length, bb.length);
    let dist = 0;
    for (let i = 0; i < len; i += 1) {
      let x = (ba[i] ?? 0) ^ (bb[i] ?? 0);
      while (x) { dist += x & 1; x >>= 1; }
    }
    return dist;
  }
}
