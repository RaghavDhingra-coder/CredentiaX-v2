import { Router } from 'express'
import { holderController } from '../controllers/holderController.js'
import { protectRoute } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateSchema.js'
import { createHolderSchema } from '../schemas/authSchemas.js'

const router = Router()

// All routes require UNIVERSITY role
router.post('/',    ...protectRoute('UNIVERSITY'), validateBody(createHolderSchema), holderController.create)
router.get('/',     ...protectRoute('UNIVERSITY'), holderController.findAll)
router.get('/:id',  ...protectRoute('UNIVERSITY'), holderController.findById)

export default router
