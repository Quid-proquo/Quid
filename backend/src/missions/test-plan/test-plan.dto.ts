import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export const TEST_PLAN_NETWORKS = ['testnet', 'mainnet', 'futurenet'] as const;

export class TestPlanStepDto {
  @IsInt()
  @Min(1)
  order!: number;

  @IsString()
  @MaxLength(500)
  action!: string;

  @IsString()
  @MaxLength(500)
  expected!: string;
}

export class TestPlanDto {
  @IsUrl()
  appUrl!: string;

  @IsIn(TEST_PLAN_NETWORKS)
  network!: (typeof TEST_PLAN_NETWORKS)[number];

  // Soroban contract strkey: 'C' + 55 base32 characters.
  @IsOptional()
  @Matches(/^C[A-Z2-7]{55}$/, { message: 'targetContract must be a C-strkey' })
  targetContract?: string;

  @IsOptional()
  @IsArray()
  @Matches(/^[A-Za-z0-9_]{1,32}$/, {
    each: true,
    message: 'each function must be a valid Soroban symbol',
  })
  functions?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => TestPlanStepDto)
  steps!: TestPlanStepDto[];
}
