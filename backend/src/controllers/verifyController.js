import { verificationService } from '../services/verificationService.js'
import { successResponse } from '../utils/response.js'

function getIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

export const verifyController = {
  async uploadAndVerify(req, res, next) {
    try {
      const result = await verificationService.verifyByUpload({
        buffer:       req.file.buffer,
        mimetype:     req.file.mimetype,
        originalName: req.file.originalname,
        manualCertId: req.body.certificateId || null,
        ip:           getIp(req),
      })
      return successResponse(res, result)
    } catch (err) {
      next(err)
    }
  },
}
