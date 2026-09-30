import {
  BadRequestException,
  Inject,
  Injectable,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IPFS_CLIENT, IpfsClient } from './ipfs.client';
import { UploadedFilePayload } from './upload.types';

/** 5 MiB — large enough for a demo video, small enough to bound pin costs. */
export const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/**
 * Feedback media only. Anything executable or archive-shaped is rejected so the
 * gateway can never be used as a file host for arbitrary content.
 */
export const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'application/pdf',
  'application/json',
  'text/plain',
] as const;

const JSON_MIME_TYPE = 'application/json';
const JSON_FILENAME = 'feedback.json';

export interface UploadFileResult {
  cid: string;
  filename: string;
  mimeType: string;
  size: number;
  gatewayUrl: string;
  provider: string;
}

export interface UploadJsonResult {
  cid: string;
  size: number;
  gatewayUrl: string;
  provider: string;
}

@Injectable()
export class UploadService {
  constructor(
    @Inject(IPFS_CLIENT) private readonly ipfs: IpfsClient,
    private readonly config: ConfigService,
  ) {}

  /**
   * Pin an uploaded file and return its real CID.
   *
   * The returned CID is what gets written to Soroban, so every failure mode
   * here throws — there is no locally-fabricated CID fallback.
   */
  async uploadFile(file: UploadedFilePayload): Promise<UploadFileResult> {
    if (!file) {
      throw new BadRequestException('No file was uploaded');
    }

    const maxBytes = this.maxBytes();
    this.assertMimeTypeAllowed(file.mimetype, file.originalname);

    const body = file.buffer ?? Buffer.alloc(0);

    if (body.byteLength === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    // Check the real buffer length, not the client-declared `size`, which is
    // attacker-controlled and only used as a hint by multer.
    if (body.byteLength > maxBytes) {
      throw new PayloadTooLargeException(
        `File is larger than the ${maxBytes} byte limit`,
      );
    }

    const { cid, size } = await this.ipfs.pin({
      body,
      filename: this.sanitizeFilename(file.originalname),
      mimeType: file.mimetype,
    });

    return {
      cid,
      filename: file.originalname,
      mimeType: file.mimetype,
      size,
      gatewayUrl: this.gatewayUrl(cid),
      provider: 'pinata',
    };
  }

  /** Pin a JSON document and return its real CID. */
  async uploadJson(payload: unknown): Promise<UploadJsonResult> {
    const json = JSON.stringify(payload ?? {});
    const body = Buffer.from(json, 'utf8');
    const maxBytes = this.maxBytes();

    if (body.byteLength > maxBytes) {
      throw new PayloadTooLargeException(
        `JSON body is larger than the ${maxBytes} byte limit`,
      );
    }

    if (!this.isMimeTypeAllowed(JSON_MIME_TYPE)) {
      throw new UnsupportedMediaTypeException(
        `Uploading ${JSON_MIME_TYPE} is not permitted`,
      );
    }

    const { cid, size } = await this.ipfs.pin({
      body,
      filename: JSON_FILENAME,
      mimeType: JSON_MIME_TYPE,
    });

    return {
      cid,
      size,
      gatewayUrl: this.gatewayUrl(cid),
      provider: 'pinata',
    };
  }

  private maxBytes(): number {
    const raw = this.config.get<string>('UPLOAD_MAX_BYTES');
    if (!raw) {
      return DEFAULT_MAX_UPLOAD_BYTES;
    }

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : DEFAULT_MAX_UPLOAD_BYTES;
  }

  private isMimeTypeAllowed(mimeType: string): boolean {
    const configured = this.config.get<string>('UPLOAD_ALLOWED_MIME_TYPES');
    const allowed = configured
      ? configured
          .split(',')
          .map((m) => m.trim().toLowerCase())
          .filter(Boolean)
      : [...DEFAULT_ALLOWED_MIME_TYPES];

    return allowed.includes(mimeType?.toLowerCase());
  }

  private assertMimeTypeAllowed(mimeType: string, filename: string): void {
    if (!this.isMimeTypeAllowed(mimeType)) {
      throw new UnsupportedMediaTypeException(
        `File type '${mimeType}' is not allowed for '${filename}'`,
      );
    }
  }

  /**
   * Strip any path component so a crafted `originalname` cannot influence the
   * filename recorded in the IPFS DAG.
   */
  private sanitizeFilename(originalname: string): string {
    const base = (originalname || 'upload').split(/[\\/]/).pop() || 'upload';
    return base.replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 128) || 'upload';
  }

  private gatewayUrl(cid: string): string {
    const gateway = (
      this.config.get<string>('IPFS_GATEWAY_URL') ??
      'https://gateway.pinata.cloud'
    ).replace(/\/+$/, '');

    return `${gateway}/ipfs/${cid}`;
  }
}
