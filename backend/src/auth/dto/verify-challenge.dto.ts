import { IsString, IsNotEmpty } from 'class-validator';

export class VerifyChallengeDto {
  @IsString()
  @IsNotEmpty()
  signedChallengeTx!: string;
}

export class VerificationResponseDto {
  clientAddress!: string;
}
