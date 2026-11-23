import { faker } from '@faker-js/faker';
import {
  CashoutStatus,
  DisputeStatus,
  LeaderboardPeriod,
  MissionStatus,
  NotificationType,
  ProofStatus,
  SubmissionStatus,
  UserRole,
  type Prisma,
} from '@prisma/client';
import { DEFAULT_DEMO_ADDRESS, DEMO_USER_ID } from '../../src/demo/demo.constants';

export const SEED_FAKER_SEED = 20261123;

export interface SeedUser {
  id: string;
  address: string;
  email: string;
  displayName: string;
  bio: string;
  role: UserRole;
}

export interface SeedMission {
  onChainId: string;
  ownerAddress: string;
  title: string;
  descriptionCid: string;
  metadataCid: string;
  metadata: Prisma.InputJsonValue;
  rewardToken: string;
  rewardAmount: string;
  maxParticipants: number;
  participantsCount: number;
  status: MissionStatus;
  aiSummary: string;
  minAssetToken: string | null;
  minAssetAmount: string;
  expiresAt: string | null;
  indexedFromChain: boolean;
}

export interface SeedSubmission {
  submissionKey: string;
  missionOnChainId: string;
  hunterAddress: string;
  ipfsCid: string;
  textPayload: string;
  sentiment: number;
  status: SubmissionStatus;
  stakeToken: string | null;
  stakeAmount: string | null;
  rejectionReason: string | null;
  txHash: string;
  chainConfirmed: boolean;
}

export interface SeedProof {
  seedKey: string;
  submissionKey: string;
  hunterAddress: string;
  status: ProofStatus;
  cid: string;
  verdict: string | null;
}

export interface SeedDispute {
  seedKey: string;
  submissionKey: string;
  raisedBy: string;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
}

export interface SeedCashout {
  seedKey: string;
  hunterAddress: string;
  amount: string;
  asset: string;
  status: CashoutStatus;
  txHash: string;
}

export interface SeedNotification {
  seedKey: string;
  recipientAddress: string;
  type: NotificationType;
  subject: string;
  body: string;
  payload: Prisma.InputJsonValue;
  missionOnChainId: string;
  submissionKey: string;
}

export interface SeedLeaderboardEntry {
  seedKey: string;
  address: string;
  displayName: string;
  period: LeaderboardPeriod;
  rank: number;
  xp: number;
  missionsCompleted: number;
}

export interface SeedData {
  users: SeedUser[];
  missions: SeedMission[];
  submissions: SeedSubmission[];
  proofs: SeedProof[];
  disputes: SeedDispute[];
  cashouts: SeedCashout[];
  notifications: SeedNotification[];
  leaderboard: SeedLeaderboardEntry[];
}

function stellarAddress(seed: string): string {
  const marker = seed.charAt(0).toUpperCase() || 'G';
  return `G${marker}${faker.string.fromCharacters('ABCDEFGHIJKLMNOPQRSTUVWXYZ234567', 55)}`.slice(
    0,
    56,
  );
}

function submissionKey(index: number): string {
  return `seed-submission-${index}`;
}

