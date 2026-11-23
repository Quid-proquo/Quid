import {
  BadRequestException,
  Injectable,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp, { Metadata } from 'sharp';
import { ProcessedImage } from './upload.types';

export type { ProcessedImage } from './upload.types';

export const DEFAULT_MAX_IMAGE_PIXELS = 40_000_000;
export const DEFAULT_THUMBNAIL_WIDTH = 400;

@Injectable()
export class ImageProcessor {
  constructor(private readonly config: ConfigService) {}

  async process(
    body: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<ProcessedImage> {
    const normalized = (mimeType ?? '').trim().toLowerCase();

    if (
      normalized === 'image/png' ||
      normalized === 'image/jpeg' ||
      normalized === 'image/webp'
    ) {
      return this.reencode(body, normalized, filename);
    }

    if (normalized === 'image/gif') {
      return this.processGif(body);
    }

    return { body, mimeType };
  }

  private async reencode(
    body: Buffer,
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp',
    filename: string,
  ): Promise<ProcessedImage> {
    const metadata = await this.readMetadata(body, mimeType);
    this.assertPixelCount(metadata);

    try {
      const pipeline = sharp(body, { limitInputPixels: false }).rotate();
      const main = pipeline.clone();

      if (mimeType === 'image/png') {
        main.png();
      } else if (mimeType === 'image/jpeg') {
        main.jpeg();
      } else {
        main.webp();
      }

      const reencoded = await main.toBuffer();
      const thumbnail = await pipeline
        .clone()
        .resize({ width: this.thumbnailWidth() })
        .webp()
        .toBuffer();

      return {
        body: reencoded,
        mimeType,
        thumbnail: {
          body: thumbnail,
          filename: this.thumbnailFilename(filename),
          mimeType: 'image/webp',
        },
      };
    } catch {
      throw new BadRequestException(`Invalid ${mimeType} image`);
    }
  }

  private async processGif(body: Buffer): Promise<ProcessedImage> {
    const metadata = await this.readMetadata(body, 'image/gif');
    this.assertPixelCount(metadata);

    if (this.hasExif(metadata) || this.hasGifExifMarker(body)) {
      throw new BadRequestException(
        'GIF images containing EXIF metadata are not allowed',
      );
    }

    return { body, mimeType: 'image/gif' };
  }

  private async readMetadata(body: Buffer, mimeType: string): Promise<Metadata> {
    try {
      return await sharp(body, { limitInputPixels: false }).metadata();
    } catch {
      throw new BadRequestException(`Invalid ${mimeType} image`);
    }
  }

  private assertPixelCount(metadata: Metadata): void {
    const maxPixels = this.maxPixels();
    const pixels = (metadata.width ?? 0) * (metadata.height ?? 0);

    if (pixels > maxPixels) {
      throw new PayloadTooLargeException(
        `Image exceeds the ${maxPixels} pixel limit`,
      );
    }
  }

  private hasExif(metadata: Metadata): boolean {
    return Boolean(
      (metadata.exif && metadata.exif.byteLength > 0) ||
        (metadata.orientation !== undefined && metadata.orientation > 1),
    );
  }

  private hasGifExifMarker(body: Buffer): boolean {
    return (
      body.includes(Buffer.from('Exif    ', 'ascii')) ||
      body.includes(Buffer.from('Exif\0\0', 'ascii'))
    );
  }

  private maxPixels(): number {
    const raw = this.config.get<string>('UPLOAD_MAX_IMAGE_PIXELS');
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_MAX_IMAGE_PIXELS;
  }

  private thumbnailWidth(): number {
    const raw = this.config.get<string>('UPLOAD_THUMBNAIL_WIDTH');
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;

    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_THUMBNAIL_WIDTH;
  }

  private thumbnailFilename(filename: string): string {
    const base = filename.replace(/\.[^./\\]+$/, '') || 'image';
    return `${base}-thumb.webp`;
  }
}
