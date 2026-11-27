import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MissionSearchSort,
  SearchMissionsQueryDto,
} from './search-missions-query.dto';

// Must match the expression of "missions_search_idx".
const DOC = Prisma.sql`(
  setweight(to_tsvector('english', coalesce("title", '')), 'A') ||
  setweight(to_tsvector('english', coalesce("ai_summary", '')), 'B') ||
  setweight(to_tsvector('english', coalesce("metadata"->>'tags', '')), 'C')
)`;

@Injectable()
export class MissionSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Build the parameterised query; user input is never concatenated. */
  buildQuery(dto: SearchMissionsQueryDto): Prisma.Sql {
    const q = dto.q?.trim();
    const where: Prisma.Sql[] = [];
    const tsq = q ? Prisma.sql`websearch_to_tsquery('english', ${q})` : null;

    if (tsq) where.push(Prisma.sql`${DOC} @@ ${tsq}`);
    if (dto.token) where.push(Prisma.sql`"reward_token" = ${dto.token}`);
    if (dto.status) where.push(Prisma.sql`"status"::text = ${dto.status}`);
    if (dto.minReward) {
      where.push(Prisma.sql`"reward_amount"::numeric >= ${dto.minReward}::numeric`);
    }
    if (dto.maxReward) {
      where.push(Prisma.sql`"reward_amount"::numeric <= ${dto.maxReward}::numeric`);
    }
    if (dto.network) {
      where.push(Prisma.sql`"metadata"->>'network' = ${dto.network}`);
    }
    if (dto.requiresProof !== undefined) {
      where.push(
        Prisma.sql`coalesce("metadata"->>'requiresProof', 'false') = ${String(dto.requiresProof)}`,
      );
    }
    if (dto.tags?.length) {
      where.push(Prisma.sql`"metadata"->'tags' ?| ${dto.tags}::text[]`);
    }

    const sort = dto.sort ?? (tsq ? MissionSearchSort.RELEVANCE : MissionSearchSort.NEWEST);
    let order = Prisma.sql`"created_at" DESC`;
    if (sort === MissionSearchSort.REWARD) {
      order = Prisma.sql`"reward_amount"::numeric DESC`;
    } else if (sort === MissionSearchSort.RELEVANCE && tsq) {
      order = Prisma.sql`ts_rank_cd(${DOC}, ${tsq}) DESC, "created_at" DESC`;
    }

    const whereSql = where.length
      ? Prisma.sql`WHERE ${Prisma.join(where, ' AND ')}`
      : Prisma.empty;
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;

    return Prisma.sql`SELECT * FROM "missions" ${whereSql} ORDER BY ${order} LIMIT ${limit} OFFSET ${offset}`;
  }

  search(dto: SearchMissionsQueryDto) {
    return this.prisma.$queryRaw(this.buildQuery(dto));
  }
}
