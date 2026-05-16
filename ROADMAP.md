# NOMinEAT — Development Roadmap

## Current Status
Full-stack MVP is deployed and live at [nomineat.vercel.app](https://nomineat.vercel.app). Phases 1–7 are complete: session host ownership, real-time sync, scored leaderboard, leave group, session archiving with `SessionHistory`, and login by email or username are all shipped.

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
  - [x] 🏆 Top NOM winner banner on close, results sorted by final score with per-option scores

---

## Phase 4: Connect Frontend to Backend (Complete)

- [x] `axiosClient.js` points at `http://localhost:3001/api` locally, `/_/backend/api` in production
- [x] `AuthContext` login/register wired to `POST /api/auth/*`
- [x] Dashboard fetches from `GET /api/groups`
- [x] Group View fetches from `GET /api/groups/:groupId`
- [x] Voting Room fetches from `GET /api/voting/sessions/:sessionId`
- [x] All vote, nominate, close, create, join actions wired end-to-end

---

## Phase 5: Deployment (Complete)

- [x] Deployed to Vercel via `experimentalServices` (frontend + backend on same domain)
  - Frontend served at `/`, backend served at `/_/backend`
  - `VITE_API_URL` auto-resolves to `/_/backend/api` in production builds — no env var needed
- [x] All required env vars configured in Vercel (DATABASE_URL, JWT_SECRET, FRONTEND_URL, etc.)
- [x] Production URL: [nomineat.vercel.app](https://nomineat.vercel.app)

---

## Phase 6: Session Host & Real-Time Sync (Complete)

- [x] **Host ownership** — `hostId` added to `VotingSession`; session creator is saved as host
- [x] **Host badge** — 👑 username shown in the voting room header for all participants
- [x] **End Session restricted to host** — "End Session" button only visible to the host; backend verifies `hostId === req.user.userId`
- [x] **Real-time end-session sync** — 3-second polling while session is ACTIVE; all clients auto-transition to results when host ends the session
- [x] **Scored leaderboard** — closed view shows `+X` / `-X` scores and `#rank` for every NOM
- [x] **"— Final Results —"** section header on session close
- [x] **Descriptive login errors** — "No account found with that email" / "Incorrect password" instead of generic message
- [x] **Fix login redirect loop** — 401 interceptor now skips `/auth/*` endpoints so failed logins display the error

---

## Phase 7: Group Management & Data Housekeeping (Complete)

- [x] **Login with email or username** — single `identifier` field; backend detects `@` and queries by email or username with field-specific error messages
- [x] **Leave Group** — `DELETE /groups/:id/leave` removes the member; blocked with a clear error if they are the sole admin. Confirmation dialog in Group View
- [x] **Archive closed sessions** — `DELETE /voting/sessions/:id` (host or admin only); creates a `SessionHistory` summary record then hard-deletes the `VotingSession`, `Option`, and `Vote` rows to reclaim space
- [x] **SessionHistory model** — lightweight archive table (`groupId`, `originalId`, `title`, `winnerName`, `winnerScore`, `results` JSON, `archivedAt`); surfaced in Group View as "Archived Sessions"
- [x] **ConfirmDialog component** — reusable Tailwind modal with `danger` and `loading` props; used for both Leave Group and Archive Session flows

---

## Phase 8: Polish & Real-time (Next)

- [ ] **Full Supabase Realtime** — replace polling with a Supabase channel subscription so live vote counts update instantly for all users without page refreshes
- [ ] **Toast notifications** — replace inline error text with dismissible toast banners
- [ ] **Profile page** (`/profile`) — show username, email, account info, logout button
- [ ] **Guard: empty session** — prevent ending a session with 0 nominees
- [ ] **Drag-to-reorder NOMinees** — let users manually reorder their ballot before voting ends

---

## Phase 9: React Native Mobile App

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
- **hostId nullable**: Existing sessions created before the host feature have `hostId = null`; the close route falls back to admin check for those.
