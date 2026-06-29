import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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
  @IsOptional()
  @IsString()
  status?: string;

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
