import { userService } from '../services/userService.js'
import { successResponse } from '../utils/response.js'

export const userController = {
  async findAll(req, res, next) {
    try {
      const page  = Math.max(1, parseInt(req.query.page  ?? '1',  10))
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '20', 10)))
      const result = await userService.findAll({ page, limit })
      return successResponse(res, result)
    } catch (err) {
      next(err)
    }
  },

  async findById(req, res, next) {
    try {
      const user = await userService.findById(req.params.id)
      return successResponse(res, { user })
    } catch (err) {
      next(err)
    }
  },
}
