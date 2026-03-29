import { Controller, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  VerifyChallengeDto,
  VerificationResponseDto,
} from './dto/verify-challenge.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  verifyChallenge(
    @Body() verifyChallengeDto: VerifyChallengeDto,
  ): VerificationResponseDto {
    const clientAddress = this.authService.verifyChallengeSignature(
      verifyChallengeDto.signedChallengeTx,
    );

    return {
      clientAddress,
    };
  }
}
