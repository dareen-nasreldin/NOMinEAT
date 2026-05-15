Context: Food Voting App Development

You are an expert full-stack developer. I am building a responsive web application called "NOMinEat" that solves the "where should we eat?" dilemma for groups of friends, family, or coworkers.

The application must be built as a mobile-first responsive website now, with the strict architectural intention of building a React Native mobile app in the future that will consume the exact same backend API.

1. Branding & UI Terminology (CRITICAL)

When generating frontend code (React components, buttons, headers), use this specific terminology to fit the playful brand:

App Name: NOMinEat

Adding a Restaurant/Option: "NOMinate a spot" or "NOMinate"

The Options/Restaurants: "The NOMinees"

Voting: "Cast your vote"

The Winner: "Top NOM" or "Winner!"

Tone: Fun, playful, modern, and energetic.

2. Technology Stack

Frontend: React.js (Vite) with Tailwind CSS. Must be highly responsive and mimic mobile app UI on smaller screens (bottom navigation, touch-friendly targets).

Backend: Node.js with Express.js. Must be a pure RESTful API returning JSON.

Database: PostgreSQL.

ORM: Prisma (for type safety and easy schema management).

3. Core Feature Requirements (Phase 1: MVP)

Authentication: Users can sign up and log in securely.

Group Management: Users can create groups and generate a unique invite code. Other users can join the group using this code.

Voting Sessions: Any group member can initiate a voting session (e.g., "Friday Lunch").

Proposals (NOMinees): Members can NOMinate options to an active session. Options can be specific restaurants, general genres (e.g., "Mexican"), or locations.

Voting: Members cast a 👍 or 👎 on each NOM. Weighted scoring: 👍 = +2 points, 👎 = −4 points. Tapping the active button again sends value 0 to un-vote (FSM toggle). Any member can vote; only group admins can close a session.

Results: Closing a session reveals the winner (highest weighted score) in a 🏆 Top NOM banner, with all options sorted by final score.

4. Database Schema (Prisma / PostgreSQL)

Here is the strict relational schema you must follow.

model User {
  id            String         @id @default(uuid())
  username      String         @unique
  email         String         @unique
  passwordHash  String
  createdAt     DateTime       @default(now())
  memberships   GroupMember[]
  votes         Vote[]
}

model Group {
  id          String         @id @default(uuid())
  name        String
  inviteCode  String         @unique
  createdAt   DateTime       @default(now())
  members     GroupMember[]
  sessions    VotingSession[]
}

model GroupMember {
  id        String   @id @default(uuid())
  userId    String
  groupId   String
  role      String   // "ADMIN" or "MEMBER"
  joinedAt  DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  group     Group    @relation(fields: [groupId], references: [id])
  @@unique([userId, groupId])
}

model VotingSession {
  id        String    @id @default(uuid())
  groupId   String
  title     String
  status    String    // "ACTIVE" or "CLOSED"
  createdAt DateTime  @default(now())
  group     Group     @relation(fields: [groupId], references: [id])
  options   Option[]
  votes     Vote[]
}

model Option {
  id          String        @id @default(uuid())
  sessionId   String
  name        String
  type        String        // "RESTAURANT", "GENRE", or "LOCATION"
  proposedBy  String        // userId
  session     VotingSession @relation(fields: [sessionId], references: [id])
  votes       Vote[]
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
  @@unique([userId, sessionId, optionId]) // Prevent multiple votes on same option
}


5. File Structure (as built)

/backend
  /prisma
    schema.prisma
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
    /components     (Button.jsx, Card.jsx, Navbar.jsx)
    /pages          (Login.jsx, Dashboard.jsx, GroupView.jsx, VotingRoom.jsx)
    /context        (AuthContext.jsx)
    /api            (axiosClient.js)
    App.jsx
    main.jsx
  index.html
  tailwind.config.js
  package.json


6. Execution Instructions for Claude

Do not waste tokens on Git initialization or environment setup explanations. Assume the environment is ready.

Provide fully complete files without placeholders or "left as an exercise" comments.

Always implement robust error handling in the API routes.


7. Established Patterns (always follow these)

- Prisma: import the singleton from `backend/src/lib/prisma.js`. Never call `new PrismaClient()` directly — Prisma 7 requires the `@prisma/adapter-pg` driver adapter which is set up in the singleton.

- Validation: define `express-validator` rule arrays in the route file, then pass them into the shared `backend/src/middleware/validate.js` middleware. Never duplicate validation logic in controllers.

- Auth: attach `authMiddleware` at the router level (`router.use(authMiddleware)`) for any protected route group.

- Optimistic UI: when a user action should feel instant, update local React state immediately before the API call, then reconcile with a re-fetch after the call resolves. Revert on error.

- All frontend API calls go through `frontend/src/api/axiosClient.js`. Never import axios directly in pages or components.