# NOMinEAT — Development Roadmap

## Current Status
Backend is live and connected to Supabase PostgreSQL. All 6 tables exist in the cloud database. The Express API is running with Prisma 7 + pg driver adapter.

---

## Phase 1: Backend API (Complete)

- [x] Prisma schema designed and pushed to Supabase
- [x] Prisma 7 singleton with `@prisma/adapter-pg` driver adapter
- [x] Express server with `helmet`, `cors`, `express.json()`
- [x] `GET /api/health` endpoint with live DB ping
- [x] Auth routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [x] Group routes: create, join, list, get by ID
- [x] Voting routes: create session, get session, nominate option, cast vote, close session
- [x] JWT auth middleware
- [x] Global error handler + 404 handler

---

## Phase 2: Backend Hardening (Complete)

- [ ] **Test all API endpoints** with a tool like Bruno or Postman
  - Register a user → login → create group → join group → create session → nominate → vote → close
  - Verify the `winner` object returns correctly on close
- [x] **Rate limiting** — `express-rate-limit` on auth routes (10 req / 15 min per IP)
- [x] **Input validation** — `express-validator` on all POST routes at the route layer, shared `validate.js` middleware returns `{ errors: [...] }` on bad input
- [x] **Environment validation** — startup check exits with clear message if `DATABASE_URL`, `JWT_SECRET`, or `FRONTEND_URL` are missing

---

## Phase 3: Frontend — React (Vite + Tailwind) ← Next Session

Build mobile-first, bottom-nav UI. All API calls go through `axiosClient.js`.

### Pages to build (in order):
1. **Login / Register** (`/login`) — forms with toggle between sign up and sign in
2. **Dashboard** (`/`) — lists the user's groups, floating "+" button to create or join a group
3. **Group View** (`/groups/:groupId`) — shows members, active sessions, invite code display
4. **Voting Room** (`/sessions/:sessionId`) — NOMinees list with upvote/downvote, "NOMinate a spot" input, "Close Session" button (admin only), winner banner

### Components to build:
- `Button.jsx` — primary / secondary / danger variants
- `Card.jsx` — used for group cards and option cards
- `Navbar.jsx` — bottom tab bar (Dashboard, Profile)
- `AuthContext.jsx` — stores JWT token, exposes `user`, `login()`, `logout()`
- `axiosClient.js` — axios instance with `baseURL` and auto-attaches `Authorization` header

---

## Phase 4: Connect Frontend to Backend

- [ ] Point `axiosClient.js` at the Express API
- [ ] Wire `AuthContext` login/register to `POST /api/auth/*`
- [ ] Dashboard fetches from `GET /api/groups`
- [ ] Group View fetches from `GET /api/groups/:groupId`
- [ ] Voting Room fetches from `GET /api/voting/sessions/:sessionId`

---

## Phase 5: Deployment

- [ ] **Backend** — Deploy Express API to Railway or Render (free tier). Set env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`
- [ ] **Frontend** — Deploy Vite app to Vercel. Set `VITE_API_URL` to the deployed backend URL
- [ ] Update `CORS` origin in `server.js` to the deployed frontend URL

---

## Technical Notes

- **Prisma 7 + Supabase**: Must use `@prisma/adapter-pg` — the new `client` engine type requires a driver adapter. `new PrismaClient()` with no args is invalid in Prisma 7.
- **Port 5432 blocked locally**: If `prisma db push` hangs, generate SQL with `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` and paste into Supabase SQL Editor.
- **DATABASE_URL**: Uses port `6543` (PgBouncer pooler) with `?pgbouncer=true`
- **DIRECT_URL**: Uses port `5432` (direct connection) — needed for migrations only
