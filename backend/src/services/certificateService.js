import { writeFile, mkdir } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { sha256 } from '../utils/hash.js'
import { generateQRBuffer } from '../utils/qr.js'
import { generateCertificatePDF } from '../utils/pdf.js'
import { blockchainService } from './blockchainService.js'
import { config } from '../config/env.js'
import { encodeId, encodeHash, farFutureExpiry } from '../utils/blockchainPayload.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = join(__dirname, '../../uploads/certificates')

async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true })
}

async function nextCertificateId() {
  const year  = new Date().getFullYear()
  const count = await prisma.certificate.count()
  return `CERT-${year}-${String(count + 1).padStart(6, '0')}`
}

const CERT_SELECT_FULL = {
  id: true,
  certificateId: true,
  title: true,
  course: true,
  description: true,
  issueDate: true,
  pdfHash: true,
  pdfPath: true,
  blockchainTxHash: true,
  issuerWalletAddress: true,
  isRevoked: true,
  status: true,
  chainId: true,
  blockNumber: true,
  createdAt: true,
  holder: { select: { id: true, name: true, email: true, walletAddress: true } },
  issuedByUser: { select: { id: true, name: true, email: true, walletAddress: true } },
}

// Alias kept for existing callers
const CERT_SELECT = CERT_SELECT_FULL

