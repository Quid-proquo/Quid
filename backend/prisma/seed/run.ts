import type { PrismaClient } from '@prisma/client';
import { buildSeedData, type SeedData } from './data';

export async function seedDatabase(
  client: PrismaClient,
  data: SeedData = buildSeedData(),
): Promise<void> {
  for (const user of data.users) {
    await client.user.upsert({
      where: { address: user.address },
      update: {
        email: user.email,
        displayName: user.displayName,
        bio: user.bio,
        role: user.role,
      },
      create: user,
    });
  }

  const missionIds = new Map<string, string>();
  for (const mission of data.missions) {
    const row = await client.mission.upsert({
      where: { onChainId: mission.onChainId },
      update: {
        ownerAddress: mission.ownerAddress,
        title: mission.title,
        descriptionCid: mission.descriptionCid,
        metadataCid: mission.metadataCid,
        metadata: mission.metadata,
        rewardToken: mission.rewardToken,
        rewardAmount: mission.rewardAmount,
        maxParticipants: mission.maxParticipants,
        participantsCount: mission.participantsCount,
        status: mission.status,
        aiSummary: mission.aiSummary,
        minAssetToken: mission.minAssetToken,
        minAssetAmount: mission.minAssetAmount,
        expiresAt: mission.expiresAt,
        indexedFromChain: mission.indexedFromChain,
      },
      create: mission,
    });
    missionIds.set(mission.onChainId, row.id);
  }

  const submissionIds = new Map<string, string>();
  for (const submission of data.submissions) {
    const missionId = missionIds.get(submission.missionOnChainId);
    if (!missionId) {
      throw new Error(`Seed mission ${submission.missionOnChainId} was not created`);
    }

    const values = {
      missionId,
      hunterAddress: submission.hunterAddress,
      ipfsCid: submission.ipfsCid,
      textPayload: submission.textPayload,
      sentiment: submission.sentiment,
      status: submission.status,
      stakeToken: submission.stakeToken,
      stakeAmount: submission.stakeAmount,
      rejectionReason: submission.rejectionReason,
      txHash: submission.txHash,
      chainConfirmed: submission.chainConfirmed,
    };

    const row = await client.submission.upsert({
      where: {
        missionId_hunterAddress: {
          missionId,
          hunterAddress: submission.hunterAddress,
        },
      },
      update: values,
      create: values,
    });
    submissionIds.set(submission.submissionKey, row.id);
  }

  for (const proof of data.proofs) {
    const submissionId = submissionIds.get(proof.submissionKey);
    if (!submissionId) {
      throw new Error(`Seed submission ${proof.submissionKey} was not created`);
    }

    const values = {
      submissionId,
      hunterAddress: proof.hunterAddress,
      status: proof.status,
      cid: proof.cid,
      verdict: proof.verdict,
    };
    await client.proof.upsert({
      where: { seedKey: proof.seedKey },
      update: values,
      create: { seedKey: proof.seedKey, ...values },
    });
  }

  for (const dispute of data.disputes) {
    const submissionId = submissionIds.get(dispute.submissionKey);
    if (!submissionId) {
      throw new Error(`Seed submission ${dispute.submissionKey} was not created`);
    }

    const values = {
      submissionId,
      raisedBy: dispute.raisedBy,
      reason: dispute.reason,
      status: dispute.status,
      resolution: dispute.resolution,
    };
    await client.dispute.upsert({
      where: { seedKey: dispute.seedKey },
      update: values,
      create: { seedKey: dispute.seedKey, ...values },
    });
  }

  for (const cashout of data.cashouts) {
    const values = {
      hunterAddress: cashout.hunterAddress,
      amount: cashout.amount,
      asset: cashout.asset,
      status: cashout.status,
      txHash: cashout.txHash,
    };
    await client.cashout.upsert({
      where: { seedKey: cashout.seedKey },
      update: values,
      create: { seedKey: cashout.seedKey, ...values },
    });
  }

  for (const notification of data.notifications) {
    const missionId = missionIds.get(notification.missionOnChainId);
    const submissionId = submissionIds.get(notification.submissionKey);
    if (!missionId || !submissionId) {
      throw new Error(`Seed notification ${notification.seedKey} is missing links`);
    }

    const values = {
      recipientAddress: notification.recipientAddress,
      type: notification.type,
      subject: notification.subject,
      body: notification.body,
      payload: notification.payload,
      missionId,
      submissionId,
    };
    await client.notification.upsert({
      where: { seedKey: notification.seedKey },
      update: values,
      create: { seedKey: notification.seedKey, ...values },
    });
  }

  for (const entry of data.leaderboard) {
    const values = {
      address: entry.address,
      displayName: entry.displayName,
      period: entry.period,
      rank: entry.rank,
      xp: entry.xp,
      missionsCompleted: entry.missionsCompleted,
    };
    await client.leaderboardEntry.upsert({
      where: { seedKey: entry.seedKey },
      update: values,
      create: { seedKey: entry.seedKey, ...values },
    });
  }
}
