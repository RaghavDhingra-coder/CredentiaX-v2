import { Router } from 'express'
import { verifyController } from '../controllers/verifyController.js'
import { handleUpload }     from '../middleware/upload.js'

const router = Router()

// Public — no authentication required
router.post('/upload', handleUpload, verifyController.uploadAndVerify)

export default router
