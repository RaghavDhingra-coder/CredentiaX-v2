import { Router } from 'express'
import { authController } from '../controllers/authController.js'
import { verifyToken } from '../middleware/auth.js'
import { validateBody } from '../middleware/validateSchema.js'
import { registerSchema, loginSchema, updateWalletSchema } from '../schemas/authSchemas.js'

const router = Router()

router.post('/register', validateBody(registerSchema),     authController.register)
router.post('/login',    validateBody(loginSchema),        authController.login)
router.post('/logout',   authController.logout)
router.get('/me',        verifyToken,                      authController.me)
router.patch('/wallet',  verifyToken, validateBody(updateWalletSchema), authController.updateWallet)

export default router
