import prisma from '../config/prisma.js'
import { sha256 } from '../utils/hash.js'
import { verificationLogService } from './verificationLogService.js'

const CERT_SELECT = {
  id:                  true,
  certificateId:       true,
  title:               true,
  course:              true,
  description:         true,
  issueDate:           true,
  pdfHash:             true,
  blockchainTxHash:    true,
  issuerWalletAddress: true,
  isRevoked:           true,
  createdAt:           true,
  holder:       { select: { id: true, name: true, email: true, walletAddress: true } },
  issuedByUser: { select: { id: true, name: true, email: true } },
}

// TAMPERED has no dedicated enum value — map to INVALID.
// NOT_FOUND cannot be logged because verification_logs.certificateId is NOT NULL.
const LOG_STATUS = { VALID: 'VALID', TAMPERED: 'INVALID', REVOKED: 'REVOKED' }

async function safeLog(certDbId, ip, status) {
  if (!certDbId || !LOG_STATUS[status]) return
  try {
    await verificationLogService.create({
      certificateId:      certDbId,
      verifierIp:         ip,
      verificationStatus: LOG_STATUS[status],
    })
  } catch (e) {
    console.warn('[verificationService] log write failed (non-critical):', e.message)
  }
}

export const verificationService = {
  /**
   * Verify a PDF by hashing its binary content, then finding a matching certificate.
   *
   * Detection algorithm:
   *  1. SHA-256 hash the uploaded buffer.
   *  2. Search DB for a certificate whose stored pdfHash matches → VALID / REVOKED.
   *  3. If no hash match, identify the certificate via:
   *       a. manualCertId provided by the user in the form field
   *       b. certificateId pattern extracted from the original filename
   *     If the certificate is found this way but hashes differ → TAMPERED.
   *  4. If nothing found → NOT_FOUND.
   */
  async verifyByUpload({ buffer, originalName, manualCertId, ip }) {
    const uploadedHash = sha256(buffer)

    // ── Step 1: exact hash match ─────────────────────────────────────────────
    let cert = await prisma.certificate.findFirst({
      where:  { pdfHash: uploadedHash },
      select: CERT_SELECT,
    })

    if (cert) {
      const status = cert.isRevoked ? 'REVOKED' : 'VALID'
      await safeLog(cert.id, ip, status)
      return {
        status,
        uploadedHash,
        storedHash: cert.pdfHash,
        hashMatch:  true,
        certificate: cert,
      }
    }

    // ── Step 2: identify certificate to detect tampering ─────────────────────
    let certId = manualCertId?.trim().toUpperCase() || null
    if (!certId && originalName) {
      // Generated filenames follow the pattern "CERT-YYYY-NNNNNN.pdf"
      const m = originalName.match(/CERT-\d{4}-\d+/i)
      if (m) certId = m[0].toUpperCase()
    }

    if (certId) {
      cert = await prisma.certificate.findUnique({
        where:  { certificateId: certId },
        select: CERT_SELECT,
      })
      if (cert) {
        await safeLog(cert.id, ip, 'TAMPERED')
        return {
          status:     'TAMPERED',
          uploadedHash,
          storedHash: cert.pdfHash,
          hashMatch:  false,
          certificate: cert,
        }
      }
    }

    // ── Step 3: nothing matched ───────────────────────────────────────────────
    return {
      status:      'NOT_FOUND',
      uploadedHash,
      storedHash:  null,
      hashMatch:   false,
      certificate: null,
    }
  },
}
