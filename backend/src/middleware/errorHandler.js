// Prisma error codes → https://www.prisma.io/docs/orm/reference/error-reference
const PRISMA_ERRORS = {
  P2002: (err) => ({
    status: 409,
    message: `Duplicate value: ${err.meta?.target?.join(', ') ?? 'field'} already exists`,
  }),
  P2025: () => ({ status: 404, message: 'Record not found' }),
  P2003: (err) => ({
    status: 400,
    message: `Foreign key constraint failed on field: ${err.meta?.field_name ?? 'unknown'}`,
  }),
  P2014: () => ({ status: 400, message: 'Relation violation: required record not found' }),
  P2021: (err) => ({ status: 500, message: `Table "${err.meta?.table}" does not exist` }),
}

export function errorHandler(err, req, res, next) {
  // Handle known Prisma errors
  if (err.code && PRISMA_ERRORS[err.code]) {
    const { status, message } = PRISMA_ERRORS[err.code](err)
    return res.status(status).json({ success: false, message })
  }

  // Handle custom AppError
  const status = err.statusCode || err.status || 500
  const message = err.message || 'Internal Server Error'
  const isDev = process.env.NODE_ENV === 'development'

  if (isDev) {
    console.error(`[ERROR ${status}] ${req.method} ${req.originalUrl}`)
    console.error(err.stack)
  }

  return res.status(status).json({
    success: false,
    message,
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  })
}
