import { Controller, Post, UseInterceptors, UploadedFile, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadedFilePayload } from './upload.types';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: UploadedFilePayload) {
    return this.uploadService.uploadFile(file);
  }

  @Post('json')
  uploadJson(@Body() payload: any) {
    return this.uploadService.uploadJson(payload);
  }
}
