import { holderService } from '../services/holderService.js'
import { successResponse } from '../utils/response.js'

export const holderController = {
  async create(req, res, next) {
    try {
      const { name, email, walletAddress } = req.body
      const { holder, tempPassword } = await holderService.create({
        name,
        email,
        walletAddress,
        createdByUniversityId: req.user.id,
      })
      return successResponse(res, { holder, tempPassword }, 201)
    } catch (err) {
      next(err)
    }
  },

  async findAll(req, res, next) {
    try {
      const holders = await holderService.findAllByCreator(req.user.id)
      return successResponse(res, { holders, total: holders.length })
    } catch (err) {
      next(err)
    }
  },

  async findById(req, res, next) {
    try {
      const holder = await holderService.findByIdForCreator(req.params.id, req.user.id)
      return successResponse(res, { holder })
    } catch (err) {
      next(err)
    }
  },
}
