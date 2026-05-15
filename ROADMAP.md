# NOMinEAT — Development Roadmap

## Current Status
Full-stack MVP is feature-complete and running locally. All 4 pages are built and wired to the live Supabase backend. Ready for deployment.

---

## Phase 1: Backend API (Complete)

- [x] Prisma schema designed and pushed to Supabase
- [x] Prisma 7 singleton with `@prisma/adapter-pg` driver adapter (`backend/src/lib/prisma.js`)
- [x] Express server with `helmet`, `cors`, `express.json()`
- [x] `GET /api/health` endpoint with live DB ping
- [x] Auth routes: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- [x] Group routes: create, join (invite code), list, get by ID
- [x] Voting routes: create session, get session, nominate option, cast vote, close session
- [x] JWT auth middleware
- [x] Global error handler + 404 handler

---

## Phase 2: Backend Hardening (Complete)

- [x] **Rate limiting** — `express-rate-limit` on auth routes (10 req / 15 min per IP)
- [x] **Input validation** — `express-validator` on all POST routes, shared `validate.js` middleware
- [x] **Environment validation** — startup exits with clear message if required env vars are missing
- [x] **Vote un-vote support** — value `0` deletes the vote record (FSM toggle)
- [x] **Weighted scoring** — 👍 = +2 pts, 👎 = −4 pts applied in `getSession` and `closeSession`

---

## Phase 3: Frontend — React (Vite + Tailwind) (Complete)

- [x] `axiosClient.js` — axios instance with `baseURL` and auto-attached `Authorization` header
- [x] `AuthContext.jsx` — stores JWT, exposes `user`, `login()`, `logout()`
- [x] `Button.jsx` — primary / secondary / danger / ghost variants
- [x] `Card.jsx` — reusable card wrapper
- [x] `Navbar.jsx` — top nav with logo and logout
- [x] **Login / Register** (`/login`) — tabbed form, toggles between sign up and sign in
- [x] **Dashboard** (`/`) — lists user's groups, floating "+" to create or join
- [x] **Group View** (`/groups/:groupId`) — members list, active sessions, invite code display
- [x] **Voting Room** (`/voting/sessions/:sessionId`)
  - [x] NOMinees list sorted by user's own vote (upvoted first) during active session
  - [x] 👍👎 buttons with FSM toggle (tap again to un-vote), optimistic UI (instant color flip)
  - [x] Asymmetric weighting: 👍 = +2, 👎 = −4
  - [x] "NOMinate a spot" form with RESTAURANT / GENRE / LOCATION type selector
  - [x] Close Session button (admin only)
  - [x] 🏆 Top NOM winner banner on close, results sorted by final score

---

## Phase 4: Connect Frontend to Backend (Complete)

- [x] `axiosClient.js` points at `http://localhost:3001/api`
- [x] `AuthContext` login/register wired to `POST /api/auth/*`
- [x] Dashboard fetches from `GET /api/groups`
- [x] Group View fetches from `GET /api/groups/:groupId`
- [x] Voting Room fetches from `GET /api/voting/sessions/:sessionId`
- [x] All vote, nominate, close, create, join actions wired end-to-end

---

## Phase 5: Deployment ← Next

- [ ] **Backend → Railway** (preferred) or Render free tier
  - Set env vars: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
  - Start command: `node src/server.js`
  - Root directory: `backend/`
- [ ] **Frontend → Vercel**
  - Add env var: `VITE_API_URL` = deployed backend URL
  - Update `axiosClient.js` baseURL to `import.meta.env.VITE_API_URL`
  - Root directory: `frontend/`
- [ ] Update `FRONTEND_URL` backend env var to the deployed Vercel URL (for CORS)

---

## Phase 6: Polish & Real-time

- [ ] **Live vote updates** — Supabase Realtime subscription so all users see votes change without refreshing
- [ ] **Profile page** (`/profile`) — show username, account info, logout button
- [ ] **Session history** — list past closed sessions on Group View with their winners
- [ ] **Toast notifications** — replace inline error text with toast banners
- [ ] **UX guard** — prevent closing a session with 0 nominees
- [ ] **Creator-only close** — restrict Close button to the session creator, not all group admins

---

## Phase 7: React Native Mobile App

- Same Express API — zero backend changes needed
- `react-navigation` for bottom tab navigation
- `AsyncStorage` for JWT persistence on device
- All voting, nominating, and group flows map 1:1 from the web app

---

## Technical Notes

- **Prisma 7 + Supabase**: Must use `@prisma/adapter-pg` — the new `client` engine type requires a driver adapter. `new PrismaClient()` with no args throws at startup.
- **Port 5432 blocked locally**: If `prisma db push` hangs, generate SQL with `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script` and paste into Supabase SQL Editor.
- **DATABASE_URL**: Uses port `6543` (PgBouncer pooler) with `?pgbouncer=true` — for runtime queries.
- **DIRECT_URL**: Uses port `5432` (direct connection) — only needed for schema migrations.
- **Vote value `0`**: Sending `{ value: 0 }` to the vote endpoint deletes the user's vote (un-vote). The DB only stores `1` or `-1`.
