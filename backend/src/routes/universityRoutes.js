import { Router } from 'express'
import { universityController } from '../controllers/universityController.js'
import { protectRoute } from '../middleware/auth.js'

const router = Router()

// Public: read universities
router.get('/',    universityController.findAll)
router.get('/:id', universityController.findById)

// Protected: create requires ADMIN or UNIVERSITY role
router.post('/', ...protectRoute('ADMIN', 'UNIVERSITY'), universityController.create)

export default router
