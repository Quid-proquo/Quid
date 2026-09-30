import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum MissionListSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export enum MissionQueryStatus {
  OPEN = 'OPEN',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class ListMissionsQueryDto {
  // Use enum members rather than `string`: an arbitrary value such as "BOGUS"
  // would otherwise reach Prisma and surface as a raw driver error.
  @IsOptional()
  @IsEnum(MissionQueryStatus)
  status?: MissionQueryStatus;

  @IsOptional()
  @IsEnum(MissionListSort)
  sort?: MissionListSort;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
