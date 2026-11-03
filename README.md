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
   | `frontend/.env` | `AUTH_SECRET`              | A random string (see below)                                    |
   | `frontend/.env` | `AUTH_GOOGLE_ID`           | Google Cloud → Google Auth Platform → Clients → Client ID      |
   | `frontend/.env` | `AUTH_GOOGLE_SECRET`       | Same OAuth client → Client secret                              |

   To generate a random key, run this and copy the output:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Other variables in `backend/.env` (OpenAI, AWS) are filled in later milestones.

3. Accounts (one-time):
   - **Supabase:** two projects, `ordan-dev` (local development) and `ordan-prod` (production, Milestone 5). The database SSL certificate (Project Settings → Database → SSL Configuration → Download certificate) is stored in `backend/certs/supabase-ca.crt`; it is public, not a secret.
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

## Security notes

- `.env` files are never committed. `.env.example` files document every variable without values.
- The backend rejects any `/api/v1/*` request without the correct `X-API-Key` (401).
