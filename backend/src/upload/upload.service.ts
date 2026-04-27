import { Injectable } from '@nestjs/common';
import { UploadedFilePayload } from './upload.types';

@Injectable()
export class UploadService {
  uploadFile(file: UploadedFilePayload) {
    return {
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      'buffer-received': true,
    };
  }

  uploadJson(payload: any) {
    return {
      'json-received': true,
      'byte-length': Buffer.byteLength(JSON.stringify(payload)),
    };
  }
}
