import { Router } from 'express'
import { certificateController } from '../controllers/certificateController.js'
import { protectRoute } from '../middleware/auth.js'

const router = Router()

console.log('[CERT-ROUTES] Initializing certificate routes...')

// Test route to verify mounting
router.get('/test', (req, res) => {
  console.log('[CERT-ROUTES] Test route hit!')
  res.json({ success: true, message: 'Certificate routes are mounted correctly!' })
})
console.log('[CERT-ROUTES] ✓ GET /test registered')

// UNIVERSITY: issue a new certificate (legacy single-step, off-chain fallback)
router.post('/issue', ...protectRoute('UNIVERSITY'), certificateController.issue)
console.log('[CERT-ROUTES] ✓ POST /issue registered')

// UNIVERSITY: two-phase decentralized issuance
router.post('/prepare-issuance',  ...protectRoute('UNIVERSITY'), certificateController.prepareIssuance)
console.log('[CERT-ROUTES] ✓ POST /prepare-issuance registered')

router.post('/finalize-issuance', ...protectRoute('UNIVERSITY'), certificateController.finalizeIssuance)
console.log('[CERT-ROUTES] ✓ POST /finalize-issuance registered')

// HOLDER: view their own certificates
router.get('/my-certificates', ...protectRoute('HOLDER'), certificateController.myCertificates)
console.log('[CERT-ROUTES] ✓ GET /my-certificates registered')

// UNIVERSITY: view certificates they issued
router.get('/issued', ...protectRoute('UNIVERSITY'), certificateController.issuedCertificates)
console.log('[CERT-ROUTES] ✓ GET /issued registered')

// Authenticated: secure PDF download
router.get('/file/:certificateId', ...protectRoute(), certificateController.serveFile)
console.log('[CERT-ROUTES] ✓ GET /file/:certificateId registered')

// UNIVERSITY: revoke a certificate by DB id
router.patch('/:id/revoke', ...protectRoute('UNIVERSITY', 'ADMIN'), certificateController.revoke)
console.log('[CERT-ROUTES] ✓ PATCH /:id/revoke registered')

// Public: look up a certificate by its certificateId (for verification)
// IMPORTANT: This must be last because it uses a catch-all parameter
router.get('/:certificateId', certificateController.findByCertificateId)
console.log('[CERT-ROUTES] ✓ GET /:certificateId registered')

console.log('[CERT-ROUTES] All certificate routes registered successfully')

export default router
