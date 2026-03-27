import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { PassportStrategy } = require('@nestjs/passport');
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { ExtractJwt, Strategy } = require('passport-jwt');
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  email: string;
  sub: number;
}

@Injectable()
// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const secret = configService.getOrThrow<string>('JWT_SECRET');
    
    super({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    return { userId: payload.sub, email: payload.email };
  }
}
