import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Keypair } from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service';

interface AuthConfig {
  serverKeypair: Keypair;
  webAuthDomain: string;
  networkPassphrase: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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

  generateChallenge(
    address: string,
  ): { transaction: string; networkPassphrase: string } {
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
