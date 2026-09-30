import {
  BadGatewayException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinataIpfsClient } from './ipfs.client';

const mockConfig: Partial<Record<string, string>> = {};

const mockConfigService = {
  get: (key: string) => mockConfig[key],
};

/** Base32 CIDv1 of realistic length, i.e. one the client's sanity check passes. */
const VALID_CID = 'bafkrei' + 'q'.repeat(46);

type ResponsePartial = {
  status: number;
  jsonPayload?: Record<string, unknown>;
};

function toResponse(partial: ResponsePartial): Response {
  return {
    ok: partial.status >= 200 && partial.status < 300,
    status: partial.status,
    json: () => Promise.resolve(partial.jsonPayload ?? {}),
    text: () => Promise.resolve(JSON.stringify(partial.jsonPayload ?? {})),
  } as unknown as Response;
}

function inputsOf(mock: jest.Mock): {
  url: string;
  init: RequestInit;
  form: FormData;
} {
  const [url, init] = mock.mock.calls[0] as unknown as [string, RequestInit];
  return { url, init, form: init.body as FormData };
}

describe('PinataIpfsClient', () => {
  let client: PinataIpfsClient;

  beforeEach(async () => {
    Object.keys(mockConfig).forEach((k) => delete mockConfig[k]);
    (globalThis as Record<string, unknown>).fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PinataIpfsClient,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    client = module.get<PinataIpfsClient>(PinataIpfsClient);
  });

  it('pins with a JWT bearer header and returns the provider CID', async () => {
    mockConfig.PINATA_JWT = 'token-123';
    let seenUrl: string | undefined;
    let seenInit: RequestInit | undefined;
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation((url: string, init: RequestInit) => {
        seenUrl = url;
        seenInit = init;
        return Promise.resolve(
          toResponse({
            status: 200,
            jsonPayload: { IpfsHash: VALID_CID, PinSize: 4 },
          }),
        );
      });

    const result = await client.pin({
      body: Buffer.from('data'),
      filename: 'proof.png',
      mimeType: 'image/png',
    });

    expect(seenInit?.headers).toMatchObject({
      Authorization: 'Bearer token-123',
    });
    expect(seenInit?.method).toBe('POST');
    expect(seenUrl).toBe('https://api.pinata.cloud/pinning/pinFileToIPFS');
    expect(result).toEqual({ cid: VALID_CID, size: 4 });
  });

  it('authenticates with legacy key and secret as multipart fields', async () => {
    mockConfig.PINATA_API_KEY = 'pk';
    mockConfig.PINATA_API_SECRET = 'psk';
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          toResponse({
            status: 200,
            jsonPayload: { IpfsHash: VALID_CID, PinSize: 4 },
          }),
        ),
      );

    await client.pin({
      body: Buffer.from('data'),
      filename: 'proof.png',
      mimeType: 'image/png',
    });

    const { form } = inputsOf(globalThis.fetch as jest.Mock);
    expect(form.get('pinata_api_key')).toBe('pk');
    expect(form.get('pinata_secret_api_key')).toBe('psk');
    // The legacy mode must not get a JWT header.
    expect(form.get('Authorization')).toBeNull();
  });

  it('does not send a bearer header in legacy key/secret mode', async () => {
    mockConfig.PINATA_API_KEY = 'pk';
    mockConfig.PINATA_API_SECRET = 'psk';

    let seenHeaders: Record<string, string> | undefined;
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation((url: string, init: RequestInit) => {
        void url;
        seenHeaders = init.headers as Record<string, string>;
        return Promise.resolve(
          toResponse({
            status: 200,
            jsonPayload: { IpfsHash: VALID_CID, PinSize: 1 },
          }),
        );
      });

    await client.pin({
      body: Buffer.from('x'),
      filename: 'a.txt',
      mimeType: 'text/plain',
    });

    expect(seenHeaders).toBeDefined();
    expect(Object.keys(seenHeaders as object)).toHaveLength(0);
  });

  it('throws 503 with a non-leaking message when credentials are 401/403', async () => {
    mockConfig.PINATA_JWT = 'token-123';
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(toResponse({ status: 401, jsonPayload: {} })),
      );

    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(ServiceUnavailableException);

    try {
      await client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      });
    } catch (error) {
      const message = (error as Error).message;
      expect(message).not.toContain('token-123');
    }
  });

  it('throws 502 when the provider fails with a 5xx', async () => {
    mockConfig.PINATA_JWT = 'token-123';
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(toResponse({ status: 500, jsonPayload: {} })),
      );

    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('throws 502 when the provider is unreachable', async () => {
    mockConfig.PINATA_JWT = 'token-123';
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('throws 502 when the provider omits the CID', async () => {
    mockConfig.PINATA_JWT = 'token-123';
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          toResponse({
            status: 200,
            jsonPayload: { PinSize: 10 },
          }),
        ),
      );

    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('throws 502 when the provider returns something that is not a CID', async () => {
    mockConfig.PINATA_JWT = 'token-123';
    (globalThis as Record<string, unknown>).fetch = jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          toResponse({
            status: 200,
            jsonPayload: { IpfsHash: 'definitely-not-a-cid' },
          }),
        ),
      );

    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(BadGatewayException);
  });

  it('throws 503 when no credentials are configured at all', async () => {
    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
    // Must not have attempted a network call.
    expect(globalThis.fetch as jest.Mock).not.toHaveBeenCalled();
  });

  it('requires both parts of the legacy key pair', async () => {
    mockConfig.PINATA_API_KEY = 'pk-only';

    await expect(
      client.pin({
        body: Buffer.from('data'),
        filename: 'proof.png',
        mimeType: 'image/png',
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
