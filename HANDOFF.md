# Session Handoff — NOMinEat

_Last updated: 2026-06-24_

Snapshot of the auth/deploy debugging-and-hardening session, the current state of
the system, the non-obvious gotchas discovered, and what's left. Start here if you're
picking this project back up.

---

## TL;DR

- **Production is healthy** on `https://nomineat.vercel.app` with all fixes live.
- **Google sign-in works** end-to-end (the long-standing prod white-screen is fixed).
- **RLS is enabled** on all 7 tables.
- **Auto-migrate-on-deploy is intentionally OFF** — migrations are applied manually
  (see `backend/MIGRATIONS.md`).
- `main` is clean and fully pushed.

---

## What was fixed this session

| Commit | What |
|---|---|
| `c8f15f5` | White screen on login — unguarded `JSON.parse(localStorage 'nom_user')` in `AuthContext` threw `"undefined" is not valid JSON`, blanking the whole app. Added a safe parse + only persist real user objects. |
| `68157a6` | Applied the same safe-persistence guard to the Google (`loginWithGoogle`) path. |
| `ea4d5eb` | Re-hardened Google sign-in after a **mislabeled** "revert" (see gotchas). Restored `supabase.js` env guard + placeholder fallback and `AuthCallback`'s listener/timeout/error UI. |
| `1a5aefd` | Made `User.passwordHash` nullable (Google users have no password). Migration was missing entirely. |
| `7b3e310` | **The real prod fix.** Backend crashed with `supabaseKey is required` (missing env), returning a `{code,message}` object that the frontend rendered → React error #31 → white screen. Hardened backend Supabase init (no import-time crash, `isSupabaseConfigured`, 503), and made the frontend coerce all error responses to strings. |
| `1f6f546` | Top-level `ErrorBoundary` — a render error now shows a friendly screen instead of blanking the app. |
| `cdfe524` | `backend/MIGRATIONS.md` runbook. |
| `d327304` → `43f9f92` | Tried `migrate deploy` in the Vercel build; it hangs over the Supabase pooler. **Reverted.** |

The root cause of the prod Google failure: the backend reads `SUPABASE_SERVICE_ROLE_KEY`,
but the Supabase→Vercel integration only created `SUPABASE_SECRET_KEY`. The expected name
was **never set**, so `createClient` threw on every `/auth/google` call. Fixed by adding
`SUPABASE_SERVICE_ROLE_KEY` to Vercel production + redeploy.

---

## Current production state

- **Live URL:** `https://nomineat.vercel.app` (also `nomineat-dareen-nasreldins-projects.vercel.app`).
- **Vercel project:** `nomineat` (`prj_B7Tg0supSNp8dF7fLrIL7UhG1ifn`), team `team_S4ACgtTlPhZ1sy33U8Fwinkz`.
- **Deployment Protection is ON** — the site requires a Vercel login to view. To inspect
  it programmatically, generate a bypass link (Vercel MCP `get_access_to_vercel_url`) or
  turn protection off if it's meant to be public.
- **Supabase project:** `pyncbrjomslblpyvtwaf` (`dareen-nasreldin's Project`), region us-west-2.
- **RLS:** enabled on `User, Group, GroupMember, VotingSession, Option, Vote, SessionHistory`
  with **no policies** (correct — the app only touches the DB via the Prisma backend, which
  bypasses RLS; clients use Supabase only for Google auth).
- **Prod DB migration history:** baselined — `_prisma_migrations` has all 4 migrations recorded.

---

## ⚠️ Gotchas / tribal knowledge (read before touching auth or deploys)

1. **Supabase env var name mismatch.** Backend code expects `SUPABASE_URL` +
   `SUPABASE_SERVICE_ROLE_KEY`. The Supabase integration creates `SUPABASE_SECRET_KEY`
   (and `POSTGRES_*`, and `NEXT_PUBLIC_*`) — different names. The vars the code needs were
   added manually in Vercel.
2. **Vite env prefix.** Frontend reads `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
   The integration's default public prefix is `NEXT_PUBLIC_` (wrong for Vite). The `VITE_`
   ones are set; don't rely on `NEXT_PUBLIC_*`.
3. **Sensitive vars can't be pulled.** `vercel env pull` returns **blank** for vars marked
   Sensitive (`DATABASE_URL`, `DIRECT_URL`, `POSTGRES_PASSWORD`). Copy real values from the
   Supabase/Vercel dashboards, not from a pull.
4. **`prisma migrate deploy` hangs over the transaction pooler (`6543`).** Migrations need a
   **session pooler / direct** connection (`5432`). This is why auto-migrate-on-deploy is off.
   See `backend/MIGRATIONS.md`.
5. **Never render an error object in React.** A non-string error → React error #31 →
   white screen. `AuthCallback`/`Login` now coerce errors to strings; keep that pattern.
6. **The `revert(auth): remove Google sign-in` commit (`ebfcfd8`) is mislabeled** — it did
   NOT remove Google sign-in, only stripped its safeguards. Google sign-in is a live feature.
7. **Hung builds jam the queue** (single build slot). Clear with
   `vercel remove <deployment-url> --yes`.

---

## Local dev

- `frontend/.env` and `backend/.env` are set up (gitignored) for local dev + Google testing.
- Local DB: `localhost:5432/nomineat` (separate from prod; prod data is NOT here).
- Run: backend `node src/server.js` (port 3001), frontend `npx vite` (port 5173).
- Vercel CLI is installed and authenticated as `dareen-nasreldin`.

---

## Open items / possible next steps

- **Auto-migrate-on-deploy (parked).** To enable: set Vercel `DIRECT_URL` to a **session
  pooler** URL (`5432`), verify a **preview** build completes, then add
  `prisma migrate deploy &&` back to `vercel-build`. The user set a new `DIRECT_URL` but it
  was **never verified** (the test got blocked by a queue jam).
- **Tests.** No test suite exists. A few auth tests would have caught most of today's bugs.
- **Deployment Protection.** Decide if the prod site should be public (currently login-gated).
- **Product roadmap.** See `ROADMAP.md` — e.g. websockets instead of 3s polling, the React
  Native app the API was designed for.
- **Supabase advisor:** "leaked password protection disabled" warning — harmless here (the
  app uses its own bcrypt passwords, not Supabase Auth email/password).

---

## Key references

- `backend/MIGRATIONS.md` — how to apply migrations to prod.
- `CLAUDE.md` — project conventions and shipped features.
- `ROADMAP.md` — product roadmap.
