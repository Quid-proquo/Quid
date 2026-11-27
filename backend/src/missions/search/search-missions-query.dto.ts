import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumberString,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum MissionSearchSort {
  RELEVANCE = 'relevance',
  NEWEST = 'newest',
  REWARD = 'reward',
}

export class SearchMissionsQueryDto {
  @IsOptional() @IsString() @MaxLength(200) q?: string;
  @IsOptional() @IsString() token?: string;
  @IsOptional() @IsNumberString() minReward?: string;
  @IsOptional() @IsNumberString() maxReward?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() network?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  requiresProof?: boolean;

  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) =>
      (Array.isArray(value) ? value : [value]) as string[],
  )
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional() @IsEnum(MissionSearchSort) sort?: MissionSearchSort;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
}
