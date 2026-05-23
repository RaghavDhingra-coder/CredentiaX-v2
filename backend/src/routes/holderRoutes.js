import { Router } from 'express'
import { holderController } from '../controllers/holderController.js'
import { protectRoute, checkInstitutionApproval } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateSchema.js'
import { createHolderSchema } from '../schemas/authSchemas.js'

const router = Router()

// All routes require UNIVERSITY role and admin approval
router.post('/',    ...protectRoute('UNIVERSITY'), checkInstitutionApproval, validateBody(createHolderSchema), holderController.create)
router.get('/',     ...protectRoute('UNIVERSITY'), checkInstitutionApproval, holderController.findAll)
router.get('/:id',  ...protectRoute('UNIVERSITY'), checkInstitutionApproval, holderController.findById)

export default router
