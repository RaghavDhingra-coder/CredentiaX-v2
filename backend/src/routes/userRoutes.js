import { Router } from 'express'
import { userController } from '../controllers/userController.js'
import { protectRoute } from '../middleware/auth.js'

const router = Router()

// Admin-only: list all users and look up by ID
router.get('/',    ...protectRoute('ADMIN'), userController.findAll)
router.get('/:id', ...protectRoute('ADMIN'), userController.findById)

export default router
