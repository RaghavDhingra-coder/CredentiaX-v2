import { createReadStream, existsSync } from 'fs'
import { certificateService } from '../services/certificateService.js'
import { successResponse, errorResponse } from '../utils/response.js'
import { AppError } from '../utils/AppError.js'

export const certificateController = {
  // POST /certificates/issue — UNIVERSITY only
  async issue(req, res, next) {
    console.log('[CERT-CONTROLLER] issue() called')
    console.log('[CERT-CONTROLLER] User:', req.user)
    console.log('[CERT-CONTROLLER] Body:', req.body)
    
    try {
      const { holderId, title, course, description, issueDate } = req.body

      if (!holderId || !title || !course || !issueDate) {
        console.log('[CERT-CONTROLLER] Validation failed - missing required fields')
        return errorResponse(res, 'holderId, title, course, and issueDate are required', 422)
      }

      console.log('[CERT-CONTROLLER] Calling certificateService.issueCertificate...')
      const { certificate, certId } = await certificateService.issueCertificate({
        holderId,
        issuedByUserId: req.user.id,
        title,
        course,
        description,
        issueDate,
      })

      console.log('[CERT-CONTROLLER] Certificate issued successfully:', certId)
      return successResponse(res, { certificate }, 201)
    } catch (err) {
      console.error('[CERT-CONTROLLER] Error in issue():', err)
      next(err)
    }
  },

  // GET /certificates/my-certificates — HOLDER only
  async myCertificates(req, res, next) {
    try {
      const certificates = await certificateService.findByHolder(req.user.id)
      return successResponse(res, { certificates })
    } catch (err) {
      next(err)
    }
  },

  // GET /certificates/issued — UNIVERSITY only (certificates they issued)
  async issuedCertificates(req, res, next) {
    try {
      const certificates = await certificateService.findByIssuer(req.user.id)
      return successResponse(res, { certificates })
    } catch (err) {
      next(err)
    }
  },

  // GET /certificates/:certificateId — public (for verification)
  async findByCertificateId(req, res, next) {
    try {
      const certificate = await certificateService.findByCertificateId(req.params.certificateId)
      return successResponse(res, { certificate })
    } catch (err) {
      next(err)
    }
  },

  // GET /certificates/file/:certificateId — authenticated download
  async serveFile(req, res, next) {
    try {
      const { certificateId } = req.params
      const cert = await certificateService.findByCertificateId(certificateId)

      // Only the holder or the issuing university can download
      const userId = req.user.id
      const isHolder   = cert.holder.id === userId
      const isIssuer   = cert.issuedByUser.id === userId
      const isAdmin    = req.user.role === 'ADMIN'

      if (!isHolder && !isIssuer && !isAdmin) {
        throw new AppError('You do not have permission to download this certificate', 403)
      }

      if (!cert.pdfPath) throw new AppError('PDF not yet generated for this certificate', 404)

      const filePath = certificateService.getFilePath(cert.pdfPath)
      if (!existsSync(filePath)) throw new AppError('Certificate file not found on server', 404)

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename="${certificateId}.pdf"`)
      createReadStream(filePath).pipe(res)
    } catch (err) {
      next(err)
    }
  },

  // PATCH /certificates/:id/revoke — UNIVERSITY only
  async revoke(req, res, next) {
    try {
      const certificate = await certificateService.revoke(req.params.id, req.user.id)
      return successResponse(res, { certificate })
    } catch (err) {
      next(err)
    }
  },

  // POST /certificates/prepare-issuance — UNIVERSITY only
  // Phase 1: generate PDF+hash, persist as PENDING_BLOCKCHAIN, return blockchain payload
  async prepareIssuance(req, res, next) {
    try {
      const { holderId, title, course, description, issueDate } = req.body
      if (!holderId || !title || !course || !issueDate) {
        return errorResponse(res, 'holderId, title, course, and issueDate are required', 422)
      }

      const { certificate, blockchainPayload } = await certificateService.prepareCertificate({
        holderId,
        issuedByUserId: req.user.id,
        title,
        course,
        description,
        issueDate,
      })

      return successResponse(res, { certificate, blockchainPayload }, 201)
    } catch (err) {
      next(err)
    }
  },

  // POST /certificates/finalize-issuance — UNIVERSITY only
  // Phase 2: record confirmed tx hash, transition certificate to ACTIVE
  async finalizeIssuance(req, res, next) {
    try {
      const { certificateId, txHash, signerAddress, chainId, blockNumber } = req.body
      if (!certificateId || !txHash) {
        return errorResponse(res, 'certificateId and txHash are required', 422)
      }

      const certificate = await certificateService.finalizeCertificate({
        certificateId,
        txHash,
        signerAddress,
        chainId,
        blockNumber,
      })

      return successResponse(res, { certificate })
    } catch (err) {
      next(err)
    }
  },
}
