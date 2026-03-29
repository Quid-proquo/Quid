import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ListMissionsQueryDto,
  MissionListSort,
} from './dto/list-missions-query.dto';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicMissions(query: ListMissionsQueryDto): Promise<unknown> {
    const where = query.status ? { status: query.status } : {};
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
