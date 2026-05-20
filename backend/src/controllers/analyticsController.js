import { analyticsService } from '../services/analyticsService.js'
import { successResponse } from '../utils/response.js'

export const analyticsController = {
  async university(req, res, next) {
    try {
      const data = await analyticsService.getUniversityStats(req.user.id)
      return successResponse(res, data)
    } catch (err) {
      next(err)
    }
  },

  async admin(req, res, next) {
    try {
      const data = await analyticsService.getAdminStats()
      return successResponse(res, data)
    } catch (err) {
      next(err)
    }
  },
}