export const certificateService = {
  async issueCertificate({ holderId, issuedByUserId, title, course, description, issueDate }) {
    await ensureUploadsDir()

    // 1. Verify holder belongs to this university
    const holder = await prisma.user.findUnique({ where: { id: holderId } })
    if (!holder || holder.role !== 'HOLDER') throw new AppError('Holder not found', 404)
    if (holder.createdByUniversityId !== issuedByUserId) {
      throw new AppError('This holder belongs to a different institution', 403)
    }

    // 2. Get issuing university user
    const issuer = await prisma.user.findUnique({ where: { id: issuedByUserId } })
    if (!issuer) throw new AppError('Issuer not found', 404)

    // 3. Generate unique certificate ID
    const certId = await nextCertificateId()

    // 4. Generate QR code pointing to verification URL
    const appUrl = config.appUrl.replace(/\/+$/, '')
    const verifyUrl = `${appUrl}/verify/${certId}`
    const qrBuffer = await generateQRBuffer(verifyUrl)

    // 5. Generate PDF (with QR embedded)
    const pdfBuffer = await generateCertificatePDF({
      universityName:     issuer.name,
      holderName:         holder.name,
      title,
      course,
      description:        description || null,
      issueDate:          new Date(issueDate),
      certificateId:      certId,
      issuerWalletAddress: issuer.walletAddress || null,
      qrBuffer,
    })

    // 6. SHA-256 hash of the complete PDF binary
    const pdfHash = sha256(pdfBuffer)

    // 7. Save PDF to disk
    const fileName = `${certId}.pdf`
    const fullPath = join(UPLOADS_DIR, fileName)
    await writeFile(fullPath, pdfBuffer)
    const pdfPath = `uploads/certificates/${fileName}`

    // 8. Issue on blockchain (non-blocking — fails gracefully if unconfigured)
    let blockchainTxHash = null
    if (blockchainService.isConfigured() && holder.walletAddress) {
      try {
        const result = await blockchainService.issueCredentialOnChain({
          credentialId:    certId,
          credentialHash:  `0x${pdfHash.slice(0, 62)}`,
          subjectAddress:  holder.walletAddress,
          expiresAt:       null,
        })
        blockchainTxHash = result.txHash
      } catch (err) {
        console.warn('[blockchain] issuance failed (non-critical):', err.message)
      }
    }

    // 9. Persist to database
    const certificate = await prisma.certificate.create({
      data: {
        certificateId:       certId,
        title,
        course,
        description:         description || null,
        issueDate:           new Date(issueDate),
        pdfHash,
        pdfPath,
        blockchainTxHash,
        issuerWalletAddress: issuer.walletAddress || null,
        isRevoked:           false,
        holderId,
        issuedByUserId,
      },
      select: CERT_SELECT,
    })

    return { certificate, pdfBuffer, certId }
  },

  // Certificates visible to a HOLDER (their own)
  async findByHolder(holderId) {
    return prisma.certificate.findMany({
      where:   { holderId },
      orderBy: { createdAt: 'desc' },
      select:  CERT_SELECT,
    })
  },

  // Certificates issued by a UNIVERSITY user
  async findByIssuer(issuedByUserId) {
    return prisma.certificate.findMany({
      where:   { issuedByUserId },
      orderBy: { createdAt: 'desc' },
      select:  CERT_SELECT,
    })
  },

  // Public lookup by certificateId (for verification page)
  async findByCertificateId(certificateId) {
    const cert = await prisma.certificate.findUnique({
      where:  { certificateId },
      select: CERT_SELECT,
    })
    if (!cert) throw new AppError('Certificate not found', 404)
    return cert
  },

  async findById(id) {
    const cert = await prisma.certificate.findUnique({
      where:  { id },
      select: CERT_SELECT,
    })
    if (!cert) throw new AppError('Certificate not found', 404)
    return cert
  },

  async revoke(id, requestingUserId) {
    const cert = await this.findById(id)
    if (cert.isRevoked) throw new AppError('Certificate is already revoked', 409)
    if (cert.issuedByUser.id !== requestingUserId) {
      throw new AppError('Only the issuing university can revoke this certificate', 403)
    }
    return prisma.certificate.update({
      where:  { id },
      data:   { isRevoked: true },
      select: CERT_SELECT,
    })
  },

  getFilePath(pdfPath) {
    return join(__dirname, '../..', pdfPath)
  },

  // ── Phase-1: generate PDF/hash, persist as PENDING_BLOCKCHAIN ──────────────
  async prepareCertificate({ holderId, issuedByUserId, title, course, description, issueDate }) {
    await ensureUploadsDir()

    const holder = await prisma.user.findUnique({ where: { id: holderId } })
    if (!holder || holder.role !== 'HOLDER') throw new AppError('Holder not found', 404)
    if (holder.createdByUniversityId !== issuedByUserId) {
      throw new AppError('This holder belongs to a different institution', 403)
    }

    const issuer = await prisma.user.findUnique({ where: { id: issuedByUserId } })
    if (!issuer) throw new AppError('Issuer not found', 404)

    const certId = await nextCertificateId()

    const appUrl    = config.appUrl.replace(/\/+$/, '')
    const verifyUrl = `${appUrl}/verify/${certId}`
    const qrBuffer  = await generateQRBuffer(verifyUrl)

    const pdfBuffer = await generateCertificatePDF({
      universityName:      issuer.name,
      holderName:          holder.name,
      title,
      course,
      description:         description || null,
      issueDate:           new Date(issueDate),
      certificateId:       certId,
      issuerWalletAddress: issuer.walletAddress || null,
      qrBuffer,
    })

    const pdfHash = sha256(pdfBuffer)

    const fileName = `${certId}.pdf`
    const fullPath = join(UPLOADS_DIR, fileName)
    await writeFile(fullPath, pdfBuffer)
    const pdfPath = `uploads/certificates/${fileName}`

    const expiresAt = farFutureExpiry()

    const certificate = await prisma.certificate.create({
      data: {
        certificateId:       certId,
        title,
        course,
        description:         description || null,
        issueDate:           new Date(issueDate),
        pdfHash,
        pdfPath,
        issuerWalletAddress: issuer.walletAddress || null,
        isRevoked:           false,
        status:              'PENDING_BLOCKCHAIN',
        holderId,
        issuedByUserId,
      },
      select: CERT_SELECT,
    })

    return {
      certificate,
      blockchainPayload: {
        credentialIdBytes32:   encodeId(certId),
        credentialHashBytes32: encodeHash(pdfHash),
        subjectAddress:        holder.walletAddress || '0x0000000000000000000000000000000000000000',
        expiresAt,
        contractAddress:       config.blockchain.contractAddress || '',
        chainId:               config.blockchain.chainId || 31337,
      },
    }
  },

  // ── Phase-2: record confirmed tx hash, mark ACTIVE ─────────────────────────
  async finalizeCertificate({ certificateId, txHash, signerAddress, chainId, blockNumber }) {
    const cert = await prisma.certificate.findUnique({ where: { certificateId } })
    if (!cert) throw new AppError('Certificate not found', 404)
    if (cert.status === 'ACTIVE') throw new AppError('Certificate already finalized', 409)

    // Optional on-chain verification when blockchain is configured
    if (blockchainService.isConfigured()) {
      try {
        const onChain = await blockchainService.verifyCredentialOnChain(certificateId)
        if (!onChain.valid && onChain.reason !== 'Credential does not exist') {
          throw new AppError(`On-chain verification failed: ${onChain.reason}`, 422)
        }
      } catch (err) {
        if (err instanceof AppError) throw err
        // RPC unavailable — trust frontend tx hash in dev
        console.warn('[finalize] on-chain check skipped:', err.message)
      }
    }

    return prisma.certificate.update({
      where: { certificateId },
      data: {
        status:              'ACTIVE',
        blockchainTxHash:    txHash,
        issuerWalletAddress: signerAddress || cert.issuerWalletAddress,
        chainId:             chainId   ? Number(chainId)   : null,
        blockNumber:         blockNumber ? Number(blockNumber) : null,
      },
      select: CERT_SELECT,
    })
  },
}
