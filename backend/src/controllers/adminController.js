import { institutionVerificationService } from '../services/institutionVerificationService.js'
import { successResponse } from '../utils/response.js'

export const adminController = {
  async listInstitutions(req, res, next) {
    try {
      const institutions = await institutionVerificationService.findAllInstitutions()
      return successResponse(res, { institutions })
    } catch (err) {
      next(err)
    }
  },

  async approveInstitution(req, res, next) {
    try {
      const institution = await institutionVerificationService.approveAccess(req.params.id)
      return successResponse(res, { institution })
    } catch (err) {
      next(err)
    }
  },

  async rejectInstitution(req, res, next) {
    try {
      const { note } = req.body
      const institution = await institutionVerificationService.rejectAccess(req.params.id, note)
      return successResponse(res, { institution })
    } catch (err) {
      next(err)
    }
  },
}
