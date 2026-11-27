/**
 * Writes openapi.json from the running route table.
 *   npx ts-node scripts/export-openapi.ts
 * Generate a typed client from it (tools fetched on demand, not dependencies):
 *   npx openapi-typescript openapi.json -o ../packages/quid-api-client/schema.d.ts
 */
import { NestFactory } from '@nestjs/core';
import { writeFileSync } from 'fs';
import { AppModule } from '../src/app.module';
import { buildOpenApiDocument } from '../src/common/openapi/setup-openapi';

async function main() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  writeFileSync('openapi.json', JSON.stringify(buildOpenApiDocument(app), null, 2));
  await app.close();
}

void main();
