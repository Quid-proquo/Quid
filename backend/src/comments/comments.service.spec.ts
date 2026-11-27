import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CommentsService', () => {
  const submission = {
    id: 's1',
    hunterAddress: 'GHUNTER',
    mission: { ownerAddress: 'GOWNER' },
  };
  let prisma: { submission: { findUnique: jest.Mock }; $queryRawUnsafe: jest.Mock };
  let service: CommentsService;

  beforeEach(() => {
    prisma = {
      submission: { findUnique: jest.fn().mockResolvedValue(submission) },
      $queryRawUnsafe: jest.fn(),
    };
    service = new CommentsService(prisma as unknown as PrismaService);
  });

  it('returns 404 for a third party on read and write', async () => {
    await expect(service.list('s1', 'GOTHER')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.create('s1', 'GOTHER', 'hi')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('lets the hunter create a comment', async () => {
    prisma.$queryRawUnsafe.mockResolvedValue([{ id: 'c1' }]);
    await expect(service.create('s1', 'GHUNTER', 'hi')).resolves.toEqual({ id: 'c1' });
  });

  it('rejects edits by a non-author and after 15 minutes', async () => {
    const createdAt = new Date('2026-01-01T00:00:00Z');
    prisma.$queryRawUnsafe.mockResolvedValue([{ id: 'c1', author: 'GHUNTER', createdAt }]);
    await expect(service.edit('s1', 'c1', 'GOWNER', 'x')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(
      service.edit('s1', 'c1', 'GHUNTER', 'x', new Date('2026-01-01T00:16:00Z')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
