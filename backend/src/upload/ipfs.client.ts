import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Injection token so tests can swap in a mock without touching the network. */
export const IPFS_CLIENT = 'IPFS_CLIENT';

export interface PinInput {
  /** Raw bytes to pin. */
  body: Buffer;
  /** Filename recorded in the IPFS DAG. */
  filename: string;
  /** MIME type recorded in the IPFS DAG. */
  mimeType: string;
}

export interface PinResult {
  cid: string;
  /** Size reported by the provider, in bytes. */
  size: number;
}

export interface IpfsClient {
  pin(input: PinInput): Promise<PinResult>;
}

const PINATA_ENDPOINT = 'https://api.pinata.cloud/pinning/pinFileToIPFS';
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * CIDv0 (base58btc) or CIDv1 (base32) — anything else means the provider gave us
 * something that is not a CID. Rejecting it matters because the CID is what
 * gets written to Soroban: a malformed one is unrecoverable and unresolvable.
 */
const CID_PATTERN = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;

interface PinataResponse {
  IpfsHash?: string;
  PinSize?: number;
}

/**
 * Pins to IPFS via the Pinata API.
 *
 * Credentials come from the environment only — there is no committed default
 * and no silent fallback. If the provider is unconfigured the request fails
 * loudly with a 503 rather than returning a locally-fabricated CID, which is
 * what the previous stub did and what would put a dead reference on-chain.
 */
@Injectable()
export class PinataIpfsClient implements IpfsClient {
  private readonly logger = new Logger(PinataIpfsClient.name);

  constructor(private readonly config: ConfigService) {}

  async pin(input: PinInput): Promise<PinResult> {
    const credentials = this.resolveCredentials();

    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(input.body)], { type: input.mimeType }),
      input.filename,
    );

    // The legacy key/secret mode is authenticated through multipart fields,
    // not headers.
    const headers: Record<string, string> = {};
    if (credentials.jwt) {
      headers.Authorization = `Bearer ${credentials.jwt}`;
    } else {
      form.append('pinata_api_key', credentials.key as string);
      form.append('pinata_secret_api_key', credentials.secret as string);
    }

    let response: Response;
    try {
      response = await fetch(PINATA_ENDPOINT, {
        method: 'POST',
        headers,
        body: form,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`IPFS pin request failed: ${reason}`);
      throw new BadGatewayException(
        'Could not reach the IPFS provider. Please try again.',
      );
    }

    if (!response.ok) {
      const detail = (await response.text().catch(() => '')).slice(0, 200);
      this.logger.error(`IPFS provider returned ${response.status}: ${detail}`);

      if (response.status === 401 || response.status === 403) {
        // Never echo the credential itself back to the caller.
        throw new ServiceUnavailableException(
          'IPFS provider rejected our credentials. Check PINATA_JWT (or PINATA_API_KEY / PINATA_API_SECRET).',
        );
      }

      throw new BadGatewayException(
        `IPFS provider returned ${response.status}. Please try again.`,
      );
    }

    const payload = (await response.json().catch(() => ({}))) as PinataResponse;
    const cid = payload.IpfsHash;

    if (!cid || !CID_PATTERN.test(cid)) {
      this.logger.error(
        `IPFS provider returned an unusable CID: ${String(cid)}`,
      );
      throw new BadGatewayException(
        'IPFS provider did not return a valid CID.',
      );
    }

    return { cid, size: payload.PinSize ?? input.body.byteLength };
  }

  private resolveCredentials(): {
    jwt?: string;
    key?: string;
    secret?: string;
  } {
    const jwt = this.config.get<string>('PINATA_JWT');
    if (jwt) {
      return { jwt };
    }

    const key = this.config.get<string>('PINATA_API_KEY');
    const secret = this.config.get<string>('PINATA_API_SECRET');
    if (key && secret) {
      return { key, secret };
    }

    throw new ServiceUnavailableException(
      'IPFS uploads are not configured. Set PINATA_JWT (or PINATA_API_KEY and PINATA_API_SECRET).',
    );
  }
}
