import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { IPFS_CLIENT, IpfsClient } from './ipfs.client';
import { UploadService } from './upload.service';

const mockConfig: Partial<Record<string, string>> = {};

const mockConfigService = {
  get: (key: string, defaultValue?: string | number) =>
    mockConfig[key] ?? defaultValue,
};

const mockIpfsClient: Partial<IpfsClient> = {
  pin: jest.fn(),
};

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    Object.keys(mockConfig).forEach((k) => delete mockConfig[k]);
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: IPFS_CLIENT, useValue: mockIpfsClient },
      ],
    }).compile();

    service = module.get<UploadService>(UploadService);
  });

  describe('uploadFile', () => {
    it('pins the file and returns a real CID plus gateway URL', async () => {
      (mockIpfsClient.pin as jest.Mock).mockResolvedValue({
        cid: 'bafkreiabc',
        size: 6,
      });

      const result = await service.uploadFile({
        originalname: 'proof.png',
        mimetype: 'image/png',
        size: 6,
        buffer: Buffer.from('hello!'),
      });

      expect(mockIpfsClient.pin).toHaveBeenCalledWith({
        body: Buffer.from('hello!'),
        filename: 'proof.png',
        mimeType: 'image/png',
      });
      expect(result).toEqual({
        cid: 'bafkreiabc',
        filename: 'proof.png',
        mimeType: 'image/png',
        size: 6,
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/bafkreiabc',
        provider: 'pinata',
      });
    });

    it('strips path components out of the filename recorded in IPFS', async () => {
      (mockIpfsClient.pin as jest.Mock).mockResolvedValue({
        cid: 'bafkreiabc',
        size: 3,
      });

      await service.uploadFile({
        // A hostile client can send any originalname; it must not leak into
        // the IPFS DAG as a path.
        originalname: '../../etc/passwd',
        mimetype: 'text/plain',
        size: 3,
        buffer: Buffer.from('abc'),
      });

      expect(mockIpfsClient.pin).toHaveBeenCalledWith(
        expect.objectContaining({ filename: 'passwd' }),
      );
    });

    it('rejects a missing file body', async () => {
      await expect(service.uploadFile(undefined as never)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockIpfsClient.pin).not.toHaveBeenCalled();
    });

    it('rejects an empty buffer', async () => {
      await expect(
        service.uploadFile({
          originalname: 'empty.png',
          mimetype: 'image/png',
          size: 0,
          buffer: Buffer.alloc(0),
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockIpfsClient.pin).not.toHaveBeenCalled();
    });

    it('enforces the buffer length limit, not the client-declared size', async () => {
      mockConfig.UPLOAD_MAX_BYTES = '4';

      await expect(
        service.uploadFile({
          originalname: 'big.png',
          // Declaring a small size must not bypass the limit.
          mimetype: 'image/png',
          size: 1,
          buffer: Buffer.from('12345'),
        }),
      ).rejects.toThrow(PayloadTooLargeException);
      expect(mockIpfsClient.pin).not.toHaveBeenCalled();
    });

    it('uses the default size limit when UPLOAD_MAX_BYTES is unset or invalid', async () => {
      mockConfig.UPLOAD_MAX_BYTES = 'not-a-number';

      const allowed = Buffer.alloc(5 * 1024 * 1024);
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1);

      (mockIpfsClient.pin as jest.Mock).mockResolvedValue({
        cid: 'bafkreiabc',
        size: allowed.length,
      });

      await expect(
        service.uploadFile({
          originalname: 'ok.bin',
          mimetype: 'application/pdf',
          size: allowed.length,
          buffer: allowed,
        }),
      ).resolves.toMatchObject({ provider: 'pinata' });

      await expect(
        service.uploadFile({
          originalname: 'too-big.bin',
          mimetype: 'application/pdf',
          size: oversized.length,
          buffer: oversized,
        }),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('rejects a disallowed MIME type before it reaches the pin', async () => {
      await expect(
        service.uploadFile({
          originalname: 'virus.exe',
          mimetype: 'application/x-msdownload',
          size: 3,
          buffer: Buffer.from('MZ.'),
        }),
      ).rejects.toThrow(UnsupportedMediaTypeException);
      expect(mockIpfsClient.pin).not.toHaveBeenCalled();
    });

    it('honours a UPLOAD_ALLOWED_MIME_TYPES override', async () => {
      mockConfig.UPLOAD_ALLOWED_MIME_TYPES = 'image/png,application/pdf';

      (mockIpfsClient.pin as jest.Mock).mockResolvedValue({
        cid: 'bafkreiabc',
        size: 3,
      });

      await expect(
        service.uploadFile({
          originalname: 'proof.png',
          mimetype: 'image/png',
          size: 3,
          buffer: Buffer.from('png'),
        }),
      ).resolves.toMatchObject({ mimeType: 'image/png' });

      await expect(
        service.uploadFile({
          originalname: 'clip.webm',
          mimetype: 'video/webm',
          size: 3,
          buffer: Buffer.from('web'),
        }),
      ).rejects.toThrow(UnsupportedMediaTypeException);
    });
  });

  describe('uploadJson', () => {
    it('pins serialized JSON and returns a CID', async () => {
      (mockIpfsClient.pin as jest.Mock).mockResolvedValue({
        cid: 'bafkreiabc',
        size: 27,
      });

      const result = await service.uploadJson({
        feedback: 'Great dApp UX!',
        rating: 5,
      });

      expect(mockIpfsClient.pin).toHaveBeenCalledWith({
        body: Buffer.from(
          JSON.stringify({ feedback: 'Great dApp UX!', rating: 5 }),
        ),
        filename: 'feedback.json',
        mimeType: 'application/json',
      });
      expect(result).toEqual({
        cid: 'bafkreiabc',
        size: 27,
        gatewayUrl: 'https://gateway.pinata.cloud/ipfs/bafkreiabc',
        provider: 'pinata',
      });
    });

    it('rejects an oversized JSON body', async () => {
      mockConfig.UPLOAD_MAX_BYTES = '10';

      await expect(
        service.uploadJson({ padding: 'x'.repeat(100) }),
      ).rejects.toThrow(PayloadTooLargeException);
      expect(mockIpfsClient.pin).not.toHaveBeenCalled();
    });

    it('rejects JSON when the MIME override excludes it', async () => {
      mockConfig.UPLOAD_ALLOWED_MIME_TYPES = 'image/png';

      await expect(service.uploadJson({ a: 1 })).rejects.toThrow(
        UnsupportedMediaTypeException,
      );
      expect(mockIpfsClient.pin).not.toHaveBeenCalled();
    });
  });
});
