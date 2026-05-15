# NOMinEAT

NOMinEAT solves the "where should we eat?" dilemma for groups. Members NOMinate restaurants, genres, or locations, cast weighted 👍👎 votes, and the group's Top NOM is revealed when the session closes.

Built as a mobile-first web app with a clean API boundary — the same backend is designed to power a React Native mobile app in the future.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Prisma 7 (client engine + pg driver adapter) |
| Database | PostgreSQL via Supabase |
| Auth | JWT (jsonwebtoken + bcrypt) |

---

## Prerequisites

- Node.js v18+
- A [Supabase](https://supabase.com) project (free tier works)

---

## Setup

### 1. Clone

```bash
git clone <your-repo-url>
cd NOMinEAT
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# On Windows: copy .env.example .env
```

Open `backend/.env` and fill in your values:

```ini
PORT=3001
NODE_ENV=development

# Supabase — Project Settings > Database > Connection string
# Use "Session mode" (port 6543) for DATABASE_URL
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Use "Direct connection" (port 5432) for DIRECT_URL
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Push the database schema

`prisma db push` requires a direct connection on port 5432, which may be blocked by your network. Use the SQL Editor approach instead:

```bash
cd backend
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > schema.sql
```

Copy the contents of `schema.sql` and paste it into **Supabase → SQL Editor → New query → Run**.

Then generate the Prisma client:

```bash
npx prisma generate
```

### 4. Frontend

```bash
cd ../frontend
npm install
```

---

## Running Locally

**Backend** (from `backend/`):

```bash
npm run dev
```

API available at `http://localhost:3001`. Health check: `GET /api/health`.

**Frontend** (from `frontend/`):

```bash
npm run dev
```

App available at `http://localhost:5173`.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `DATABASE_URL` | Yes | Supabase pooled URL, port 6543, `?pgbouncer=true` |
| `DIRECT_URL` | Yes | Supabase direct URL, port 5432 (schema migrations only) |
| `JWT_SECRET` | Yes | Long random string for signing JWTs |
| `JWT_EXPIRES_IN` | No | Token lifetime (default: `7d`) |
| `FRONTEND_URL` | Yes | CORS origin — `http://localhost:5173` locally, Vercel URL in prod |

---

## API Overview

All routes are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | DB connectivity check |
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Get JWT |
| GET | `/auth/me` | Yes | Current user |
| POST | `/groups` | Yes | Create group |
| GET | `/groups` | Yes | List my groups |
| GET | `/groups/:id` | Yes | Group detail + members + sessions |
| POST | `/groups/join` | Yes | Join via invite code |
| POST | `/voting/groups/:groupId/sessions` | Yes | Start voting session |
| GET | `/voting/sessions/:sessionId` | Yes | Session detail + votes |
| POST | `/voting/sessions/:sessionId/nominate` | Yes | Add a NOM |
| POST | `/voting/sessions/:sessionId/options/:optionId/vote` | Yes | Cast / update / remove vote |
| PATCH | `/voting/sessions/:sessionId/close` | Yes (admin) | Close session, reveal winner |

---

## Notes

- `backend/.env` is git-ignored. Document new variables in `backend/.env.example`.
- `node_modules/` is git-ignored in both `backend/` and `frontend/`. Run `npm install` to restore.
- Prisma 7 requires `@prisma/adapter-pg` — `new PrismaClient()` with no adapter throws at startup. Always use the singleton in `backend/src/lib/prisma.js`.
