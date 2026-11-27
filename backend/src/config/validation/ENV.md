# Environment variables

Validated at boot by `validateConfig(env)` in `validate-config.ts`
(use it as `ConfigModule.forRoot({ validate: validateConfig })`).

| Variable | Type | Default | Required |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` \| `test` \| `production` | `development` | no |
| `PORT` | integer 1-65535 | `3001` | no |
| `DATABASE_URL` | string | - | production |
| `JWT_SECRET` | string (>= 32 chars in production) | - | production |
| `JWT_EXPIRES_IN` | duration string | `15m` | no |
| `CORS_ALLOWED_ORIGINS` | comma-separated origins | - | production |
| `ADMIN_ADDRESSES` | comma-separated Stellar addresses | empty | no |

Example:

```
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/quid
JWT_SECRET=<at least 32 random characters>
JWT_EXPIRES_IN=15m
CORS_ALLOWED_ORIGINS=https://quid.app
ADMIN_ADDRESSES=G...
```
