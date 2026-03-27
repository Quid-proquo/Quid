import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  VerifyChallengeDto,
  VerificationResponseDto,
} from './dto/verify-challenge.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-challenge')
  async verifyChallenge(
    @Body() verifyChallengeDto: VerifyChallengeDto,
  ): Promise<VerificationResponseDto> {
    const clientAddress = await this.authService.verifyChallengeSignature(
      verifyChallengeDto.signedChallengeTx,
    );

    return {
      clientAddress,
    };
  }
}
