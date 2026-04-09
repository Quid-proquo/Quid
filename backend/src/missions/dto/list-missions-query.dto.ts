import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export enum MissionListSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  HIGHEST_REWARD = 'highest_reward',
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
