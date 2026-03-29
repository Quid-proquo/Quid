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

  verifyChallenge(
    @Body() verifyChallengeDto: VerifyChallengeDto,
  ): VerificationResponseDto {
    const clientAddress = this.authService.verifyChallengeSignature(
      verifyChallengeDto.signedChallengeTx,
    );

    return {
      clientAddress,
    };
  @Get('challenge')
  getChallenge(@Query() query: ChallengeQueryDto) {
    return this.authService.generateChallenge(query.address);
  }

  @Post('verify')
  verifySignature(@Body() body: VerifySignatureDto) {
    return this.authService.verifySignature(body.signedXdr);
  }
}
