-- Migration: rename STUDENT→HOLDER in Role enum, add createdByUniversityId to users
-- PostgreSQL doesn't support ALTER TYPE ... RENAME VALUE directly,
-- so we recreate the type.

-- Step 1: Recreate the Role enum without STUDENT
--   a) rename current type out of the way
ALTER TYPE "Role" RENAME TO "Role_old";

--   b) create the canonical type with the final set of values
CREATE TYPE "Role" AS ENUM ('HOLDER', 'UNIVERSITY', 'ADMIN', 'VERIFIER');

--   c) drop the old enum default before converting the column type
ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT;

--   d) migrate the column to the new type, mapping STUDENT rows to HOLDER
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role"
    USING (
      CASE
        WHEN "role"::text = 'STUDENT' THEN 'HOLDER'
        ELSE "role"::text
      END
    )::"Role";

--   e) reset the default
ALTER TABLE "users"
  ALTER COLUMN "role" SET DEFAULT 'HOLDER'::"Role";

--   f) drop the old type
DROP TYPE "Role_old";

-- Step 2: Add createdByUniversityId column (nullable self-referential FK)
ALTER TABLE "users" ADD COLUMN "createdByUniversityId" TEXT;

-- Step 3: Add the foreign key constraint
ALTER TABLE "users"
  ADD CONSTRAINT "users_createdByUniversityId_fkey"
  FOREIGN KEY ("createdByUniversityId")
  REFERENCES "users"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
