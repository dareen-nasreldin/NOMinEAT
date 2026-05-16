-- CreateTable
CREATE TABLE "SessionHistory" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "originalId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "winnerName" TEXT,
    "winnerScore" INTEGER NOT NULL DEFAULT 0,
    "results" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SessionHistory" ADD CONSTRAINT "SessionHistory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
