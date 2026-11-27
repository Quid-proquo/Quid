import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; address: string };
}

@Controller('submissions/:submissionId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get()
  list(
    @Param('submissionId') submissionId: string,
    @Req() req: AuthenticatedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.comments.list(
      submissionId,
      req.user.address,
      cursor,
      limit ? Number(limit) : undefined,
    );
  }

  @Post()
  create(
    @Param('submissionId') submissionId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.comments.create(
      submissionId,
      req.user.address,
      dto.body,
      dto.attachments,
    );
  }

  @Patch(':commentId')
  edit(
    @Param('submissionId') submissionId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.comments.edit(submissionId, commentId, req.user.address, dto.body);
  }
}
