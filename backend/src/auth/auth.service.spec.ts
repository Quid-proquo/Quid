import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Keypair, WebAuth } from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

const SERVER_KEYPAIR = Keypair.random();
const CLIENT_KEYPAIR = Keypair.random();

const mockConfig: Partial<Record<string, string>> = {
  STELLAR_SERVER_SECRET: SERVER_KEYPAIR.secret(),
  HOME_DOMAIN: 'localhost',
  WEB_AUTH_DOMAIN: 'localhost',
  STELLAR_NETWORK: 'Test SDF Network ; September 2015',
};

const mockConfigService = {
  getOrThrow: (key: string) => {
    if (mockConfig[key] === undefined) throw new Error(`Missing ${key}`);
    return mockConfig[key];
  },
  get: (key: string, defaultValue?: string) => mockConfig[key] ?? defaultValue,
};

const mockPrismaService = {
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock.jwt.token'),
};

describe('AuthService - generateChallenge', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('returns a valid challenge for a well-formed Stellar address', () => {
    const address = CLIENT_KEYPAIR.publicKey();
    const result = service.generateChallenge(address);

    expect(result.address).toBe(address);
    expect(result.transaction).toBeTruthy();
    expect(result.homeDomain).toBe('localhost');
    expect(result.webAuthDomain).toBe('localhost');
    expect(result.networkPassphrase).toBe('Test SDF Network ; September 2015');
    expect(result.nonce).toBeTruthy();
    expect(result.expiresIn).toBe(300);
    expect(result.issuedAt).toBeCloseTo(Math.floor(Date.now() / 1000), -1);
  });

  it('returns a transaction that passes SEP-10 readChallengeTx verification', () => {
    const address = CLIENT_KEYPAIR.publicKey();
    const { transaction, networkPassphrase } =
      service.generateChallenge(address);

    expect(() =>
      WebAuth.readChallengeTx(
        transaction,
        SERVER_KEYPAIR.publicKey(),
        networkPassphrase,
        'localhost',
        'localhost',
      ),
    ).not.toThrow();
  });

  it('throws BadRequestException for an invalid Stellar address', () => {
    expect(() => service.generateChallenge('notavalidkey')).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for an empty address', () => {
    expect(() => service.generateChallenge('')).toThrow(BadRequestException);
  });
});

describe('AuthService - verifySignedPayload', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('upserts the user and returns { user, access_token } on first login', async () => {
    const networkPassphrase = 'Test SDF Network ; September 2015';
    const challenge = WebAuth.buildChallengeTx(
      SERVER_KEYPAIR,
      CLIENT_KEYPAIR.publicKey(),
      'localhost',
      300,
      networkPassphrase,
      'localhost',
    );
    const { tx } = WebAuth.readChallengeTx(
      challenge,
      SERVER_KEYPAIR.publicKey(),
      networkPassphrase,
      'localhost',
      'localhost',
    );
    tx.sign(CLIENT_KEYPAIR);
    const signedXdr = tx.toXDR();

    const mockUser = {
      id: 'uuid-123',
      address: CLIENT_KEYPAIR.publicKey(),
      email: null,
      displayName: null,
      bio: null,
      role: 'EARNER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockPrismaService.user.upsert.mockResolvedValue(mockUser);

    const result = await service.verifySignedPayload(signedXdr);

    expect(mockPrismaService.user.upsert).toHaveBeenCalledWith({
      where: { address: CLIENT_KEYPAIR.publicKey() },
      update: {},
      create: { address: CLIENT_KEYPAIR.publicKey() },
    });
    expect(mockJwtService.sign).toHaveBeenCalledWith({
      sub: 'uuid-123',
      address: CLIENT_KEYPAIR.publicKey(),
    });
    expect(result).toEqual({ user: mockUser, access_token: 'mock.jwt.token' });
  });

  it('throws UnauthorizedException for an invalid signed XDR', async () => {
    await expect(service.verifySignedPayload('invalid-xdr')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
