Context: Food Voting App Development

You are an expert full-stack developer. I am building a responsive web application called "NOMinEat" that solves the "where should we eat?" dilemma for groups of friends, family, or coworkers.

The application must be built as a mobile-first responsive website now, with the strict architectural intention of building a React Native mobile app in the future that will consume the exact same backend API.

---

## 1. Branding & UI Terminology (CRITICAL)

When generating frontend code (React components, buttons, headers), use this specific terminology to fit the playful brand:

- App Name: **NOMinEat**
- Adding a Restaurant/Option: **"NOMinate a spot"** or **"NOMinate"**
- The Options/Restaurants: **"The NOMinees"**
- Voting: **"Cast your vote"**
- The Winner: **"Top NOM"** or **"Winner!"**
- Session host: **"Host"** with a 👑 badge
- Ending a session: **"End Session"** (not "Close")

Tone: Fun, playful, modern, and energetic.

---

## 2. Technology Stack

- **Frontend:** React.js (Vite) with Tailwind CSS. Mobile-first responsive UI, touch-friendly targets.
- **Backend:** Node.js with Express.js. Pure RESTful API returning JSON.
- **Database:** PostgreSQL via Supabase.
- **ORM:** Prisma 7 with `@prisma/adapter-pg` driver adapter.
- **Auth:** JWT (jsonwebtoken + bcrypt). JWT payload: `{ userId, username }`.
- **Deployment:** Vercel `experimentalServices` — frontend at `/`, backend at `/_/backend`.

---

## 3. Core Feature Requirements (Shipped)

**Authentication:** Users sign up and log in. Login accepts email OR username via a single `identifier` field — controller checks for `@` to decide which field to query. Errors are specific ("No account found with that email/username" / "Incorrect password").

**Group Management:** Users create groups with a unique invite code. Others join via the code. Any member can leave via `DELETE /groups/:id/leave` (blocked if they are the last admin).

**Voting Sessions:** Any group member starts a session. The creator is saved as the **host** (`hostId`).

**NOMinees:** Members NOMinate options (RESTAURANT, GENRE, or LOCATION).

**Voting:** Members cast 👍 (+2 pts) or 👎 (−4 pts). Value `0` un-votes (FSM toggle). Any member can vote.

**Ending Sessions:** Only the session **host** can end a session. Backend checks `session.hostId === req.user.userId`.

**Results:** Ending reveals the 🏆 Top NOM winner banner + all NOMinees sorted by score with `+X` / `-X` displayed. All clients auto-update within 3 seconds via polling.

**Archive Sessions:** Group admins or the session host can archive a closed session via `DELETE /voting/sessions/:sessionId`. Archives write a `SessionHistory` summary record (winner name, score, full results JSON) then hard-delete the `Vote`, `Option`, and `VotingSession` rows to reclaim space.

---

## 4. Database Schema (Current — Prisma / PostgreSQL)

```prisma
model User {
  id             String          @id @default(uuid())
  username       String          @unique
  email          String          @unique
  passwordHash   String
  createdAt      DateTime        @default(now())
  memberships    GroupMember[]
  votes          Vote[]
  hostedSessions VotingSession[] @relation("SessionHost")
}

model Group {
  id         String           @id @default(uuid())
  name       String
  inviteCode String           @unique
  createdAt  DateTime         @default(now())
  members    GroupMember[]
  sessions   VotingSession[]
  histories  SessionHistory[]
}

model GroupMember {
  id       String   @id @default(uuid())
  userId   String
  groupId  String
  role     String   // "ADMIN" or "MEMBER"
  joinedAt DateTime @default(now())
  user     User     @relation(fields: [userId], references: [id])
  group    Group    @relation(fields: [groupId], references: [id])
  @@unique([userId, groupId])
}

model VotingSession {
  id        String    @id @default(uuid())
  groupId   String
  hostId    String?
  title     String
  status    String    // "ACTIVE" or "CLOSED"
  createdAt DateTime  @default(now())
  group     Group     @relation(fields: [groupId], references: [id])
  host      User?     @relation("SessionHost", fields: [hostId], references: [id])
  options   Option[]
  votes     Vote[]
}

model Option {
  id         String        @id @default(uuid())
  sessionId  String
  name       String
  type       String        // "RESTAURANT", "GENRE", or "LOCATION"
  proposedBy String        // userId
  session    VotingSession @relation(fields: [sessionId], references: [id])
  votes      Vote[]
}

model Vote {
  id        String        @id @default(uuid())
  sessionId String
  optionId  String
  userId    String
  value     Int           // 1 for upvote, -1 for downvote
  user      User          @relation(fields: [userId], references: [id])
  session   VotingSession @relation(fields: [sessionId], references: [id])
  option    Option        @relation(fields: [optionId], references: [id])
  @@unique([userId, sessionId, optionId])
}

model SessionHistory {
  id          String   @id @default(uuid())
  groupId     String
  originalId  String   // the VotingSession id that was archived
  title       String
  winnerName  String?
  winnerScore Int      @default(0)
  results     Json     // [{name, type, score}] sorted by score desc
  archivedAt  DateTime @default(now())
  group       Group    @relation(fields: [groupId], references: [id])
}
```

