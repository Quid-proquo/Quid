import { PrismaService } from '../prisma/prisma.service';
import { MissionsService } from './missions.service';
import {
  MissionListSort,
  MissionQueryStatus,
} from './dto/list-missions-query.dto';

describe('MissionsService', () => {
  let service: MissionsService;
  let prisma: { mission: { findMany: jest.Mock } };

  beforeEach(() => {
    prisma = {
      mission: {
        findMany: jest.fn(),
      },
    };

    service = new MissionsService(prisma as unknown as PrismaService);
  });

  it('applies filters, newest sort, and limit to the public mission query', async () => {
    prisma.mission.findMany.mockResolvedValue([]);

    await service.listPublicMissions({
      status: MissionQueryStatus.OPEN,
      sort: MissionListSort.NEWEST,
      limit: 5,
    });

    expect(prisma.mission.findMany).toHaveBeenCalledWith({
      where: { status: MissionQueryStatus.OPEN },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  });

  it('uses default newest ordering when no query params are provided', async () => {
    prisma.mission.findMany.mockResolvedValue([]);

    await service.listPublicMissions({});

    expect(prisma.mission.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      take: undefined,
    });
  });

  it('supports oldest sorting for public mission discovery', async () => {
    prisma.mission.findMany.mockResolvedValue([]);

    await service.listPublicMissions({
      sort: MissionListSort.OLDEST,
    });

    expect(prisma.mission.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'asc' },
      take: undefined,
    });
  });
});
