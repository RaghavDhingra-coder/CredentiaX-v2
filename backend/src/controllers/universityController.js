import { universityService } from '../services/universityService.js'
import { validate } from '../utils/validate.js'
import { successResponse, errorResponse } from '../utils/response.js'

const CREATE_RULES = {
  universityName: { required: true, type: 'string', minLength: 2, maxLength: 200 },
  universityCode: { required: true, type: 'string', minLength: 2, maxLength: 20 },
  walletAddress:  { required: false, type: 'string', maxLength: 255 },
}

export const universityController = {
  async create(req, res, next) {
    try {
      const { isValid, errors } = validate(req.body, CREATE_RULES)
      if (!isValid) return errorResponse(res, 'Validation failed', 422, errors)

      const university = await universityService.create(req.body)
      return successResponse(res, { university }, 201)
    } catch (err) {
      next(err)
    }
  },

  async findAll(req, res, next) {
    try {
      const page  = Math.max(1, parseInt(req.query.page  ?? '1',  10))
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? '20', 10)))
      const result = await universityService.findAll({ page, limit })
      return successResponse(res, result)
    } catch (err) {
      next(err)
    }
  },

  async findById(req, res, next) {
    try {
      const university = await universityService.findById(req.params.id)
      return successResponse(res, { university })
    } catch (err) {
      next(err)
    }
  },
}
