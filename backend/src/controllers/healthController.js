import prisma from '../config/prisma.js'
import { successResponse, errorResponse } from '../utils/response.js'

export async function getHealth(req, res) {
  res.json({
    success: true,
    message: 'CredentiaX API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
}

export async function getDbHealth(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`
    return successResponse(res, {
      database: 'connected',
      provider: 'Neon PostgreSQL',
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    return errorResponse(res, `Database connection failed: ${err.message}`, 503)
  }
}
