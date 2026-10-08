import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UploadedFilePayload } from './upload.types';

/**
 * Hard ceiling applied by multer before the buffer is held in memory. The
 * per-environment `UPLOAD_MAX_BYTES` is re-checked in the service; this only
 * stops a maliciously large body from ever being buffered.
 */
const MULTER_HARD_LIMIT_BYTES = 25 * 1024 * 1024;

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // Issue #312: pinning costs money and is unauthenticated-adjacent surface,
  // so uploads are limited harder than the global 100/min.
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MULTER_HARD_LIMIT_BYTES } }),
  )
  uploadFile(@UploadedFile() file: UploadedFilePayload) {
    return this.uploadService.uploadFile(file);
  }

  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post('json')
  @UseGuards(JwtAuthGuard)
  uploadJson(@Body() payload: unknown) {
    return this.uploadService.uploadJson(payload);
  }
}
