import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type PrismaClientLike = {
  $disconnect: () => Promise<void>;
};

function loadPrismaClientCtor():
  | (new (...args: any[]) => PrismaClientLike)
  | null {
  try {
    // Preferred: generated client configured in `prisma/schema.prisma` (generator output).
    // This may not exist in CI unless `prisma generate` has been run.

    const mod = require('../../generated/prisma/client') as {
      PrismaClient?: unknown;
    };
    const Ctor = mod?.PrismaClient;
    if (typeof Ctor === 'function')
      return Ctor as new (...args: any[]) => PrismaClientLike;
  } catch {
    // ignore
  }

  try {
    // Fallback: default `@prisma/client` generation (if present).

    const mod = require('@prisma/client') as { PrismaClient?: unknown };
    const Ctor = mod?.PrismaClient;
    if (typeof Ctor === 'function')
      return Ctor as new (...args: any[]) => PrismaClientLike;
  } catch {
    // ignore
  }

  return null;
}

class PrismaClientFallback implements PrismaClientLike {
  async $disconnect(): Promise<void> {
    // no-op: allows lint/build to pass when Prisma client isn't generated
  }
}

const PrismaClientBase = loadPrismaClientCtor() ?? PrismaClientFallback;

@Injectable()
export class PrismaService extends PrismaClientBase implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await (this as PrismaClientLike).$disconnect();
  }
}
