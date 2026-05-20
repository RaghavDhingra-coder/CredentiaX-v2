-- Add CertificateStatus lifecycle to certificates

CREATE TYPE "CertificateStatus" AS ENUM ('PENDING_BLOCKCHAIN', 'ACTIVE', 'FAILED');

ALTER TABLE "certificates"
  ADD COLUMN "status"      "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "chainId"     INTEGER,
  ADD COLUMN "blockNumber" INTEGER;
