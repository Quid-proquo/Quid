import { IsString, Length, Matches } from 'class-validator';

export class ChallengeQueryDto {
  @IsString()
  @Length(56, 56, { message: 'Address must be exactly 56 characters long' })
  @Matches(/^G[A-Z2-7]{55}$/, {
    message: 'Address must be a valid Stellar public key (starts with G)',
  })
  address: string = '';
}
