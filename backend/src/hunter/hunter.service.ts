import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubmissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Hunter-scoped reads. Issue #327: backs the "My Submissions" screen with real
 * submission records instead of the placeholder route.
 */
@Injectable()
export class HunterService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * All submissions submitted by this hunter, newest first, with enough of the
   * mission attached for the UI to render a status list that links back to the
   * quest (title, reward, current mission state).
   */
  async getMySubmissions(hunterAddress: string): Promise<unknown> {
    return this.prisma.submission.findMany({
      where: { hunterAddress },
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
  }

  async getClaimables(hunterAddress: string): Promise<unknown> {
    const submissions = await this.prisma.submission.findMany({
      where: { hunterAddress, status: SubmissionStatus.APPROVED },
      orderBy: { updatedAt: 'desc' },
      include: {
        mission: {
          select: {
            title: true,
            rewardToken: true,
            rewardAmount: true,
          },
        },
      },
    });

    return submissions.map((submission) => ({
      submissionId: submission.id,
      missionTitle: submission.mission.title,
      amount: submission.mission.rewardAmount,
      asset: submission.mission.rewardToken || 'XLM',
      approvedAt: submission.updatedAt.toISOString(),
    }));
  }

  async claimSubmission(
    hunterAddress: string,
    submissionId: string,
  ): Promise<unknown> {
    const submission = await this.prisma.submission.findFirst({
      where: { id: submissionId, hunterAddress },
      include: {
        mission: {
          select: {
            rewardToken: true,
            rewardAmount: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found for this hunter.');
    }
    if (submission.status !== SubmissionStatus.APPROVED) {
      throw new BadRequestException(
        'Only approved submissions can be claimed.',
      );
    }

    const amount = Number(submission.mission.rewardAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('This mission has no claimable reward.');
    }

    const seedKey = `claim:${submissionId}`;
    return this.prisma.cashout.upsert({
      where: { seedKey },
      create: {
        seedKey,
        hunterAddress,
        amount: submission.mission.rewardAmount,
        asset: submission.mission.rewardToken || 'XLM',
        status: 'PENDING',
      },
      update: {},
    });
  }
}
