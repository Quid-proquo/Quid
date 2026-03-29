import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum MissionQueryStatus {
  OPEN = 'OPEN',
  STARTED = 'STARTED',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MissionListSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
}

export class ListMissionsQueryDto {
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
