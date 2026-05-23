import { institutionVerificationService } from '../services/institutionVerificationService.js'
import { successResponse } from '../utils/response.js'

export const institutionVerificationController = {
  async request(req, res, next) {
    try {
      const institution = await institutionVerificationService.request(req.user.id)
      return successResponse(res, { institution }, 201)
    } catch (err) {
      next(err)
    }
  },

  async findPending(req, res, next) {
    try {
      const requests = await institutionVerificationService.findPending()
      return successResponse(res, { requests })
    } catch (err) {
      next(err)
    }
  },

  async review(req, res, next) {
    try {
      const institution = await institutionVerificationService.review(req.params.userId, req.body)
      return successResponse(res, { institution })
    } catch (err) {
      next(err)
    }
  },
}
