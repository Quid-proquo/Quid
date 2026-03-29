import { Injectable } from '@nestjs/common';
import { MissionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListMissionsQueryDto,
  MissionListSort,
} from './dto/list-missions-query.dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicMissions(query: ListMissionsQueryDto): Promise<unknown> {
    const normalizedStatus = query.status?.toUpperCase() as
      | MissionStatus
      | undefined;
    const where = normalizedStatus ? { status: normalizedStatus } : {};
    const orderBy = {
      createdAt: query.sort === MissionListSort.OLDEST ? 'asc' : 'desc',
    } as const;

    const missions = await this.prisma.mission.findMany({
      where,
      orderBy,
      take: query.limit,
    });

    return missions as unknown;
  }
}
