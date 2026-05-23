import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

const DEFAULT_VERIFICATION = {
  verificationStatus: 'UNVERIFIED',
  verificationWebsite: null,
  verificationRequestedAt: null,
  verificationReviewedAt: null,
  verificationNote: null,
  verifiedAt: null,
}

let hasVerificationColumns

async function storageAvailable() {
  if (hasVerificationColumns !== undefined) return hasVerificationColumns
  const rows = await prisma.$queryRaw`
    SELECT COUNT(*)::int AS count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name IN (
        'verificationStatus',
        'verificationWebsite',
        'verificationRequestedAt',
        'verificationReviewedAt',
        'verificationNote',
        'verifiedAt'
      )
  `
  hasVerificationColumns = rows[0]?.count === 6
  return hasVerificationColumns
}

async function requireStorage() {
  if (!await storageAvailable()) {
    throw new AppError('Institution verification requires the latest database migration', 503)
  }
}

async function readVerification(userId) {
  if (!await storageAvailable()) return DEFAULT_VERIFICATION
  const rows = await prisma.$queryRaw`
    SELECT
      "verificationStatus"::text AS "verificationStatus",
      "verificationWebsite",
      "verificationRequestedAt",
      "verificationReviewedAt",
      "verificationNote",
      "verifiedAt"
    FROM "users"
    WHERE "id" = ${userId}
    LIMIT 1
  `
  return rows[0] || DEFAULT_VERIFICATION
}

async function requestDetails(userId) {
  const rows = await prisma.$queryRaw`
    SELECT
      "id",
      "name",
      "email",
      "walletAddress",
      "createdAt",
      "verificationStatus"::text AS "verificationStatus",
      "verificationWebsite",
      "verificationRequestedAt",
      "verificationReviewedAt",
      "verificationNote",
      "verifiedAt"
    FROM "users"
    WHERE "id" = ${userId}
    LIMIT 1
  `
  return rows[0] || null
}

export const institutionVerificationService = {
  storageAvailable,

  async enrichUser(user) {
    if (!user) return user
    return { ...user, ...await readVerification(user.id) }
  },

  async isVerifiedUser(user) {
    if (!user?.walletAddress) return false
    const verification = await readVerification(user.id)
    return verification.verificationStatus === 'VERIFIED'
  },

  async resetForWalletChange(userId) {
    if (!await storageAvailable()) return
    await prisma.$executeRaw`
      UPDATE "users"
      SET
        "verificationStatus" = 'UNVERIFIED'::"InstitutionVerificationStatus",
        "verificationRequestedAt" = NULL,
        "verificationReviewedAt" = NULL,
        "verificationNote" = NULL,
        "verifiedAt" = NULL
      WHERE "id" = ${userId}
    `
  },

  async request(userId) {
    await requireStorage()
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, walletAddress: true },
    })
    const verification = await readVerification(userId)

    if (!user || user.role !== 'UNIVERSITY') {
      throw new AppError('Only university accounts can request institution verification', 403)
    }
    if (!user.walletAddress) {
      throw new AppError('Connect the issuer wallet before requesting verification', 422)
    }
    if (verification.verificationStatus === 'VERIFIED') {
      throw new AppError('This institution is already verified', 409)
    }

    // Prevent duplicate verification requests for the same wallet address
    const conflict = await prisma.$queryRaw`
      SELECT id FROM users
      WHERE LOWER("walletAddress") = LOWER(${user.walletAddress})
        AND id != ${userId}
        AND "verificationStatus" IN ('PENDING'::"InstitutionVerificationStatus", 'VERIFIED'::"InstitutionVerificationStatus")
      LIMIT 1
    `
    if (conflict.length > 0) {
      throw new AppError('This wallet address is already associated with another institution under review or verified', 409)
    }

    await prisma.$executeRaw`
      UPDATE "users"
      SET
        "verificationStatus" = 'PENDING'::"InstitutionVerificationStatus",
        "verificationWebsite" = NULL,
        "verificationRequestedAt" = NOW(),
        "verificationReviewedAt" = NULL,
        "verificationNote" = NULL,
        "verifiedAt" = NULL
      WHERE "id" = ${userId}
    `
    return requestDetails(userId)
  },

  async findPending() {
    if (!await storageAvailable()) return []
    return prisma.$queryRaw`
      SELECT
        "id",
        "name",
        "email",
        "walletAddress",
        "createdAt",
        "verificationStatus"::text AS "verificationStatus",
        "verificationWebsite",
        "verificationRequestedAt",
        "verificationReviewedAt",
        "verificationNote",
        "verifiedAt"
      FROM "users"
      WHERE "role" = 'UNIVERSITY'::"Role"
        AND "verificationStatus" = 'PENDING'::"InstitutionVerificationStatus"
      ORDER BY "verificationRequestedAt" ASC
    `
  },

  async review(userId, { decision, note }) {
    await requireStorage()
    const institution = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, walletAddress: true },
    })
    const verification = await readVerification(userId)

    if (!institution || institution.role !== 'UNIVERSITY') {
      throw new AppError('University verification request not found', 404)
    }
    if (verification.verificationStatus !== 'PENDING') {
      throw new AppError('Only pending verification requests can be reviewed', 409)
    }
    if (!institution.walletAddress) {
      throw new AppError('Institution wallet is no longer connected', 409)
    }
    if (!['APPROVE', 'REJECT'].includes(decision)) {
      throw new AppError('Decision must be APPROVE or REJECT', 422)
    }
    const reviewNote = String(note || '').trim()
    if (decision === 'REJECT' && !reviewNote) {
      throw new AppError('A rejection note is required', 422)
    }

    await prisma.$executeRaw`
      UPDATE "users"
      SET
        "verificationStatus" = ${decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED'}::"InstitutionVerificationStatus",
        "verificationReviewedAt" = NOW(),
        "verificationNote" = ${decision === 'REJECT' ? reviewNote : null},
        "verifiedAt" = ${decision === 'APPROVE' ? new Date() : null}
      WHERE "id" = ${userId}
    `
    return requestDetails(userId)
  },
}
