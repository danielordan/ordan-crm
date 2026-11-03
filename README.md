# Ordan Cargo Future Clients

Internal web app that extracts potential clients (Consignee + shipment details) from House Bill of Lading (HBL) PDF files. Product and technical specs live in [`spec/`](spec/).

## Structure

```text
backend/   NestJS API (Node.js 24) — runs on http://localhost:4000
frontend/  Next.js app (browser UI + secure proxy to the backend) — runs on http://localhost:3000
spec/      PRD, architecture, design and milestones
```

The browser only talks to the frontend. The frontend asks for the site password, then calls the backend server-to-server with a secret API key.

## Requirements

- [Node.js 24](https://nodejs.org/) (`node -v` should print `v24...`)

## First-time setup

1. Install dependencies (from the project folder):

   ```bash
   npm install
   ```

2. Fill in the settings files. Both files already exist (copied from `.env.example`); only fill in the empty values below.

   | File            | Variable          | What to put                                 |
   | --------------- | ----------------- | ------------------------------------------- |
   | `frontend/.env` | `SITE_PASSWORD`   | The password you will type to open the site |
   | `backend/.env`  | `BACKEND_API_KEY` | A long random string (see below)            |
   | `frontend/.env` | `BACKEND_API_KEY` | **The same** string as in `backend/.env`    |

   To generate a random key, run this and copy the output:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Other variables in `backend/.env` (MongoDB, OpenAI, AWS) are filled in later milestones.

## Run locally

```bash
npm run dev
```

This starts both apps. Open <http://localhost:3000>, enter any username and the `SITE_PASSWORD`. Stop with `Ctrl+C`.

Useful local addresses:

- <http://localhost:4000/health> — backend health check (no key needed)
- <http://localhost:3000/dev/components> — design system preview (local development only)

## Checks

```bash
npm test              # backend (unit + e2e) and frontend tests
npm run lint          # ESLint for both apps
npm run format:check  # Prettier check (npm run format to fix)
```

## Security notes

- `.env` files are never committed. `.env.example` files document every variable without values.
- The backend rejects any `/api/v1/*` request without the correct `X-API-Key` (401).
