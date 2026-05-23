-- Migration: add usn and cgpa columns to certificates
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS usn TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS cgpa TEXT;
