import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import prisma          from './config/prisma.js'
import routes          from './routes/index.js'
import { errorHandler }   from './middleware/errorHandler.js'
import { requestLogger }  from './middleware/requestLogger.js'

const app          = express()
const PORT         = process.env.PORT         || 3001
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestLogger)

// ── Debug: Log all incoming requests ────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`)
  next()
})

// ── Routes ──────────────────────────────────────────────────────────────────
console.log('[STARTUP] Mounting routes at /api/v1')
app.use('/api/v1', routes)
console.log('[STARTUP] Routes mounted successfully')

// ── Error handler (must be last) ────────────────────────────────────────────
app.use(errorHandler)

// ── Startup ─────────────────────────────────────────────────────────────────
async function start() {
  // Verify DB is reachable before accepting traffic
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    console.log('✔  Neon PostgreSQL connected')
  } catch (err) {
    console.error('✖  Database connection failed:', err.message)
    process.exit(1)
  }

  app.listen(PORT, () => {
    console.log(`✔  CredentiaX API running on http://localhost:${PORT}`)
    console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`)
    console.log(`   API base    : http://localhost:${PORT}/api/v1`)
    console.log(`   Server is listening and ready to accept connections...`)
  })
  
  console.log('Start function completed, server should be running...')
}

// ── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`)
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT',  () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})

export default app
