# mock-project

Backend API built with [NestJS](https://nestjs.com).

## Requirements

- Node.js 22 (see `.nvmrc`, run `nvm use`)
- npm
- PostgreSQL + Redis (`docker compose up -d`)

## Getting started

```bash
nvm use
npm install
cp .env.example .env  # set JWT_SECRET (>= 32 chars)
docker compose up -d  # uses DB_* and REDIS_PASSWORD from .env
npm run migration:run
npm run start:dev
```

- API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/api/docs

## Scripts

| Script | Description |
| --- | --- |
| `npm run start:dev` | Start in watch mode |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run compiled build |
| `npm run lint` | SunLint on `src/` |
| `npm run lint:changed` | SunLint on changed files |
| `npm run lint:security` | SunLint security rules |
| `npm run format` | Format with prettier |
| `npm test` | Unit tests (vitest) |
| `npm run test:e2e` | End-to-end tests (uses `*_test` database from `.env.test`) |
| `npm run migration:generate -- src/database/migrations/<Name>` | Generate migration |
| `npm run migration:run` | Run migrations |
| `npm run migration:revert` | Revert last migration |

## API

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | - | Create account (no token, call login next) |
| `POST` | `/api/auth/login` | - | Sign in, returns access token |
| `POST` | `/api/auth/logout` | Bearer | Sign out from all devices |
| `GET` | `/api/health` | - | Health check |

## Project structure

```
src/
├── main.ts           # Bootstrap
├── setup-app.ts      # helmet, CORS, /api prefix, validation (422), error filter, swagger
├── app.module.ts     # Root module
├── config/           # Env config + Joi validation (app, database, auth, redis)
├── common/           # Shared constants, interfaces, utils, errors, decorators, DTOs
├── database/         # TypeORM module, data source, migrations
├── redis/            # Global Redis client
└── modules/          # Feature modules
test/                 # e2e tests (support/ creates and migrates the test database)
```

## Production deployment

Set `NODE_ENV=production`. The app refuses to start unless:

| Variable | Rule |
| --- | --- |
| `CORS_ORIGIN` | Required, comma-separated list of allowed origins, `*` is rejected |
| `DB_PASSWORD` | Required |
| `REDIS_PASSWORD` | Required |
| `JWT_SECRET` | Required, at least 32 characters (`openssl rand -hex 32`) |

Other production settings:

- `SWAGGER_ENABLED` defaults to `false`; enable only on internal environments.
- `DB_SSL=true` / `REDIS_TLS=true` for managed services (RDS, ElastiCache, ...).
- `TRUST_PROXY_HOPS` must equal the number of proxies in front of the app (e.g. `1` behind a single load balancer). Too low: every client shares the proxy IP for rate limiting. Too high: clients can spoof `X-Forwarded-For` to bypass it.
- Run `npm run migration:run` before starting the new version.
- Rate limiting is stored in memory per instance; when running more than one instance, move it to Redis or enforce it at the load balancer / WAF.
