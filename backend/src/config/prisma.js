import { PrismaClient } from '@prisma/client'

const logLevels =
  process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['error']

// Singleton pattern: reuse the same instance across hot-reloads in dev
const globalWithPrisma = globalThis

const prisma =
  globalWithPrisma.__prisma ??
  new PrismaClient({
    log: logLevels,
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') {
  globalWithPrisma.__prisma = prisma
}

export default prisma
