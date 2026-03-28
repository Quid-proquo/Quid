import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  generateChallenge(
    address: string,
  ): { transaction: string; networkPassphrase: string } {
    // Full SEP-10 challenge generation will be wired in BE-022/BE-023.
    void address;
    return { transaction: '', networkPassphrase: '' };
  }

  verifySignature(signedXdr: string): { token: string } {
    // Full SEP-10 verification and JWT issuance will be wired in BE-024.
    void signedXdr;
    return { token: '' };
  }

  validateUser(publicKey: string) {
    return this.prisma.user.findUnique({ where: { email: publicKey } });
  }
}
