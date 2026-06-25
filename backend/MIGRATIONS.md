# Database Migration Runbook

How to add and apply Prisma migrations for NOMinEat.

Migrations are applied **manually** to production — the Vercel build only runs
`prisma generate`, **not** `migrate deploy` (see [Why not auto-migrate](#why-not-auto-migrate-on-deploy)).

---

## Key facts

| Thing | Value |
|---|---|
| ORM | Prisma 7 (config in `backend/prisma.config.ts`, not the schema block) |
| Connection vars | `DATABASE_URL` (pooled) and `DIRECT_URL` — read by `prisma.config.ts` |
| Local dev DB | local Postgres (`localhost:5432/nomineat`) — set in `backend/.env` |
| Prod DB | Supabase project `pyncbrjomslblpyvtwaf` |
| Prod migration history | **Baselined** — `_prisma_migrations` holds all existing migrations |
| Vercel build | `prisma generate` only — migrations are run by hand |

> ⚠️ **The one gotcha:** `prisma migrate deploy` **hangs forever** over Supabase's
> **transaction pooler** (port `6543`) because the migrate engine needs a session
> advisory lock. Migrations **must** use a **session-pooler / direct** connection
> (port `5432`). Normal app queries over `6543` are fine — this only affects migrations.

---

## Adding a new migration

### 1. Edit the schema
Change `backend/prisma/schema.prisma`.

### 2. Create + apply it locally
From `backend/`:
```bash
npx prisma migrate dev --name <short_snake_case_name>
```
This writes `prisma/migrations/<timestamp>_<name>/migration.sql` and applies it to your
**local** dev DB.

### 3. Commit the migration
```bash
git add prisma/migrations prisma/schema.prisma
git commit -m "feat(db): <what changed>"
```

### 4. Apply it to production  ← the important part

Get a **session-pooler** connection string (port `5432`):

> Supabase Dashboard → your project → **Connect** (top bar) → **Session pooler** tab →
> copy the URI. It looks like:
> `postgresql://postgres.pyncbrjomslblpyvtwaf:<PASSWORD>@aws-1-us-west-2.pooler.supabase.com:5432/postgres`
> (port **5432**, **not** 6543, and no `pgbouncer=true`).

Then, from `backend/`, run `migrate deploy` pointed at it (inline env overrides
`backend/.env`, so your local DB is untouched):
```bash
DATABASE_URL="<session-pooler-uri>" DIRECT_URL="<session-pooler-uri>" \
  npx prisma migrate deploy
```
Expected output ends with `All migrations have been successfully applied.` (or
`No pending migrations to apply.`).

### 5. Verify
```bash
DATABASE_URL="<session-pooler-uri>" DIRECT_URL="<session-pooler-uri>" \
  npx prisma migrate status
```
Should report `Database schema is up to date!`.

### 6. Deploy the code
Push to `main` as usual — Vercel rebuilds (`prisma generate`) and ships the code that
relies on the new column/table.

> **Ordering matters:** apply the migration to prod (step 4) **before or together with**
> deploying code that depends on it. Deploying code first leaves a window where new code
> hits the old schema — that's exactly the `passwordHash` 500 we hit before.

---

## Why not auto-migrate on deploy?

We tried `"vercel-build": "prisma migrate deploy && prisma generate"`. It **hung every
build** because Vercel connects via the transaction pooler (`6543`), where the migrate
engine's advisory lock never resolves. A hung build also jams the (single) build slot and
blocks other deploys. If you ever want to revisit it, the prerequisite is setting the
Vercel `DIRECT_URL` env var to a **session-pooler** URL (`5432`) and confirming a preview
build completes before enabling it on `main`.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `migrate deploy` hangs at "Datasource ... :6543" | Using the transaction pooler. Use the **session pooler (5432)** string. |
| `supabaseKey is required` / `Connection url is empty` | Env var not set, or you pulled a Sensitive var (`vercel env pull` returns blank for Sensitive vars — copy from the dashboard instead). |
| `migration was modified after applied` | A committed migration's SQL changed after being recorded. Don't edit applied migration files; add a new migration. |
| Build is stuck `QUEUED` | A hung build is holding the slot. Cancel it: `vercel remove <deployment-url> --yes`. |

---

## Appendix: how prod was baselined (2026-06-24)

Production was originally created without Prisma migration history. It was baselined by
creating `_prisma_migrations` and recording the existing migrations as applied (checksums
computed from the committed files via `git show HEAD:<path> | sha256sum`). You only need
to know this if the history ever drifts again — normal migrations (steps above) don't
require re-baselining.
