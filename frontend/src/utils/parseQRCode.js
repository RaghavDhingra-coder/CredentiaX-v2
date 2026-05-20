// CERT-YYYY-NNNNNN  (6-digit zero-padded, year 2020–2099)
const CERT_ID_RE = /^CERT-20[2-9]\d-\d{6}$/

/**
 * Parse a raw QR string and return the certificate ID, or null if invalid.
 * Accepts:
 *   - bare ID:  "CERT-2026-000001"
 *   - full URL: "http://127.0.0.1:5173/verify/CERT-2026-000001"
 *               "https://credentiax.app/verify/CERT-2026-000001"
 */
export function parseQRCode(raw) {
  if (!raw || typeof raw !== 'string') return null

  const trimmed = raw.trim()

  // Reject obviously unsafe strings
  if (trimmed.length > 512) return null

  // Try parsing as a URL first
  try {
    const url = new URL(trimmed)
    // Only accept http/https — never javascript: or data: URIs
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

    const parts = url.pathname.split('/').filter(Boolean)
    const verifyIdx = parts.indexOf('verify')
    if (verifyIdx !== -1 && parts[verifyIdx + 1]) {
      const candidate = parts[verifyIdx + 1].toUpperCase()
      return CERT_ID_RE.test(candidate) ? candidate : null
    }
    return null
  } catch {
    // Not a URL — try as bare cert ID
    const candidate = trimmed.toUpperCase()
    return CERT_ID_RE.test(candidate) ? candidate : null
  }
}