---

## 5. File Structure

```
/backend
  /prisma
    schema.prisma
    /migrations
  /src
    /controllers    (auth.js, groups.js, voting.js)
    /routes         (authRoutes.js, groupRoutes.js, votingRoutes.js)
    /middleware     (authMiddleware.js, validate.js)
    /lib            (prisma.js — singleton)
    server.js
  .env
  package.json

/frontend
  /src
    /components     (Button.jsx, Card.jsx, Navbar.jsx, ConfirmDialog.jsx)
    /pages          (Login.jsx, Dashboard.jsx, GroupView.jsx, VotingRoom.jsx)
    /context        (AuthContext.jsx)
    /api            (axiosClient.js)
    App.jsx
    main.jsx
  index.html
  tailwind.config.js
  package.json
```

---

## 6. Execution Instructions

- Provide fully complete files without placeholders or "left as an exercise" comments.
- Always implement robust error handling in API routes.
- Do not waste tokens on environment setup explanations.

---

## 7. Established Patterns (always follow these)

**Prisma:** Import the singleton from `backend/src/lib/prisma.js`. Never call `new PrismaClient()` directly — Prisma 7 requires the `@prisma/adapter-pg` driver adapter.

**Validation:** Define `express-validator` rule arrays in the route file, then pass them into the shared `backend/src/middleware/validate.js`. Never duplicate validation logic in controllers.

**Auth middleware:** Attach `authMiddleware` at the router level (`router.use(authMiddleware)`) for any protected route group. JWT payload key is `userId` — use `req.user.userId` in controllers.

**Optimistic UI:** Update local React state immediately before the API call, reconcile with a re-fetch after, revert on error.

**API calls:** All frontend API calls go through `frontend/src/api/axiosClient.js`. Never import axios directly in pages or components.

**401 interceptor:** The Axios interceptor skips redirect for `/auth/` endpoints — failed logins must show an error message, not bounce the user back to `/login`.

**API base URL:** `axiosClient.js` resolves to `/_/backend/api` in Vite production builds and `http://localhost:3001/api` in dev. Never hardcode a hostname.

**Polling for real-time:** While a session is ACTIVE, poll `GET /voting/sessions/:sessionId` every 3 seconds so all clients detect session close automatically. Clear the interval when status becomes `CLOSED` or the component unmounts.

**Host check:** `closeSession` verifies `session.hostId === req.user.userId`. Sessions with `hostId = null` (created before the feature) fall back to admin check for backward compat.

**Login identifier:** The login route accepts `identifier` (not `email`). The controller checks `identifier.includes('@')` to decide whether to query by `email` or `username`. The `loginRules` in `authRoutes.js` validates `identifier` as a non-empty string (no email format check).

**Leave group:** `DELETE /groups/:groupId/leave` removes the caller's `GroupMember` row. Blocked with 400 if the user is the sole admin — they must promote another member first.

**Archive session:** `DELETE /voting/sessions/:sessionId` — host or group admin only, session must be CLOSED. Runs a `$transaction`: creates `SessionHistory` → deletes `Vote` rows → deletes `Option` rows → deletes `VotingSession`. The `SessionHistory` record stores winner name, score, and a full `results` JSON array for display in Group View without the raw rows.

**ConfirmDialog:** Reusable `frontend/src/components/ConfirmDialog.jsx` — Tailwind modal with overlay, title, description, Cancel + Confirm buttons. Accepts `danger` prop (red confirm button) and `loading` prop. Used for Leave Group and Archive Session confirmations.

---

## 8. Git Commit Convention (Conventional Commits)

All commits must follow: `type(scope): short summary`

| Type | Use for |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `chore` | Deps, config, tooling |
| `refactor` | Restructure, no behavior change |
| `style` | Formatting only |
| `docs` | Documentation |
| `test` | Tests |
| `perf` | Performance |
| `ci` | CI/CD |

Rules: imperative mood, 72-char subject limit, no period, no emoji in subject.

Examples:
```
feat(voting): add host ownership and end-session sync
fix(auth): prevent 401 redirect loop on failed login
chore(deps): upgrade prisma to v7.8
docs: update roadmap and readme for Phase 6 completion
```
