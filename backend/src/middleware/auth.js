import { authService } from '../services/authService.js'
import { errorResponse } from '../utils/response.js'

const COOKIE_NAME = 'credentiax_token'

export function verifyToken(req, res, next) {
  console.log('[AUTH] verifyToken called for:', req.method, req.url)
  const token = req.cookies?.[COOKIE_NAME]
  console.log('[AUTH] Token present:', !!token)
  
  if (!token) {
    console.log('[AUTH] No token found - authentication required')
    return errorResponse(res, 'Authentication required', 401)
  }
  try {
    req.user = authService.verifyToken(token)
    console.log('[AUTH] Token verified - User ID:', req.user.id, 'Role:', req.user.role)
    next()
  } catch (err) {
    console.error('[AUTH] Token verification failed:', err.message)
    return errorResponse(res, err.message, err.statusCode || 401)
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    console.log('[AUTH] requireRole called - Required:', roles, 'User role:', req.user?.role)
    if (!req.user) {
      console.log('[AUTH] No user found - authentication required')
      return errorResponse(res, 'Authentication required', 401)
    }
    if (!roles.includes(req.user.role)) {
      console.log('[AUTH] Role check failed - User has:', req.user.role, 'Required:', roles)
      return errorResponse(
        res,
        `Access denied. Required role: ${roles.join(' or ')}`,
        403,
      )
    }
    console.log('[AUTH] Role check passed')
    next()
  }
}

// Convenience: verifyToken + requireRole in one chain
export function protectRoute(...roles) {
  console.log('[AUTH] protectRoute called with roles:', roles)
  return [verifyToken, ...(roles.length ? [requireRole(...roles)] : [])]
}
