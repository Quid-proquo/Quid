import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { getJwtExpiresIn } from '../config/security.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';

/** The library's own `expiresIn` type, so the env string casts cleanly. */
type JwtLifetime = NonNullable<JwtModuleOptions['signOptions']>['expiresIn'];

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        // Issue #312: lifetime is env-driven so staging can use a shorter
        // window than the 7d default without a code change.
        signOptions: {
          expiresIn: getJwtExpiresIn({
            JWT_EXPIRES_IN: config.get<string>('JWT_EXPIRES_IN'),
          }) as JwtLifetime,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
