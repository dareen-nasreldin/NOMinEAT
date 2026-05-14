# NOMinEAT - Food Voting App

NOMinEAT is a mobile-responsive full-stack web application designed to solve the age-old debate of deciding where a group should eat. Users can create accounts, join specific dining groups, and vote on choices based on shared favorite restaurants, food genres, and locations.

The architecture is built to support a smooth transition from a mobile-responsive web platform to a native mobile app in future development phases.

---

## Project Architecture & Tech Stack

The workspace is organized as a monorepo containing two decoupled systems:

- **`backend/`**: Node.js/Express REST API using **Prisma ORM** interacting with a **PostgreSQL** database.
- **`frontend/`**: Single Page Application built using **React**, **Vite**, and styled dynamically via **Tailwind CSS**.

---

## Prerequisites

Ensure you have the following software installed before getting started:

- **Node.js** (v18.x or higher)
- **npm** (comes bundled with Node.js)
- **PostgreSQL** running locally or hosted (e.g., Supabase, Neon, AWS RDS)

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd NOMinEAT
```

### 2. Configure the Backend

Install dependencies:

```bash
cd backend
npm install
```

Create your local environment file from the template:

```bash
cp .env.example .env
# On Windows PowerShell: copy .env.example .env
```

Open `backend/.env` and fill in your values:

```ini
# Application
NODE_ENV=development
PORT=5000
APP_SECRET_KEY=your_jwt_secret_here

# Database
DATABASE_URL="postgresql://db_user:db_password@localhost:5432/food_voting_db?schema=public"

# External APIs (e.g., Yelp, Google Places)
RESTAURANT_API_KEY=your_api_key_here

# CORS
FRONTEND_URL=http://localhost:3000
```

### 3. Initialize the Database

Apply the Prisma schema to your database:

```bash
npx prisma migrate dev --name init
```

Generate the Prisma Client:

```bash
npx prisma generate
```

### 4. Configure the Frontend

```bash
cd ../frontend
npm install
```

---

## Running the App

Start both servers concurrently in separate terminals.

**Backend** (from `backend/`):

```bash
npm run dev
```

API will be available at `http://localhost:5000`.

**Frontend** (from `frontend/`):

```bash
npm run dev
```

Vite will output the local URL (typically `http://localhost:3000` or `http://localhost:5173`).

---

## Version Control Notes

- **`backend/.env`** is git-ignored — it contains secrets. Document any new variables in `backend/.env.example` instead.
- **`node_modules/`** directories are git-ignored across both `backend/` and `frontend/`. Run `npm install` to restore them.
