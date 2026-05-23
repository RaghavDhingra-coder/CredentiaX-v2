CREATE TYPE "InstitutionVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');

ALTER TABLE "users"
  ADD COLUMN "verificationStatus" "InstitutionVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "verificationWebsite" TEXT,
  ADD COLUMN "verificationRequestedAt" TIMESTAMP(3),
  ADD COLUMN "verificationReviewedAt" TIMESTAMP(3),
  ADD COLUMN "verificationNote" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3);
