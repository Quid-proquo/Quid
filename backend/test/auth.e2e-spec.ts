import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ConfigModule } from '@nestjs/config';
import * as dotenv from 'dotenv';

/* eslint-disable @typescript-eslint/no-unsafe-return */

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    // Load environment variables
    dotenv.config({ path: '.env' });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          envFilePath: '.env',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/verify-challenge (POST)', () => {
    it('should return 400 for missing signedChallengeTx', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-challenge')
        .send({})
        .expect(400);
    });

    it('should return 400 for empty signedChallengeTx', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-challenge')
        .send({ signedChallengeTx: '' })
        .expect(400);
    });

    it('should return 401 for malformed challenge', () => {
      return request(app.getHttpServer())
        .post('/auth/verify-challenge')
        .send({ signedChallengeTx: 'INVALID_XDR' })
        .expect(401);
    });

    it('should return 401 for tampered challenge', () => {
      // This would be a real XDR that fails verification
      return request(app.getHttpServer())
        .post('/auth/verify-challenge')
        .send({ signedChallengeTx: 'TAMPERED_XDR' })
        .expect(401);
    });
  });
});
