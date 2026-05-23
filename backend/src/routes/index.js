import { Router } from 'express'
import healthRoutes      from './healthRoutes.js'
import authRoutes        from './authRoutes.js'
import userRoutes        from './userRoutes.js'
import holderRoutes      from './holderRoutes.js'
import universityRoutes  from './universityRoutes.js'
import institutionVerificationRoutes from './institutionVerificationRoutes.js'
import certificateRoutes from './certificateRoutes.js'
import blockchainRoutes  from './blockchainRoutes.js'
import verifyRoutes      from './verifyRoutes.js'
import analyticsRoutes   from './analyticsRoutes.js'

const router = Router()

console.log('[ROUTES] Mounting sub-routes...')

router.use('/health',       healthRoutes)
console.log('[ROUTES] ✓ /health mounted')

router.use('/auth',         authRoutes)
console.log('[ROUTES] ✓ /auth mounted')

router.use('/users',        userRoutes)
console.log('[ROUTES] ✓ /users mounted')

router.use('/holders',      holderRoutes)
console.log('[ROUTES] ✓ /holders mounted')

router.use('/universities', universityRoutes)
console.log('[ROUTES] ✓ /universities mounted')
router.use('/institution-verification', institutionVerificationRoutes)
console.log('[ROUTES] ✓ /institution-verification mounted')

router.use('/certificates', certificateRoutes)
console.log('[ROUTES] ✓ /certificates mounted')

router.use('/blockchain',   blockchainRoutes)
console.log('[ROUTES] ✓ /blockchain mounted')

router.use('/verify',       verifyRoutes)
console.log('[ROUTES] ✓ /verify mounted')

router.use('/analytics',    analyticsRoutes)
console.log('[ROUTES] ✓ /analytics mounted')

// 404 for unmatched API routes
router.use((req, res) => {
  console.log(`[404] Route not found: ${req.method} ${req.originalUrl}`)
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` })
})

console.log('[ROUTES] All routes mounted successfully')

export default router
