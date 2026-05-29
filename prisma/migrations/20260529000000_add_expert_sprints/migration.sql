-- CreateTable: ExpertSprint
CREATE TABLE "ExpertSprint" (
    "id"             TEXT NOT NULL,
    "userId"         TEXT NOT NULL,
    "role"           TEXT NOT NULL,
    "roleName"       TEXT NOT NULL,
    "expertName"     TEXT NOT NULL,
    "goal"           TEXT NOT NULL,
    "timeline"       INTEGER NOT NULL,
    "startupContext" TEXT,
    "currentDay"     INTEGER NOT NULL DEFAULT 1,
    "status"         TEXT NOT NULL DEFAULT 'active',
    "phases"         JSONB,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ExpertSprint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExpertSprint_userId_idx" ON "ExpertSprint"("userId");

ALTER TABLE "ExpertSprint"
    ADD CONSTRAINT "ExpertSprint_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ExpertSprintDay
CREATE TABLE "ExpertSprintDay" (
    "id"         TEXT NOT NULL,
    "sprintId"   TEXT NOT NULL,
    "dayNumber"  INTEGER NOT NULL,
    "theme"      TEXT NOT NULL,
    "objective"  TEXT NOT NULL,
    "tasks"      JSONB NOT NULL DEFAULT '[]',
    "expertNote" TEXT,
    "rationale"  TEXT,
    "detailed"   BOOLEAN NOT NULL DEFAULT false,
    "status"     TEXT NOT NULL DEFAULT 'pending',
    "report"     JSONB,
    "reportedAt" TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExpertSprintDay_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ExpertSprintDay_sprintId_idx" ON "ExpertSprintDay"("sprintId");
CREATE UNIQUE INDEX "ExpertSprintDay_sprintId_dayNumber_key" ON "ExpertSprintDay"("sprintId", "dayNumber");

ALTER TABLE "ExpertSprintDay"
    ADD CONSTRAINT "ExpertSprintDay_sprintId_fkey"
    FOREIGN KEY ("sprintId") REFERENCES "ExpertSprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
