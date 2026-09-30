import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiProviderService } from './ai-provider.service';

/**
 * Issue #315 — async job that fills `missions.ai_summary` and
 * `submissions.sentiment` from submission text.
 *
 * Trigger points:
 *  - immediately after a submission's IPFS payload becomes available
 *    (`enqueueForMission`), and
 *  - a periodic sweep that catches anything missed while the worker was down.
 *
 * Runs are serialized with a simple in-process lock; the sweep is skipped
 * entirely when AI_SWEEP_ENABLED is not "true" so tests and local dev stay
 * quiet by default.
 */
@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiProviderService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Kick off AI processing for every submission of a mission that has text
   * but no stored sentiment yet. Fire-and-forget: callers must not await it
   * in a request path.
   */
  async enqueueForMission(missionId: string): Promise<void> {
    try {
      await this.processMission(missionId);
    } catch (error: unknown) {
      this.logger.warn(
        `AI summary for mission ${missionId} failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }

  /** Periodic catch-up sweep (every 5 minutes) for missed submissions. */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepPendingSubmissions(): Promise<void> {
    if (this.config.get<string>('AI_SWEEP_ENABLED') !== 'true') return;
    if (this.running) return;

    this.running = true;
    try {
      const pending = await this.prisma.submission.findMany({
        where: { sentiment: null, textPayload: { not: null } },
        select: { missionId: true },
        distinct: ['missionId'],
        take: 25,
      });

      for (const { missionId } of pending) {
        await this.processMission(missionId);
      }
    } catch (error: unknown) {
      this.logger.warn(
        `AI sweep failed: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    } finally {
      this.running = false;
    }
  }

  /**
   * Summarizes each unprocessed submission of the mission and refreshes the
   * mission-level rollup (average sentiment + blended summary).
   */
  private async processMission(missionId: string): Promise<void> {
    const submissions = await this.prisma.submission.findMany({
      where: { missionId, sentiment: null, textPayload: { not: null } },
      select: {
        id: true,
        textPayload: true,
        mission: { select: { id: true, title: true } },
      },
      take: 50,
      orderBy: { createdAt: 'asc' },
    });

    for (const submission of submissions) {
      const text = submission.textPayload ?? '';
      if (!text.trim()) continue;

      const result = await this.ai.summarizeFeedback(text);

      await this.prisma.submission.update({
        where: { id: submission.id },
        data: { sentiment: result.sentiment },
      });

      this.logger.debug(
        `Submission ${submission.id} scored ${result.sentiment.toFixed(2)} (${result.provider}).`,
      );
    }

    if (submissions.length > 0) {
      await this.refreshMissionSummary(missionId);
    }
  }

  /** Recomputes the mission-level rollup from all scored submissions. */
  private async refreshMissionSummary(missionId: string): Promise<void> {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
      select: {
        id: true,
        title: true,
        aiSummary: true,
        submissions: {
          where: { sentiment: { not: null } },
          select: { sentiment: true },
        },
      },
    });
    if (!mission) return;

    const scores = mission.submissions
      .map((s) => s.sentiment)
      .filter((s): s is number => s !== null);

    if (scores.length === 0) return;

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const tone =
      avg >= 0.2
        ? 'positive'
        : avg <= -0.2
          ? 'negative'
          : 'mixed';

    const rollup =
      `${tone} feedback across ${scores.length} submission${scores.length === 1 ? '' : 's'} ` +
      `(avg sentiment ${avg.toFixed(2)}).`;

    // Preserve any previously generated narrative and append the live rollup.
    const previous = mission.aiSummary?.split('\n-- AI rollup --\n')[0] ?? '';
    const summary = [previous.trim(), rollup]
      .filter(Boolean)
      .join('\n-- AI rollup --\n');

    await this.prisma.mission.update({
      where: { id: missionId },
      data: { aiSummary: summary },
    });
  }
}
