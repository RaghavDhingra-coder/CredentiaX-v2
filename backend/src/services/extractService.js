import { PDFParse, VerbosityLevel } from 'pdf-parse'
import { createWorker } from 'tesseract.js'
import Jimp from 'jimp'
import jsQR from 'jsqr'

const CERT_ID_RE = /\bCERT-20[2-9]\d-\d{6}\b/i

// ── QR scanning ───────────────────────────────────────────────────────────────

// Scan a QR code from a raw image buffer (PNG / JPG / WEBP).
// Returns the decoded string or null if no QR is found.
export async function scanQRFromBuffer(imageBuffer) {
  try {
    const image = await Jimp.read(imageBuffer)
    const { data, width, height } = image.bitmap
    // jsQR expects Uint8ClampedArray of RGBA pixel data
    const code = jsQR(new Uint8ClampedArray(data.buffer), width, height, {
      inversionAttempts: 'attemptBoth',
    })
    return code ? code.data : null
  } catch {
    return null
  }
}

// Parse the certificate ID out of a QR payload.
// QR codes embed the full verification URL: http://host/verify/CERT-YYYY-NNNNNN
export function parseCertIdFromQR(qrData) {
  if (!qrData) return null
  // Direct cert ID
  const direct = qrData.match(CERT_ID_RE)
  if (direct) return direct[0].toUpperCase()
  // URL with /verify/<certId> path segment
  try {
    const url = new URL(qrData)
    const parts = url.pathname.split('/').filter(Boolean)
    const verifyIdx = parts.indexOf('verify')
    if (verifyIdx !== -1 && parts[verifyIdx + 1]) {
      const candidate = parts[verifyIdx + 1].toUpperCase()
      if (CERT_ID_RE.test(candidate)) return candidate
    }
  } catch { /* not a URL */ }
  return null
}

// ── Text field extractors ─────────────────────────────────────────────────────

function extractCertId(text) {
  const m = text.match(CERT_ID_RE)
  return m ? m[0].toUpperCase() : null
}

// First "real" text line = the university / institution name printed in the header.
function extractIssuedBy(text) {
  const NOISE = /CERTIFICATE|COMPLETION|certify\s+that|successfully|ISSUED|CGPA|USN|Secured|Authorised|Signatory|Scan\s+to|CredentiaX|Polygon|Blockchain/i
  const DECOR = /[✦★•·\*]{2,}/
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(l => l.length > 2)
  for (const line of lines) {
    if (!NOISE.test(line) && !DECOR.test(line)) return line
  }
  return null
}

// Holder name appears between "certify that" and the next structural marker.
function extractHolder(text) {
  const m = text.match(/certify\s+that[\s\r\n]+(.+?)(?:\s*[\r\n]|\s{2,}|USN\s*:|has\s+successfully)/is)
  if (m) return m[1].trim()
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
  const idx = lines.findIndex(l => /certify\s+that/i.test(l))
  if (idx !== -1 && lines[idx + 1]) return lines[idx + 1]
  return null
}

// Course appears immediately after "successfully completed".
function extractCourse(text) {
  const m = text.match(/successfully\s+completed[\s\r\n]+(.+?)(?:[\r\n]|$)/i)
  if (m) return m[1].trim()
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
  const idx = lines.findIndex(l => /successfully\s+completed/i.test(l))
  if (idx !== -1 && lines[idx + 1]) return lines[idx + 1]
  return null
}

// Certificate title: the line AFTER course (only present when title ≠ course).
// We skip it if the line looks like a metadata label (CGPA, ISSUED ON, etc.).
function extractTitle(text, course) {
  const SKIP = /^(CGPA|USN|ISSUED\s+ON|CERTIFICATE\s+ID|ISSUER|Secured|Authorised|Scan)/i
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)

  if (course) {
    // Find the course line, then check what follows
    const courseNorm = course.toLowerCase().slice(0, 20)
    const courseIdx = lines.findIndex(l => l.toLowerCase().startsWith(courseNorm))
    if (courseIdx !== -1) {
      const next = lines[courseIdx + 1]
      if (next && !SKIP.test(next) && next.toLowerCase() !== course.toLowerCase()) {
        return next
      }
    }
  }

  // Fallback: look for a line after "successfully completed" + 1
  const compIdx = lines.findIndex(l => /successfully\s+completed/i.test(l))
  if (compIdx !== -1 && lines[compIdx + 2]) {
    const candidate = lines[compIdx + 2]
    if (!SKIP.test(candidate)) return candidate
  }
  return null
}

function extractAfterLabel(text, labelRe) {
  const m = text.match(new RegExp(labelRe.source + '[\\s:]+([^\\n\\r]{2,80})', 'i'))
  if (m) return m[1].trim()
  const lines = text.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean)
  for (let i = 0; i < lines.length - 1; i++) {
    if (labelRe.test(lines[i])) return lines[i + 1]
  }
  return null
}

function clean(val) {
  if (!val) return null
  const v = val.trim()
  if (v.length < 2) return null
  if (/^0x[0-9a-f]{40,}/i.test(v)) return null  // wallet address
  if (/Secured\s+by|CredentiaX|Polygon|Authorised|Signatory|Scan\s+to/i.test(v)) return null
  return v
}

// Parse all six verification fields from extracted text.
function parseFields(text) {
  const t = text.replace(/\t/g, ' ')

  const holder   = clean(extractHolder(t))
  const course   = clean(extractCourse(t))
  const title    = clean(extractTitle(t, course))
  const issuedBy = clean(extractIssuedBy(t))
  const date     = clean(extractAfterLabel(t, /ISSUED\s+ON/))
  const certId   = extractCertId(t)
  // Legacy extras kept for backward-compat with metaVerifyService
  const usn      = clean(extractAfterLabel(t, /USN/))
  const cgpa     = clean(extractAfterLabel(t, /CGPA/))

  return { certId, holder, course, title, issuedBy, date, usn, cgpa }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function extractFromPDF(buffer) {
  const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS })
  const result = await parser.getText()
  await parser.destroy()
  const text = result.text || ''
  return { method: 'pdf-parse', rawText: text, fields: parseFields(text) }
}

export async function extractFromImage(buffer) {
  const worker = await createWorker('eng', 1, { logger: () => {} })
  try {
    const { data: { text } } = await worker.recognize(buffer)
    return { method: 'ocr', rawText: text, fields: parseFields(text) }
  } finally {
    await worker.terminate()
  }
}

// Auto-detect file type and dispatch to the correct extractor.
export async function extractFromFile(buffer, mimetype, originalName) {
  const mt  = (mimetype || '').toLowerCase()
  const ext = (originalName || '').split('.').pop().toLowerCase()

  const isImage = mt.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)
  const isPDF   = mt === 'application/pdf' || ext === 'pdf'

  if (isPDF)   return extractFromPDF(buffer)
  if (isImage) return extractFromImage(buffer)
  throw new Error(`Unsupported file type: ${mimetype || ext}`)
}
