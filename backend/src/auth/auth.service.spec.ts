import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { WebAuth } from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service.js';

jest.mock('@stellar/stellar-sdk', () => ({
  WebAuth: {
    readChallengeTx: jest.fn(),
    verifyChallengeTxSigners: jest.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              switch (key) {
                case 'STELLAR_SERVER_PUBLIC_KEY':
                  return 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
                case 'STELLAR_NETWORK':
                  return 'TESTNET';
                case 'STELLAR_HOME_DOMAIN':
                  return 'example.com';
                case 'STELLAR_WEB_AUTH_DOMAIN':
                  return 'example.com';
                default:
                  return undefined;
              }
            },
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should verify valid signed challenge and return client address', () => {
    (WebAuth.readChallengeTx as jest.Mock).mockReturnValue({
      clientAccountID:
        'GCLIENTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    });

    (WebAuth.verifyChallengeTxSigners as jest.Mock).mockReturnValue([
      'GCLIENTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    ]);

    const result = service.verifyChallengeSignature('FAKE_SIGNED_CHALLENGE');

    expect(result).toBe(
      'GCLIENTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    );
    expect(WebAuth.readChallengeTx).toHaveBeenCalledWith(
      'FAKE_SIGNED_CHALLENGE',
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      'Test SDF Network ; September 2015',
      'example.com',
      'example.com',
    );
    expect(WebAuth.verifyChallengeTxSigners).toHaveBeenCalledWith(
      'FAKE_SIGNED_CHALLENGE',
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      'Test SDF Network ; September 2015',
      ['GCLIENTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'],
      'example.com',
      'example.com',
    );
  });

  it('should throw UnauthorizedException when verification fails', async () => {
    (WebAuth.readChallengeTx as jest.Mock).mockReturnValue({
      clientAccountID:
        'GCLIENTXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    });

    (WebAuth.verifyChallengeTxSigners as jest.Mock).mockImplementation(() => {
      throw new Error('Transaction not signed by server');
    });

    await expect(
      service.verifyChallengeSignature('INVALID_CHALLENGE'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException for malformed challenge', async () => {
    (WebAuth.readChallengeTx as jest.Mock).mockImplementation(() => {
      throw new Error(
        'Invalid challenge: unable to deserialize challengeTx transaction string',
      );
    });

    await expect(
      service.verifyChallengeSignature('MALFORMED_CHALLENGE'),
    ).rejects.toThrow(UnauthorizedException);
  });
});
