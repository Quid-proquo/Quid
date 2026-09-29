import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Issue #315: optional reviewer text attached when a submission payload is
 * reviewed; feeds the async AI summary/sentiment job.
 */
export class AttachSubmissionTextDto {
  @IsOptional()
  @IsString()
  @MaxLength(8_000)
  text?: string;
}
