import { PrismaService } from '../prisma/prisma.service';
import { MissionStatus, SubmissionStatus } from '@prisma/client';
import { HunterService } from './hunter.service';

const sampleSubmission = {
  id: 'submission-1',
  missionId: 'mission-1',
  hunterAddress: 'GHUNTER1111111111111111111111111111111111111111111111111',
  ipfsCid: 'bafkreihash2zicv5xmpfpbhzdn62d5zi3q',
  textPayload: 'Great product, loved the onboarding.',
  sentiment: 0.8,
  status: SubmissionStatus.PENDING,
  rejectionReason: null,
  createdAt: new Date('2026-09-01T10:00:00Z'),
  updatedAt: new Date('2026-09-01T10:00:00Z'),
  mission: {
    id: 'mission-1',
    title: 'Test the Ruze.stellar onboarding',
    status: MissionStatus.OPEN,
    rewardToken: 'XLM',
    rewardAmount: '640',
    ownerAddress: 'GFOUNDER111111111111111111111111111111111111111111111111',
  },
};

describe('HunterService', () => {
  let service: HunterService;
  let prisma: {
    submission: { findMany: jest.Mock; findFirst: jest.Mock };
    cashout: { upsert: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      submission: { findMany: jest.fn(), findFirst: jest.fn() },
      cashout: { upsert: jest.fn() },
    };

    service = new HunterService(prisma as unknown as PrismaService);
  });

  it('returns the hunter submissions newest first with their missions', async () => {
    prisma.submission.findMany.mockResolvedValue([
      sampleSubmission,
      {
        ...sampleSubmission,
        id: 'submission-2',
        missionId: 'mission-2',
        status: SubmissionStatus.PAID,
        mission: {
          ...sampleSubmission.mission,
          id: 'mission-2',
          title: 'Review the Mizu wallet flow',
          status: MissionStatus.OPEN,
        },
      },
    ]);

    const result = (await service.getMySubmissions(
      'GHUNTER1111111111111111111111111111111111111111111111111',
    )) as (typeof sampleSubmission)[];

    expect(prisma.submission.findMany).toHaveBeenCalledWith({
      where: {
        hunterAddress:
          'GHUNTER1111111111111111111111111111111111111111111111111',
      },
      orderBy: { createdAt: 'desc' },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            status: true,
            rewardToken: true,
            rewardAmount: true,
            ownerAddress: true,
          },
        },
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('submission-1');
    expect(result[0].mission.title).toBe('Test the Ruze.stellar onboarding');
    expect(result[1].status).toBe(SubmissionStatus.PAID);
  });

  it('returns an empty array when the hunter has no submissions', async () => {
    prisma.submission.findMany.mockResolvedValue([]);

    const result = await service.getMySubmissions('GHUNTER...');

    expect(result).toEqual([]);
  });

  it('returns only approved missions as claimables', async () => {
    prisma.submission.findMany.mockResolvedValue([
      {
        ...sampleSubmission,
        id: 'submission-3',
        status: SubmissionStatus.APPROVED,
        updatedAt: new Date('2026-10-02T10:00:00Z'),
      },
    ]);

    const result = (await service.getClaimables(
      sampleSubmission.hunterAddress,
    )) as {
      submissionId: string;
      amount: string;
      asset: string;
    }[];

    expect(prisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          hunterAddress: sampleSubmission.hunterAddress,
          status: SubmissionStatus.APPROVED,
        },
      }),
    );
    expect(result[0]).toMatchObject({
      submissionId: 'submission-3',
      amount: '640',
      asset: 'XLM',
    });
  });

  it('records an idempotent cashout request for an approved submission', async () => {
    prisma.submission.findFirst.mockResolvedValue({
      ...sampleSubmission,
      status: SubmissionStatus.APPROVED,
    });
    prisma.cashout.upsert.mockResolvedValue({ id: 'cashout-1' });

    await service.claimSubmission(
      sampleSubmission.hunterAddress,
      'submission-3',
    );

    expect(prisma.cashout.upsert).toHaveBeenCalledWith({
      where: { seedKey: 'claim:submission-3' },
      create: {
        seedKey: 'claim:submission-3',
        hunterAddress: sampleSubmission.hunterAddress,
        amount: '640',
        asset: 'XLM',
        status: 'PENDING',
      },
      update: {},
    });
  });

  it('rejects claims for missing or unapproved submissions', async () => {
    prisma.submission.findFirst.mockResolvedValueOnce(null);
    await expect(
      service.claimSubmission(sampleSubmission.hunterAddress, 'missing'),
    ).rejects.toThrow('Submission not found');

    prisma.submission.findFirst.mockResolvedValueOnce(sampleSubmission);
    await expect(
      service.claimSubmission(sampleSubmission.hunterAddress, 'submission-1'),
    ).rejects.toThrow('Only approved submissions');
  });
});
