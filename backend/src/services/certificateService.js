import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'
import { sha256 } from '../utils/hash.js'
import { generateQRBuffer } from '../utils/qr.js'
import { generateCertificatePDF } from '../utils/pdf.js'
import { blockchainService } from './blockchainService.js'
import { config } from '../config/env.js'
import { encodeId, encodeHash, farFutureExpiry, computeMetadataHashes } from '../utils/blockchainPayload.js'
import { ethers } from 'ethers'

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
  usn: true,
  cgpa: true,
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

const CERT_SELECT = CERT_SELECT_FULL

export const certificateService = {
  async issueCertificate({ holderId, issuedByUserId, title, course, usn, cgpa, description, issueDate }) {
    await ensureUploadsDir()

    const holder = await prisma.user.findUnique({ where: { id: holderId } })
    if (!holder || holder.role !== 'HOLDER') throw new AppError('Holder not found', 404)
    if (holder.createdByUniversityId !== issuedByUserId) {
      throw new AppError('This holder belongs to a different institution', 403)
    }
    if (holder.walletAddress && !ethers.isAddress(holder.walletAddress)) {
      throw new AppError('Holder wallet address is invalid. Use a 0x-prefixed Ethereum address or leave it blank.', 400)
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
      usn:                 usn || null,
      cgpa:                cgpa || null,
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

    const certificate = await prisma.certificate.create({
      data: {
        certificateId:       certId,
        title,
        course,
        usn:                 usn || null,
        cgpa:                cgpa || null,
        description:         description || null,
        issueDate:           new Date(issueDate),
        pdfHash,
        pdfPath,
        blockchainTxHash:    null,
        issuerWalletAddress: issuer.walletAddress || null,
        isRevoked:           false,
        holderId,
        issuedByUserId,
      },
      select: CERT_SELECT,
    })

    return { certificate, pdfBuffer, certId }
  },

  async findByHolder(holderId) {
    return prisma.certificate.findMany({
      where:   { holderId },
      orderBy: { createdAt: 'desc' },
      select:  CERT_SELECT,
    })
  },

  async findByIssuer(issuedByUserId) {
    return prisma.certificate.findMany({
      where:   { issuedByUserId },
      orderBy: { createdAt: 'desc' },
      select:  CERT_SELECT,
    })
  },

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

  async abandonPendingCertificate(certificateId, requestingUserId) {
    const cert = await prisma.certificate.findUnique({
      where: { certificateId },
      select: {
        certificateId: true,
        issuedByUserId: true,
        pdfPath: true,
        status: true,
      },
    })

    if (!cert) return null
    if (cert.issuedByUserId !== requestingUserId) {
      throw new AppError('Only the issuing university can abandon this certificate', 403)
    }
    if (cert.status !== 'PENDING_BLOCKCHAIN') {
      throw new AppError('Only pending blockchain certificates can be abandoned', 409)
    }

    await prisma.certificate.delete({ where: { certificateId } })

    if (cert.pdfPath) {
      try {
        await unlink(this.getFilePath(cert.pdfPath))
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.warn('[certificate] failed to remove abandoned PDF:', err.message)
        }
      }
    }

    return { certificateId: cert.certificateId }
  },

  // ── Phase-1: generate PDF/hash, persist as PENDING_BLOCKCHAIN ──────────────
  async prepareCertificate({ holderId, issuedByUserId, title, course, usn, cgpa, description, issueDate }) {
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
      usn:                 usn || null,
      cgpa:                cgpa || null,
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

    // Compute metadata hashes for on-chain storage
    const { nameHash, usnHash, courseHash, gradeHash, dateHash } = computeMetadataHashes({
      name:      holder.name,
      usn:       usn || '',
      course,
      cgpa:      cgpa || '',
      issueDate: new Date(issueDate),
    })

    const certificate = await prisma.certificate.create({
      data: {
        certificateId:       certId,
        title,
        course,
        usn:                 usn || null,
        cgpa:                cgpa || null,
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
        nameHash,
        usnHash,
        courseHash,
        gradeHash,
        dateHash,
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

    if (blockchainService.isConfigured()) {
      try {
        const onChain = await blockchainService.verifyCredentialOnChain(certificateId)
        if (!onChain.valid && onChain.reason !== 'Credential does not exist') {
          throw new AppError(`On-chain verification failed: ${onChain.reason}`, 422)
        }
      } catch (err) {
        if (err instanceof AppError) throw err
        console.warn('[finalize] on-chain check skipped:', err.message)
      }
    }

    return prisma.certificate.update({
      where: { certificateId },
      data: {
        status:              'ACTIVE',
        blockchainTxHash:    txHash,
        issuerWalletAddress: signerAddress || cert.issuerWalletAddress,
        chainId:             chainId    ? Number(chainId)    : null,
        blockNumber:         blockNumber ? Number(blockNumber) : null,
      },
      select: CERT_SELECT,
    })
  },
}
