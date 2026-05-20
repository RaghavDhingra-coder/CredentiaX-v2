export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      // Zod v4 uses .issues; v3 aliases it as .errors — support both
      const issues = result.error.issues ?? result.error.errors ?? []
      const errors = issues.reduce((acc, e) => {
        const key = e.path.join('.') || 'body'
        acc[key] = e.message
        return acc
      }, {})
      return res.status(422).json({ success: false, message: 'Validation failed', errors })
    }
    req.body = result.data
    next()
  }
}
