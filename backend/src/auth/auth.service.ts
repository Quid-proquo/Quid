import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    private readonly prisma: any,
  ) {}

  async validateUser(email: string): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    
    if (user) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
