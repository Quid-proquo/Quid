import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  Keypair,
  Networks,
  Operation,
  StrKey,
  Transaction,
  WebAuth,
} from '@stellar/stellar-sdk';
import { PrismaService } from '../prisma/prisma.service.js';

const CHALLENGE_TIMEOUT = 300;

export interface ChallengeResponse {
  address: string;
  transaction: string;
  homeDomain: string;
  webAuthDomain: string;
  networkPassphrase: string;
  nonce: string;
  issuedAt: number;
  expiresIn: number;
}

@Injectable()
export class AuthService {
  private readonly serverAccountId: string;
  private readonly networkPassphrase: string;
  private readonly horizonUrl: string;
  private readonly prisma: PrismaService;
  private readonly config: ConfigService;
  private readonly jwtService: JwtService;

  constructor(
    private configService: ConfigService,
    prisma: PrismaService,
    jwtService: JwtService,
  ) {
    this.prisma = prisma;
    this.config = configService;
    this.jwtService = jwtService;
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

  private getSep10Config() {
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

    return {
      serverAccountId: this.serverAccountId,
      homeDomain,
      networkPassphrase: this.networkPassphrase,
      webAuthDomain,
    };
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

  generateChallenge(address: string): ChallengeResponse {
    if (!StrKey.isValidEd25519PublicKey(address)) {
      throw new BadRequestException('Invalid Stellar public key');
    }

    const serverSecret = this.config.getOrThrow<string>(
      'STELLAR_SERVER_SECRET',
    );
    const serverKeypair = Keypair.fromSecret(serverSecret);

    const homeDomain = this.config.getOrThrow<string>('HOME_DOMAIN');
    const webAuthDomain = this.config.getOrThrow<string>('WEB_AUTH_DOMAIN');
    const networkPassphrase = this.config.get<string>(
      'STELLAR_NETWORK',
      Networks.TESTNET,
    );

    const issuedAt = Math.floor(Date.now() / 1000);

    const transaction = WebAuth.buildChallengeTx(
      serverKeypair,
      address,
      homeDomain,
      CHALLENGE_TIMEOUT,
      networkPassphrase,
      webAuthDomain,
    );

    const tx = new Transaction(transaction, networkPassphrase);
    const manageDataOp = tx.operations[0] as Operation.ManageData;
    const nonce = manageDataOp.value?.toString('base64') ?? '';

    return {
      address,
      transaction,
      homeDomain,
      webAuthDomain,
      networkPassphrase,
      nonce,
      issuedAt,
      expiresIn: CHALLENGE_TIMEOUT,
    };
  }

  async verifySignedPayload(_signedXdr: string): Promise<string> {
    const { serverAccountId, homeDomain, networkPassphrase, webAuthDomain } =
      this.getSep10Config();

    try {
      const { clientAccountID } = WebAuth.readChallengeTx(
        _signedXdr,
        serverAccountId,
        networkPassphrase,
        homeDomain,
        webAuthDomain,
      );

      WebAuth.verifyChallengeTxSigners(
        _signedXdr,
        serverAccountId,
        networkPassphrase,
        [clientAccountID],
        homeDomain,
        webAuthDomain,
      );

      return this.issueTokenForAddress(clientAccountID);
    } catch (error) {
      throw new UnauthorizedException(this.getSep10ErrorMessage(error));
    }
  }

  verifySignature(signedXdr: string): { token: string } {
    try {
      // Placeholder: real SEP-10 verification (BE-022/BE-024) will validate
      // signedXdr against the challenge and issue a JWT.
      void signedXdr;

      return { token: '' };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : 'Verification failed',
      );
    }
  }

  private getSep10ErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'SEP-10 verification failed';
  }

  private async issueTokenForAddress(address: string): Promise<string> {
    let user = await this.prisma.user.findUnique({
      where: { address },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: { address },
      });
    }

    const payload = { userId: user.id, address };
    return this.jwtService.sign(payload);
  }

  validateUser(publicKey: string) {
    return this.prisma.user.findUnique({ where: { address: publicKey } });
  }
}
