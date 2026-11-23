import {
  CashoutStatus,
  DisputeStatus,
  LeaderboardPeriod,
  MissionStatus,
  ProofStatus,
  SubmissionStatus,
  type PrismaClient,
} from '@prisma/client';
import { buildSeedData, type SeedData } from '../../prisma/seed/index';
import { seedDatabase } from '../../prisma/seed/run';

interface MockDelegate {
  upsert: jest.Mock<Promise<{ id: string }>, [unknown]>;
}

interface MockClient {
  user: MockDelegate;
  mission: MockDelegate;
  submission: MockDelegate;
  proof: MockDelegate;
  dispute: MockDelegate;
  cashout: MockDelegate;
  notification: MockDelegate;
  leaderboardEntry: MockDelegate;
}

function delegate(): MockDelegate {
  return { upsert: jest.fn(() => Promise.resolve({ id: 'generated-id' })) };
}

function createMockClient(): MockClient {
  return {
    user: delegate(),
    mission: delegate(),
    submission: delegate(),
    proof: delegate(),
    dispute: delegate(),
    cashout: delegate(),
    notification: delegate(),
    leaderboardEntry: delegate(),
  };
}

function asClient(client: MockClient): PrismaClient {
  return client as unknown as PrismaClient;
}

function cloneData(data: SeedData): SeedData {
  return JSON.parse(JSON.stringify(data)) as SeedData;
}

describe('seed data', () => {
  it('is deterministic across builds', () => {
    expect(buildSeedData()).toEqual(buildSeedData());
  });

  it('covers every mission and submission status', () => {
    const data = buildSeedData();
    const missionStatuses = new Set(data.missions.map((m) => m.status));
    const submissionStatuses = new Set(data.submissions.map((s) => s.status));

    expect(Array.from(missionStatuses).sort()).toEqual(
      Object.values(MissionStatus).sort(),
    );
    expect(Array.from(submissionStatuses).sort()).toEqual(
      Object.values(SubmissionStatus).sort(),
    );
  });

  it('covers every proof, dispute, cashout and leaderboard state', () => {
    const data = buildSeedData();

    expect(new Set(data.proofs.map((p) => p.status)).size).toBe(
      Object.keys(ProofStatus).length,
    );
    expect(new Set(data.disputes.map((d) => d.status)).size).toBe(
      Object.keys(DisputeStatus).length,
    );
    expect(new Set(data.cashouts.map((c) => c.status)).size).toBe(
      Object.keys(CashoutStatus).length,
    );
    expect(new Set(data.leaderboard.map((l) => l.period)).size).toBe(
      Object.keys(LeaderboardPeriod).length,
    );
  });
});

describe('seedDatabase', () => {
  const data = buildSeedData();

  it('is idempotent when run twice', async () => {
    const client = createMockClient();

    await seedDatabase(asClient(client), data);
    const delegates: MockDelegate[] = Object.values(client);
    const firstCounts = delegates.map((current) => {
      const calls = current.upsert.mock.calls as unknown[];
      return calls.length;
    });
    const firstCalls = delegates.map((current) =>
      JSON.stringify(current.upsert.mock.calls),
    );

    await seedDatabase(asClient(client), data);

    delegates.forEach((current, index) => {
      const expected = firstCounts[index];
      expect(expected).toBeGreaterThan(0);
      expect(current.upsert.mock.calls).toHaveLength(expected * 2);
      expect(JSON.stringify(current.upsert.mock.calls.slice(expected))).toBe(
        firstCalls[index],
      );
    });
  });

  it('rejects a submission whose mission was not seeded', async () => {
    const client = createMockClient();
    const broken = cloneData(data);
    broken.submissions[0].missionOnChainId = 'missing-mission';

    await expect(seedDatabase(asClient(client), broken)).rejects.toThrow(
      'Seed mission missing-mission was not created',
    );
  });

  it('rejects a proof whose submission was not seeded', async () => {
    const client = createMockClient();
    const broken = cloneData(data);
    broken.proofs[0].submissionKey = 'missing-submission';

    await expect(seedDatabase(asClient(client), broken)).rejects.toThrow(
      'Seed submission missing-submission was not created',
    );
  });

  it('rejects a dispute whose submission was not seeded', async () => {
    const client = createMockClient();
    const broken = cloneData(data);
    broken.disputes[0].submissionKey = 'missing-submission';

    await expect(seedDatabase(asClient(client), broken)).rejects.toThrow(
      'Seed submission missing-submission was not created',
    );
  });

  it('rejects a notification with missing links', async () => {
    const client = createMockClient();
    const broken = cloneData(data);
    broken.notifications[0].missionOnChainId = 'missing-mission';

    await expect(seedDatabase(asClient(client), broken)).rejects.toThrow(
      'Seed notification seed-notification-paid is missing links',
    );
  });
});
