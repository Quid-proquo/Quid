import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import {
  assertProductionSecrets,
  getAllowedOrigins,
} from './config/security.config';

async function bootstrap() {
  // Issue #312: refuse to start a production deployment that still holds an
  // example secret, a missing SEP-10 key, or an unset CORS allowlist.
  assertProductionSecrets();

  const app = await NestFactory.create(AppModule);

  // Issue #348: env-driven CORS – restricts to an explicit allowlist instead
  // of the open-to-all default.  Set CORS_ALLOWED_ORIGINS in production/staging
  // to the exact frontend origin(s), e.g. https://staging.quid.app
  // Issue #312: this now throws instead of falling back to localhost when the
  // variable is missing in production.
  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (curl, Postman, server-to-server)
      if (!origin) {
        callback(null, true);
        return;
      }
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin '${origin}' not allowed by CORS policy`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Public routes are exposed at /api/* on Vercel (see vercel.json rewrites).
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`CORS allowed origins: ${allowedOrigins.join(', ')}`);
}
bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
