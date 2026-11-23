export interface UploadedFilePayload {
  originalname: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
}

export interface ProcessedImageThumbnail {
  body: Buffer;
  filename: string;
  mimeType: 'image/webp';
}

export interface ProcessedImage {
  body: Buffer;
  mimeType: string;
  thumbnail?: ProcessedImageThumbnail;
}
