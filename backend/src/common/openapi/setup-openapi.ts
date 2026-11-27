import { INestApplication } from '@nestjs/common';

type Layer = { route?: { path: string; methods: Record<string, boolean> } };

/** Builds an OpenAPI 3.1 document from the routes registered on the app. */
export function buildOpenApiDocument(app: INestApplication) {
  const router = (app.getHttpAdapter().getInstance() as any)._router;
  const paths: Record<string, Record<string, unknown>> = {};
  for (const layer of (router?.stack ?? []) as Layer[]) {
    if (!layer.route) continue;
    const key = layer.route.path.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
    paths[key] ??= {};
    for (const method of Object.keys(layer.route.methods)) {
      paths[key][method] = { responses: { '200': { description: 'OK' } } };
    }
  }
  return {
    openapi: '3.1.0',
    info: { title: 'Quid API', version: '1.0.0' },
    paths,
  };
}

/**
 * Serves the spec at GET /api/docs.json unless NODE_ENV=production and
 * DOCS_PUBLIC is not "true". Call after `app.init()`.
 */
export function setupOpenApi(app: INestApplication): void {
  if (process.env.NODE_ENV === 'production' && process.env.DOCS_PUBLIC !== 'true') {
    return;
  }
  const instance = app.getHttpAdapter().getInstance();
  instance.get('/api/docs.json', (_req: unknown, res: { json: (b: unknown) => void }) =>
    res.json(buildOpenApiDocument(app)),
  );
}
