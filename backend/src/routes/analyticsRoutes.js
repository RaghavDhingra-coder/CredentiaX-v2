import { Router } from 'express'
import { analyticsController } from '../controllers/analyticsController.js'
import { protectRoute }        from '../middleware/auth.js'

const router = Router()

// UNIVERSITY: own analytics only — service scopes to req.user.id
router.get('/university', ...protectRoute('UNIVERSITY'), analyticsController.university)

// ADMIN: system-wide analytics
router.get('/admin',      ...protectRoute('ADMIN'),      analyticsController.admin)

export default router
