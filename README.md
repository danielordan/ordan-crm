# Ordan Cargo Future Clients

Internal web app that extracts potential clients (Consignee + shipment details) from House Bill of Lading (HBL) PDF files. Product and technical specs live in [`spec/`](spec/).

## Structure

```text
backend/   NestJS API (Node.js 24) — runs on http://localhost:4000
frontend/  Next.js app (browser UI + secure proxy to the backend) — runs on http://localhost:3000
spec/      PRD, architecture, design and milestones
```

The browser only talks to the frontend. Users sign in with Google; the frontend then calls the backend server-to-server with a secret API key. The backend stores data in a Supabase (PostgreSQL) database.

## Requirements

- [Node.js 24](https://nodejs.org/) (`node -v` should print `v24...`)

## First-time setup

1. Install dependencies (from the project folder):

   ```bash
   npm install
   ```

2. Fill in the settings files. Both files already exist (copied from `.env.example`); only fill in the empty values below.

   | File            | Variable                   | What to put                                                    |
   | --------------- | -------------------------- | -------------------------------------------------------------- |
   | `backend/.env`  | `BACKEND_API_KEY`          | A long random string (see below)                               |
   | `frontend/.env` | `BACKEND_API_KEY`          | **The same** string as in `backend/.env`                       |
   | `backend/.env`  | `DATABASE_URL`             | Supabase `ordan-dev` project → Connect → Session pooler string |
   | `backend/.env`  | `DATABASE_DEV_PROJECT_REF` | Supabase `ordan-dev` → Project Settings → General → Project ID |
   | `backend/.env`  | `OPENAI_API_KEY`           | OpenAI dashboard → API keys                                    |
   | `frontend/.env` | `AUTH_SECRET`              | A random string (see below)                                    |
   | `frontend/.env` | `AUTH_GOOGLE_ID`           | Google Cloud → Google Auth Platform → Clients → Client ID      |
   | `frontend/.env` | `AUTH_GOOGLE_SECRET`       | Same OAuth client → Client secret                              |

   To generate a random key, run this and copy the output:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   `OPENAI_MODEL` and `OPENAI_EXTRACTION_PROMPT_VERSION` can stay empty; the backend then uses its defaults.

3. Accounts (one-time):
   - **Supabase:** two projects, `ordan-dev` (local development) and `ordan-prod` (production, Milestone 6). The database SSL certificate (Project Settings → Database → SSL Configuration → Download certificate) is stored in `backend/src/database/supabase-ca.ts`; it is public, not a secret.
   - **Google OAuth (development):** a Web application client with origin `http://localhost:3000` and redirect URI `http://localhost:3000/api/auth/callback/google`. The consent screen audience is External and published ("In production") so any Google account can sign in.

4. Create the database tables, then add test clients (Development only):

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   `db:migrate` is safe to run again; it only applies new migrations. `db:seed` refuses to run unless `DATABASE_URL` points to the project in `DATABASE_DEV_PROJECT_REF`.

## Run locally

```bash
npm run dev
```

This starts both apps. Open <http://localhost:3000> and sign in with Google. Stop with `Ctrl+C`.

Useful local addresses:

- <http://localhost:4000/health> — backend health check (no key needed)
- <http://localhost:3000/dev/components> — design system preview (local development only)

## Checks

```bash
npm test              # backend (unit + e2e) and frontend tests; e2e needs the Supabase settings
npm run lint          # ESLint for both apps
npm run format:check  # Prettier check (npm run format to fix)
```

## Production deployment

Production runs on two Vercel projects connected to this GitHub repository. Every push to `main` deploys automatically, and Vercel skips a project whose code did not change. There is no Docker and no GitHub Actions.

Production settings live only in Vercel, with the secret values stored as Secret and limited to the Production environment. They are never stored in this repository or in a local file. Preview deployments get none of them.

### Backend project (Root Directory: `backend`)

| Variable            | Value                                  |
| ------------------- | -------------------------------------- |
| `DATABASE_URL`      | Supabase `ordan-prod` → Session pooler |
| `BACKEND_API_KEY`   | New random key, different from local   |
| `OPENAI_API_KEY`    | OpenAI key for Production              |
| `MAX_UPLOAD_BYTES`  | `4194304`                              |
| `OPENAI_TIMEOUT_MS` | `60000`                                |
| `LOG_LEVEL`         | `info`                                 |

Do not set `DATABASE_DEV_PROJECT_REF` or `API_PORT`. Set the Function region to the one closest to `ordan-prod`.

### Frontend project (Root Directory: `frontend`, same region)

| Variable             | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| `BACKEND_API_URL`    | Production address of the backend project (`https://`) |
| `BACKEND_API_KEY`    | **The same** key as in the backend project             |
| `AUTH_SECRET`        | New random string, different from local                |
| `AUTH_GOOGLE_ID`     | Production OAuth client → Client ID                    |
| `AUTH_GOOGLE_SECRET` | Production OAuth client → Client secret                |

### Google OAuth (Production)

A separate Web application client, with origin `https://<frontend address>` and redirect URI `https://<frontend address>/api/auth/callback/google`. After changing these variables, redeploy the frontend.

### Database migrations on Production

Migrations never run automatically during a build. The order for any change is:

1. Write the migration and test it on Development (`npm run db:migrate`).
2. Before pushing, run it on Production, only after explicit approval:

   ```bash
   npm run db:migrate:prod
   ```

   Paste the `ordan-prod` Session pooler connection string into the hidden prompt, check the project ID shown, and type `yes`. The string is not saved or displayed. The command refuses the Development project, and prints the tables, indexes and RLS state when it finishes.

3. Push to GitHub. Vercel then deploys the version that depends on the change.

The old version keeps running between steps 2 and 3, so a migration must stay compatible with it.

### Keeping it running

- On the Supabase free plan, `ordan-prod` pauses after a week of low activity. Reactivate it with **Resume project** in the dashboard.
- Logs are in Vercel → the project → Logs. On the Hobby plan they are kept for one hour.
- The Vercel Hobby plan is for non-commercial use only. Company use requires Pro.

## Security notes

- `.env` files are never committed. `.env.example` files document every variable without values.
- The backend rejects any `/api/v1/*` request without the correct `X-API-Key` (401).
