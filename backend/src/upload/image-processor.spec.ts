import {
  BadRequestException,
  PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import sharp from 'sharp';
import { ImageProcessor } from './image-processor';

const mockConfig: Partial<Record<string, string>> = {};

const mockConfigService = {
  get: (key: string, defaultValue?: string | number) =>
    mockConfig[key] ?? defaultValue,
};

const createImage = (format: 'jpeg' | 'png' | 'gif') =>
  sharp({
    create: {
      width: 8,
      height: 8,
      channels: 3,
      background: { r: 12, g: 34, b: 56 },
    },
  })
    .toFormat(format)
    .toBuffer();

const createJpegWithGpsExif = () =>
  sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 12, g: 34, b: 56 },
    },
  })
    .withExif({
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '51/1 30/1 3230/100',
        GPSLongitudeRef: 'W',
        GPSLongitude: '0/1 7/1 4366/100',
      },
    })
    .jpeg()
    .toBuffer();

const extractExif = async (image: Buffer) => {
  const { exif } = await sharp(image).metadata();
  if (!exif || exif.byteLength === 0) {
    throw new Error('Expected generated image to contain EXIF');
  }
  return exif;
};

const withDeclaredDimensions = (
  jpeg: Buffer,
  width: number,
  height: number,
) => {
  const patched = Buffer.from(jpeg);

  for (let i = 0; i < patched.length - 9; i += 1) {
    if (patched[i] === 0xff && patched[i + 1] === 0xc0) {
      patched.writeUInt16BE(height, i + 5);
      patched.writeUInt16BE(width, i + 7);
      return patched;
    }
  }

  throw new Error('JPEG SOF0 marker not found');
};

const withGifExif = (gif: Buffer, exif: Buffer) => {
  const packed = gif.readUInt8(10);
  let offset = 13;

  if ((packed & 0x80) !== 0) {
    offset += 3 * 2 ** ((packed & 0x07) + 1);
  }

  const subBlocks: Buffer[] = [];
  for (let i = 0; i < exif.byteLength; i += 255) {
    const chunk = exif.subarray(i, Math.min(i + 255, exif.byteLength));
    subBlocks.push(Buffer.from([chunk.byteLength]), chunk);
  }

  return Buffer.concat([
    gif.subarray(0, offset),
    Buffer.from([0x21, 0xff, 0x0b]),
    Buffer.from('Exif    ', 'ascii'),
    Buffer.from([0xff, 0x00, 0x00]),
    ...subBlocks,
    Buffer.from([0x00]),
    gif.subarray(offset),
  ]);
};

describe('ImageProcessor', () => {
  let processor: ImageProcessor;

  beforeEach(async () => {
    Object.keys(mockConfig).forEach((key) => delete mockConfig[key]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageProcessor,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get<ImageProcessor>(ImageProcessor);
  });

  it('re-encodes a JPEG with GPS EXIF and strips EXIF from the output', async () => {
    const source = await createJpegWithGpsExif();
    expect((await extractExif(source)).byteLength).toBeGreaterThan(0);

    const processed = await processor.process(source, 'image/jpeg', 'photo.jpg');

    expect(processed.mimeType).toBe('image/jpeg');
    expect((await sharp(processed.body).metadata()).exif).toBeUndefined();
    expect(processed.thumbnail).toBeDefined();
    expect(processed.thumbnail?.mimeType).toBe('image/webp');
    expect(processed.thumbnail?.filename).toBe('photo-thumb.webp');

    const thumbnail = processed.thumbnail;
    if (!thumbnail) {
      throw new Error('Expected thumbnail');
    }
    const thumbnailMetadata = await sharp(thumbnail.body).metadata();
    expect(thumbnailMetadata.format).toBe('webp');
    expect(thumbnailMetadata.width).toBe(400);
    expect(thumbnailMetadata.exif).toBeUndefined();
  });

  it('rejects images above the pixel limit', async () => {
    const oversized = withDeclaredDimensions(await createImage('jpeg'), 8000, 6000);

    await expect(
      processor.process(oversized, 'image/jpeg', 'huge.jpg'),
    ).rejects.toThrow(PayloadTooLargeException);
  });

  it('honours the configured pixel limit', async () => {
    const image = await createImage('png');
    mockConfig.UPLOAD_MAX_IMAGE_PIXELS = '100';

    await expect(
      processor.process(image, 'image/png', 'small.png'),
    ).resolves.toMatchObject({ mimeType: 'image/png' });

    mockConfig.UPLOAD_MAX_IMAGE_PIXELS = '10';

    await expect(
      processor.process(image, 'image/png', 'small.png'),
    ).rejects.toThrow(PayloadTooLargeException);
  });

  it('honours the configured thumbnail width', async () => {
    mockConfig.UPLOAD_THUMBNAIL_WIDTH = '120';
    const processed = await processor.process(
      await createImage('png'),
      'image/png',
      'small.png',
    );

    expect(processed.thumbnail?.body).toBeDefined();
    const thumbnail = processed.thumbnail;
    if (!thumbnail) {
      throw new Error('Expected thumbnail');
    }
    expect((await sharp(thumbnail.body).metadata()).width).toBe(120);
  });

  it('rejects GIFs containing EXIF', async () => {
    const exif = await extractExif(await createJpegWithGpsExif());
    const gif = withGifExif(await createImage('gif'), exif);

    await expect(sharp(gif).metadata()).resolves.toMatchObject({
      format: 'gif',
    });
    await expect(processor.process(gif, 'image/gif', 'exif.gif')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('passes GIFs without EXIF through unchanged', async () => {
    const gif = await createImage('gif');

    const processed = await processor.process(gif, 'image/gif', 'plain.gif');

    expect(processed.body).toEqual(gif);
    expect(processed.mimeType).toBe('image/gif');
    expect(processed.thumbnail).toBeUndefined();
  });

  it('passes non-image MIME types through unchanged', async () => {
    const body = Buffer.from('feedback');

    const processed = await processor.process(body, 'text/plain', 'note.txt');

    expect(processed.body).toBe(body);
    expect(processed.mimeType).toBe('text/plain');
    expect(processed.thumbnail).toBeUndefined();
  });

  it('wraps sharp decode failures in BadRequestException', async () => {
    await expect(
      processor.process(Buffer.from('not an image'), 'image/png', 'broken.png'),
    ).rejects.toThrow(BadRequestException);
  });
});
