import { Router } from 'express'
import { adminController } from '../controllers/adminController.js'
import { protectRoute } from '../middleware/auth.js'

const router = Router()

router.get('/institutions', ...protectRoute('ADMIN'), adminController.listInstitutions)
router.patch('/approve-institution/:id', ...protectRoute('ADMIN'), adminController.approveInstitution)
router.patch('/reject-institution/:id',  ...protectRoute('ADMIN'), adminController.rejectInstitution)

export default router
