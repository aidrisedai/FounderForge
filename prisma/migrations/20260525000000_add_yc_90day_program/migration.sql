-- CreateTable: YCProgram
CREATE TABLE "YCProgram" (
    "id"              TEXT NOT NULL,
    "userId"          TEXT NOT NULL,
    "startupName"     TEXT NOT NULL,
    "oneLiner"        TEXT NOT NULL,
    "stage"           TEXT NOT NULL,
    "startingRevenue" INTEGER NOT NULL DEFAULT 0,
    "targetRevenue"   INTEGER NOT NULL DEFAULT 1000000,
    "currentDay"      INTEGER NOT NULL DEFAULT 1,
    "status"          TEXT NOT NULL DEFAULT 'active',
    "phases"          JSONB,
    "partnerName"     TEXT NOT NULL DEFAULT 'Michael Seibel',
    "startDate"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "YCProgram_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "YCProgram_userId_idx" ON "YCProgram"("userId");

ALTER TABLE "YCProgram"
    ADD CONSTRAINT "YCProgram_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: YCDay
CREATE TABLE "YCDay" (
    "id"          TEXT NOT NULL,
    "programId"   TEXT NOT NULL,
    "dayNumber"   INTEGER NOT NULL,
    "theme"       TEXT NOT NULL,
    "objective"   TEXT NOT NULL,
    "tasks"       JSONB NOT NULL DEFAULT '[]',
    "partnerNote" TEXT,
    "rationale"   TEXT,
    "detailed"    BOOLEAN NOT NULL DEFAULT false,
    "status"      TEXT NOT NULL DEFAULT 'pending',
    "report"      JSONB,
    "reportedAt"  TIMESTAMP(3),
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YCDay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "YCDay_programId_idx" ON "YCDay"("programId");
CREATE UNIQUE INDEX "YCDay_programId_dayNumber_key" ON "YCDay"("programId", "dayNumber");

ALTER TABLE "YCDay"
    ADD CONSTRAINT "YCDay_programId_fkey"
    FOREIGN KEY ("programId") REFERENCES "YCProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;
