import { authService } from '../services/authService.js'
import { successResponse, errorResponse } from '../utils/response.js'

const COOKIE_NAME = 'credentiax_token'

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  }
}

export const authController = {
  async register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body)
      res.cookie(COOKIE_NAME, token, cookieOptions())
      return successResponse(res, { user }, 201)
    } catch (err) {
      next(err)
    }
  },

  async login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body)
      res.cookie(COOKIE_NAME, token, cookieOptions())
      return successResponse(res, { user })
    } catch (err) {
      next(err)
    }
  },

  logout(req, res) {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    return successResponse(res, { message: 'Logged out successfully' })
  },

  async me(req, res, next) {
    try {
      const user = await authService.getCurrentUser(req.user.id)
      return successResponse(res, { user })
    } catch (err) {
      next(err)
    }
  },

  async updateWallet(req, res, next) {
    try {
      const user = await authService.updateWallet(req.user.id, req.body.walletAddress)
      return successResponse(res, { user })
    } catch (err) {
      next(err)
    }
  },
}
