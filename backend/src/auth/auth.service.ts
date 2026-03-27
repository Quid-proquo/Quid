import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebAuth } from '@stellar/stellar-sdk';

@Injectable()
export class AuthService {
  private readonly serverAccountId: string;
  private readonly networkPassphrase: string;
  private readonly horizonUrl: string;

  constructor(private configService: ConfigService) {
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

  async verifyChallengeSignature(signedChallengeTx: string): Promise<string> {
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
    } catch (error) {
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
}
