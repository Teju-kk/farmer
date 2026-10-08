-- Replace legacy account roles without deleting users or changing their records.
-- Existing buyers, suppliers, and service-provider accounts become marketers.
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'FARMER', 'MARKETER');

ALTER TABLE "User"
  ALTER COLUMN "role" TYPE "UserRole"
  USING (
    CASE "role"::text
      WHEN 'ADMIN' THEN 'ADMIN'::"UserRole"
      WHEN 'FARMER' THEN 'FARMER'::"UserRole"
      ELSE 'MARKETER'::"UserRole"
    END
  );

DROP TYPE "Role";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'FARMER';

CREATE TABLE "MarketerProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organization" TEXT,
  "marketLocation" TEXT,
  "businessType" TEXT,
  "bio" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MarketerProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MarketerProfile_userId_key" ON "MarketerProfile"("userId");

ALTER TABLE "MarketerProfile"
  ADD CONSTRAINT "MarketerProfile_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
