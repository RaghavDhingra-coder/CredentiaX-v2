import { Router } from 'express'
import { protectRoute } from '../middleware/auth.js'
import { institutionVerificationController } from '../controllers/institutionVerificationController.js'

const router = Router()

router.post('/request', ...protectRoute('UNIVERSITY'), institutionVerificationController.request)
router.get('/requests', ...protectRoute('ADMIN'), institutionVerificationController.findPending)
router.patch('/requests/:userId', ...protectRoute('ADMIN'), institutionVerificationController.review)

export default router
