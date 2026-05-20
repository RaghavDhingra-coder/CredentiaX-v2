-- Migration: rename STUDENT→HOLDER in Role enum, add createdByUniversityId to users
-- PostgreSQL doesn't support ALTER TYPE ... RENAME VALUE directly,
-- so we recreate the type.

-- Step 1: Add HOLDER to the existing enum (safe, no-op if already exists)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'HOLDER';

-- Step 2: Migrate any existing STUDENT rows to HOLDER before removing the value
UPDATE "users" SET "role" = 'HOLDER'::"Role" WHERE "role" = 'STUDENT'::"Role";

-- Step 3: Recreate the Role enum without STUDENT
--   a) rename current type out of the way
ALTER TYPE "Role" RENAME TO "Role_old";

--   b) create the canonical type with the final set of values
CREATE TYPE "Role" AS ENUM ('HOLDER', 'UNIVERSITY', 'ADMIN', 'VERIFIER');

--   c) migrate the column to the new type
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role"
    USING "role"::text::"Role";

--   d) reset the default
ALTER TABLE "users"
  ALTER COLUMN "role" SET DEFAULT 'HOLDER'::"Role";

--   e) drop the old type
DROP TYPE "Role_old";

-- Step 4: Add createdByUniversityId column (nullable self-referential FK)
ALTER TABLE "users" ADD COLUMN "createdByUniversityId" TEXT;

-- Step 5: Add the foreign key constraint
ALTER TABLE "users"
  ADD CONSTRAINT "users_createdByUniversityId_fkey"
  FOREIGN KEY ("createdByUniversityId")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
