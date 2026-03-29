import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebAuth, Keypair } from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service.js';

interface AuthConfig {
  serverKeypair: Keypair;
  webAuthDomain: string;
  networkPassphrase: string;
}

@Injectable()
export class AuthService {
  private readonly serverAccountId: string;
  private readonly networkPassphrase: string;
  private readonly horizonUrl: string;
  private readonly prisma: PrismaService;
  private readonly config: ConfigService;

  constructor(
    private configService: ConfigService,
    prisma: PrismaService,
  ) {
    this.prisma = prisma;
    this.config = configService;
    this.serverAccountId =
      this.configService.get<string>('STELLAR_SERVER_PUBLIC_KEY') || '';
    const network =
      this.configService.get<string>('STELLAR_NETWORK') || 'TESTNET';
    this.networkPassphrase =
      network === 'PUBLIC'
        ? 'Public Global Stellar Network ; September 2015'
        : 'Test SDF Network ; September 2015';
    this.horizonUrl =
      network === 'PUBLIC'
        ? 'https://horizon.stellar.org'
        : 'https://horizon-testnet.stellar.org';

    if (!this.serverAccountId) {
      throw new Error(
        'STELLAR_SERVER_PUBLIC_KEY environment variable is required',
      );
    }
  }

  verifyChallengeSignature(signedChallengeTx: string): string {
    const homeDomain =
      this.configService.get<string>('STELLAR_HOME_DOMAIN') || '';
    const webAuthDomain =
      this.configService.get<string>('STELLAR_WEB_AUTH_DOMAIN') || '';

    if (!homeDomain) {
      throw new Error('STELLAR_HOME_DOMAIN environment variable is required');
    }

    if (!webAuthDomain) {
      throw new Error(
        'STELLAR_WEB_AUTH_DOMAIN environment variable is required',
      );
    }

    try {
      // 1. Read the signed challenge XDR with WebAuth API
      const challengeTx = WebAuth.readChallengeTx(
        signedChallengeTx,
        this.serverAccountId,
        this.networkPassphrase,
        homeDomain,
        webAuthDomain,
      );

      // 2. Verify the signer list with WebAuth.verifyChallengeTxSigners
      WebAuth.verifyChallengeTxSigners(
        signedChallengeTx,
        this.serverAccountId,
        this.networkPassphrase,
        [challengeTx.clientAccountID],
        homeDomain,
        webAuthDomain,
      );

      // 3. Extract the client account ID from the challenge transaction
      const clientAccount = challengeTx.clientAccountID;

      // 4. Return the verified client account id
      return clientAccount;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      // Handle WebAuth parsing/verification errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes('challenge') ||
        errorMessage.includes('signature') ||
        errorMessage.includes('signed')
      ) {
        throw new UnauthorizedException(
          'Invalid or malformed challenge signature',
        );
      }

      throw new BadRequestException('Invalid challenge transaction format');
    }
  }

  private loadAuthConfig(): AuthConfig {
    const serverPrivateKey = this.config.get<string>('SERVER_PRIVATE_KEY');
    if (!serverPrivateKey) {
      throw new InternalServerErrorException(
        'Missing required env var: SERVER_PRIVATE_KEY',
      );
    }

    const webAuthDomain = this.config.get<string>('STELLAR_WEB_AUTH_DOMAIN');
    if (!webAuthDomain) {
      throw new InternalServerErrorException(
        'Missing required env var: STELLAR_WEB_AUTH_DOMAIN',
      );
    }

    const networkPassphrase = this.config.get<string>(
      'STELLAR_NETWORK_PASSPHRASE',
    );
    if (!networkPassphrase) {
      throw new InternalServerErrorException(
        'Missing required env var: STELLAR_NETWORK_PASSPHRASE',
      );
    }

    const serverKeypair = this.parseServerKeypair(serverPrivateKey);

    return { serverKeypair, webAuthDomain, networkPassphrase };
  }

  private parseServerKeypair(secretKey: string): Keypair {
    try {
      return Keypair.fromSecret(secretKey);
    } catch {
      throw new InternalServerErrorException(
        'Invalid SERVER_PRIVATE_KEY: must be a valid Stellar secret key',
      );
    }
  }

  private normalizeVerifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Signature verification failed';
  }

  generateChallenge(address: string): {
    transaction: string;
    networkPassphrase: string;
  } {
    const { serverKeypair, webAuthDomain, networkPassphrase } =
      this.loadAuthConfig();

    // Placeholder: real SEP-10 challenge generation (BE-022/BE-023) will
    // use serverKeypair, webAuthDomain, and networkPassphrase to build the XDR.
    void serverKeypair;
    void webAuthDomain;
    void address;

    return { transaction: '', networkPassphrase };
  }

  verifySignature(signedXdr: string): { token: string } {
    const { networkPassphrase } = this.loadAuthConfig();

    try {
      // Placeholder: real SEP-10 verification (BE-022/BE-024) will validate
      // signedXdr against the challenge and issue a JWT.
      void signedXdr;
      void networkPassphrase;

      return { token: '' };
    } catch (error) {
      const message = this.normalizeVerifyError(error);
      throw new InternalServerErrorException(message);
    }
  }

  validateUser(publicKey: string) {
    return this.prisma.user.findUnique({ where: { email: publicKey } });
  }
}
