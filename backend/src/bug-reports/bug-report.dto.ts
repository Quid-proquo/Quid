import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  Equals,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const BUG_REPORT_SCHEMA = 'quid.report.v1';

export enum BugSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export class BugReportEnvironmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  device?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  browser?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  wallet?: string;
}

export class BugReportDto {
  @Equals(BUG_REPORT_SCHEMA)
  schema!: typeof BUG_REPORT_SCHEMA;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsEnum(BugSeverity)
  severity!: BugSeverity;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  stepsToReproduce!: string[];

  @IsString()
  @MaxLength(2000)
  expected!: string;

  @IsString()
  @MaxLength(2000)
  actual!: string;

  @ValidateNested()
  @Type(() => BugReportEnvironmentDto)
  environment!: BugReportEnvironmentDto;

  // IPFS CIDs returned by /api/upload.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  attachments?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(128)
  linkedTransaction?: string;
}
