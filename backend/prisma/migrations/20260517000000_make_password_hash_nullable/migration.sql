-- Google sign-in creates users with no password. Allow passwordHash to be NULL.
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
