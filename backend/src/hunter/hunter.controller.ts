import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HunterService } from './hunter.service';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    address: string;
  };
}

@Controller('hunter')
export class HunterController {
  constructor(private readonly hunterService: HunterService) {}

  // Issue #327: hunter-facing submissions list. The address comes from the
  // JWT, never from the caller, so a hunter can only read their own rows.
  @UseGuards(JwtAuthGuard)
  @Get('my-submissions')
  mySubmissions(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hunterService.getMySubmissions(req.user.address);
  }

  @UseGuards(JwtAuthGuard)
  @Get('claimables')
  claimables(@Req() req: AuthenticatedRequest): Promise<unknown> {
    return this.hunterService.getClaimables(req.user.address);
  }

  @UseGuards(JwtAuthGuard)
  @Post('claimables/:submissionId/claim')
  claim(
    @Req() req: AuthenticatedRequest,
    @Param('submissionId') submissionId: string,
  ): Promise<unknown> {
    return this.hunterService.claimSubmission(req.user.address, submissionId);
  }
}
