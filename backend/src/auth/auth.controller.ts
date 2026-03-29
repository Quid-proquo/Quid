import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  VerifyChallengeDto,
  VerificationResponseDto,
} from './dto/verify-challenge.dto.js';
import { ChallengeQueryDto } from './dto/challenge-query.dto.js';
import { VerifySignatureDto } from './dto/verify-signature.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('verify-challenge')
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

  @Get('challenge')
  getChallenge(@Query() query: ChallengeQueryDto): {
    transaction: string;
    networkPassphrase: string;
  } {
    return this.authService.generateChallenge(query.address);
  }

  @Post('verify')
  async verifySignature(@Body() body: VerifySignatureDto): Promise<{ token: string }> {
    const token = await this.authService.verifySignedPayload(body.signedXdr);
    return { token };
  }
}