export function buildSeedData(): SeedData {
  faker.seed(SEED_FAKER_SEED);

  const creatorAddresses = [
    stellarAddress('creator-1'),
    stellarAddress('creator-2'),
    stellarAddress('creator-3'),
  ];
  const hunterAddresses = [
    DEFAULT_DEMO_ADDRESS,
    stellarAddress('hunter-2'),
    stellarAddress('hunter-3'),
    stellarAddress('hunter-4'),
  ];

  const users: SeedUser[] = [
    {
      id: DEMO_USER_ID,
      address: DEFAULT_DEMO_ADDRESS,
      email: 'demo@quid.local',
      displayName: 'Demo Hunter',
      bio: 'Read-only demo account with sample activity.',
      role: UserRole.EARNER,
    },
    ...creatorAddresses.map((address, index) => ({
      id: faker.string.uuid(),
      address,
      email: `creator${index + 1}@quid.local`,
      displayName: faker.company.name(),
      bio: faker.lorem.sentence(),
      role: UserRole.CREATOR,
    })),
    ...hunterAddresses.slice(1).map((address, index) => ({
      id: faker.string.uuid(),
      address,
      email: `hunter${index + 2}@quid.local`,
      displayName: faker.person.fullName(),
      bio: faker.lorem.sentence(),
      role: UserRole.EARNER,
    })),
  ];

  const missionStatuses = Object.values(MissionStatus);
  const missions: SeedMission[] = missionStatuses.map((status, index) => ({
    onChainId: String(9000 + index),
    ownerAddress: creatorAddresses[index % creatorAddresses.length],
    title: `${status.toLowerCase()} mission ${index + 1}`,
    descriptionCid: `bafyseed-description-${index}`,
    metadataCid: `bafyseed-metadata-${index}`,
    metadata: {
      summary: faker.lorem.sentence(),
      category: index % 2 === 0 ? 'defi' : 'gaming',
      skills: index % 2 === 0 ? ['wallet', 'onboarding'] : ['ux', 'reporting'],
      status,
    },
    rewardToken: index % 2 === 0 ? 'XLM' : 'USDC',
    rewardAmount: String(50 + index * 25),
    maxParticipants: 10 + index,
    participantsCount: index + 1,
    status,
    aiSummary: faker.lorem.sentence(),
    minAssetToken: index % 2 === 0 ? null : 'USDC',
    minAssetAmount: '0',
    expiresAt: String(Math.floor(Date.now() / 1000) + 86400 * (index + 1)),
    indexedFromChain: true,
  }));

  const submissionStatuses = Object.values(SubmissionStatus);
  const submissions: SeedSubmission[] = submissionStatuses.map((status, index) => ({
    submissionKey: submissionKey(index),
    missionOnChainId: missions[index % missions.length].onChainId,
    hunterAddress: hunterAddresses[index % hunterAddresses.length],
    ipfsCid: `bafyseed-report-${index}`,
    textPayload: faker.lorem.paragraph(),
    sentiment: Number(faker.number.float({ min: -1, max: 1, fractionDigits: 2 })),
    status,
    stakeToken: 'XLM',
    stakeAmount: String(5 + index),
    rejectionReason:
      status === SubmissionStatus.REJECTED
        ? 'Report did not include reproduction steps.'
        : null,
    txHash: `seed-tx-report-${index}`,
    chainConfirmed:
      status === SubmissionStatus.PAID || status === SubmissionStatus.APPROVED,
  }));

  const proofStatuses = Object.values(ProofStatus);
  const proofs: SeedProof[] = proofStatuses.map((status, index) => ({
    seedKey: `seed-proof-${index}`,
    submissionKey: submissions[index].submissionKey,
    hunterAddress: submissions[index].hunterAddress,
    status,
    cid: `bafyseed-proof-${index}`,
    verdict:
      status === ProofStatus.VERIFIED
        ? 'Proof of Test verified'
        : status === ProofStatus.FAILED
          ? 'Attachment did not match the reported steps'
          : null,
  }));

  const disputeStatuses = Object.values(DisputeStatus);
  const disputes: SeedDispute[] = disputeStatuses.map((status, index) => ({
    seedKey: `seed-dispute-${index}`,
    submissionKey: submissions[index].submissionKey,
    raisedBy: submissions[index].hunterAddress,
    reason: faker.lorem.sentence(),
    status,
    resolution:
      status === DisputeStatus.RESOLVED || status === DisputeStatus.REJECTED
        ? faker.lorem.sentence()
        : null,
  }));

  const cashoutStatuses = Object.values(CashoutStatus);
  const cashouts: SeedCashout[] = cashoutStatuses.map((status, index) => ({
    seedKey: `seed-cashout-${index}`,
    hunterAddress: hunterAddresses[index % hunterAddresses.length],
    amount: String(100 + index * 50),
    asset: index % 2 === 0 ? 'XLM' : 'USDC',
    status,
    txHash: `seed-tx-cashout-${index}`,
  }));

  const notifications: SeedNotification[] = [
    {
      seedKey: 'seed-notification-paid',
      recipientAddress: hunterAddresses[0],
      type: NotificationType.SUBMISSION_PAID,
      subject: 'Report paid',
      body: 'Your report was paid on-chain.',
      payload: { submissionKey: submissions[3].submissionKey },
      missionOnChainId: missions[3].onChainId,
      submissionKey: submissions[3].submissionKey,
    },
    {
      seedKey: 'seed-notification-rejected',
      recipientAddress: hunterAddresses[1],
      type: NotificationType.SUBMISSION_REJECTED,
      subject: 'Report needs changes',
      body: 'A creator rejected your report.',
      payload: { submissionKey: submissions[2].submissionKey },
      missionOnChainId: missions[2].onChainId,
      submissionKey: submissions[2].submissionKey,
    },
  ];

  const leaderboard: SeedLeaderboardEntry[] = Object.values(LeaderboardPeriod).flatMap(
    (period) =>
      hunterAddresses.map((address, index) => ({
        seedKey: `seed-leaderboard-${period}-${index}`,
        address,
        displayName:
          users.find((user) => user.address === address)?.displayName ?? 'Hunter',
        period,
        rank: index + 1,
        xp: 1000 - index * 150,
        missionsCompleted: 12 - index * 2,
      })),
  );

  return {
    users,
    missions,
    submissions,
    proofs,
    disputes,
    cashouts,
    notifications,
    leaderboard,
  };
}
