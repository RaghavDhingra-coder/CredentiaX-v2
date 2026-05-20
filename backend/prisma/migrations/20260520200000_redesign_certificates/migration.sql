-- Redesign certificates table: drop old schema, create new one scoped to User model

-- 1. Drop dependent table first
DROP TABLE IF EXISTS "verification_logs";

-- 2. Drop old certificates table (was referencing universities, not users)
DROP TABLE IF EXISTS "certificates";

-- 3. Create new certificates table
CREATE TABLE "certificates" (
  "id"                  TEXT        NOT NULL,
  "certificateId"       TEXT        NOT NULL,
  "title"               TEXT        NOT NULL,
  "course"              TEXT        NOT NULL,
  "description"         TEXT,
  "issueDate"           TIMESTAMP(3) NOT NULL,
  "pdfHash"             TEXT,
  "pdfPath"             TEXT,
  "blockchainTxHash"    TEXT,
  "issuerWalletAddress" TEXT,
  "isRevoked"           BOOLEAN     NOT NULL DEFAULT false,
  "createdAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "holderId"            TEXT        NOT NULL,
  "issuedByUserId"      TEXT        NOT NULL,
  CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "certificates_certificateId_key" ON "certificates"("certificateId");
CREATE INDEX "certificates_holderId_idx" ON "certificates"("holderId");
CREATE INDEX "certificates_issuedByUserId_idx" ON "certificates"("issuedByUserId");

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_holderId_fkey"
  FOREIGN KEY ("holderId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "certificates"
  ADD CONSTRAINT "certificates_issuedByUserId_fkey"
  FOREIGN KEY ("issuedByUserId") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Recreate verification_logs referencing new certificates
CREATE TABLE "verification_logs" (
  "id"                 TEXT        NOT NULL,
  "verifierIp"         TEXT        NOT NULL,
  "verificationStatus" "VerificationStatus" NOT NULL,
  "createdAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "certificateId"      TEXT        NOT NULL,
  CONSTRAINT "verification_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "verification_logs"
  ADD CONSTRAINT "verification_logs_certificateId_fkey"
  FOREIGN KEY ("certificateId") REFERENCES "certificates"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
