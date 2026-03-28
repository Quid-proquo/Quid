import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('challenge')
  getChallenge(@Query() query: ChallengeQueryDto) {
    return this.authService.generateChallenge(query.address);
  }

  @Post('verify')
  verifySignature(@Body() body: VerifySignatureDto) {
    return this.authService.verifySignature(body.signedXdr);
  }
}
