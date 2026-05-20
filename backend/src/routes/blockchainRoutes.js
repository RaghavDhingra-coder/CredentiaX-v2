import { Router } from 'express'
import { blockchainController } from '../controllers/blockchainController.js'
import { protectRoute } from '../middleware/auth.js'

const router = Router()

// Public — any authenticated user can check status
router.get('/status', ...protectRoute(), blockchainController.status)

// UNIVERSITY-only actions
router.post('/test-issue', ...protectRoute('UNIVERSITY'), blockchainController.testIssue)
router.post('/revoke',     ...protectRoute('UNIVERSITY'), blockchainController.revoke)

// Anyone authenticated can verify
router.get('/verify/:credentialId', ...protectRoute(), blockchainController.verify)

export default router
