const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate a request body against a set of rules.
 *
 * Rules per field:
 *   required   – field must be present and non-empty
 *   type       – 'string' | 'boolean' | 'number'
 *   minLength  – minimum string length
 *   maxLength  – maximum string length
 *   email      – must match email pattern
 *   enum       – value must be one of the listed options
 */
export function validate(body, rules) {
  const errors = {}

  for (const [field, checks] of Object.entries(rules)) {
    const value = body?.[field]
    const isEmpty = value === undefined || value === null || value === ''

    if (checks.required && isEmpty) {
      errors[field] = `${field} is required`
      continue
    }

    if (isEmpty) continue

    if (checks.type && typeof value !== checks.type) {
      errors[field] = `${field} must be a ${checks.type}`
      continue
    }

    if (checks.minLength && String(value).trim().length < checks.minLength) {
      errors[field] = `${field} must be at least ${checks.minLength} characters`
    }

    if (checks.maxLength && String(value).trim().length > checks.maxLength) {
      errors[field] = `${field} must be at most ${checks.maxLength} characters`
    }

    if (checks.email && !EMAIL_RE.test(value)) {
      errors[field] = `${field} must be a valid email address`
    }

    if (checks.enum && !checks.enum.includes(value)) {
      errors[field] = `${field} must be one of: ${checks.enum.join(', ')}`
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
