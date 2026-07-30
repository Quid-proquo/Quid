import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { VerifySignatureDto } from './dto/verify-signature.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('challenge')
  generateChallenge(@Query('address') address: string) {
    return this.authService.generateChallenge(address);
  }

  @Post('verify')
  verify(@Body() dto: VerifySignatureDto) {
    return this.authService.verifySignedPayload(dto.signedXdr);
  }
}
