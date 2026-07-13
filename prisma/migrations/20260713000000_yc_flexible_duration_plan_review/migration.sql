-- YC program: flexible sprint length + plan-review phase before Day 1
ALTER TABLE "YCProgram" ADD COLUMN "durationDays" INTEGER NOT NULL DEFAULT 90;
ALTER TABLE "YCProgram" ADD COLUMN "planDays" JSONB;
ALTER TABLE "YCProgram" ADD COLUMN "planChat" JSONB;
