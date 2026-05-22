import prisma from '../config/prisma.js'
import { extractFromFile, scanQRFromBuffer, parseCertIdFromQR } from './extractService.js'
import { geminiExtractFields } from './geminiExtractService.js'
import { verificationLogService } from './verificationLogService.js'
import { formatIssueDate, normalize } from '../utils/certMetadata.js'

const CERT_SELECT = {
  id:                  true,
  certificateId:       true,
  title:               true,
  course:              true,
  description:         true,
  usn:                 true,
  cgpa:                true,
  issueDate:           true,
  pdfHash:             true,
  blockchainTxHash:    true,
  issuerWalletAddress: true,
  isRevoked:           true,
  status:              true,
  chainId:             true,
  blockNumber:         true,
  createdAt:           true,
  holder:       { select: { id: true, name: true, email: true, walletAddress: true } },
  issuedByUser: { select: { id: true, name: true, email: true } },
}

const LOG_STATUS = { VALID: 'VALID', TAMPERED: 'INVALID', REVOKED: 'REVOKED' }

async function safeLog(certDbId, ip, status) {
  if (!certDbId || !LOG_STATUS[status]) return
  try {
    await verificationLogService.create({
      certificateId:      certDbId,
      verifierIp:         ip,
      verificationStatus: LOG_STATUS[status],
    })
  } catch (e) {
    console.warn('[verificationService] log write failed:', e.message)
  }
}

// Core fields used for tamper detection. holder/issuedBy/date excluded — extraction
// is still inconsistent across screenshots and PDFs.
const COMPARE_FIELDS = [
  { key: 'certId', label: 'Certificate ID' },
  { key: 'title',  label: 'Title'          },
  { key: 'course', label: 'Course'         },
]

// Collapse all whitespace (spaces, tabs, newlines, carriage returns) and lowercase.
function norm(value) {
  if (value === null || value === undefined) return null
  const s = String(value).replace(/[\r\n\t]+/g, ' ').trim().replace(/\s+/g, ' ')
  return s.length ? s.toLowerCase() : null
}

function compareFieldSets(qrData, extractedData) {
  const fieldResults = COMPARE_FIELDS.map(({ key, label }) => {
    // Use explicit key access — never index/position based
    const qrRaw        = qrData[key]        ?? null
    const extractedRaw = extractedData[key]  ?? null

    const qrNorm        = norm(qrRaw)
    const extractedNorm = norm(extractedRaw)

    // matched is null (inconclusive) when either side is missing/empty
    let matched = null
    if (qrNorm !== null && extractedNorm !== null) {
      matched = qrNorm === extractedNorm
    }

    return { key, label, qrValue: qrRaw, extractedValue: extractedRaw, matched }
  })

  console.log('[compareFieldSets] qrData:',       JSON.stringify(qrData))
  console.log('[compareFieldSets] extractedData:', JSON.stringify(extractedData))
  console.log('[compareFieldSets] fieldResults:',  JSON.stringify(fieldResults))

  const anyMismatch     = fieldResults.some(f => f.matched === false)
  const anyInconclusive = fieldResults.some(f => f.matched === null)
  const allMatched      = fieldResults.every(f => f.matched === true)

  return { fieldResults, anyMismatch, anyInconclusive, allMatched }
}

function notFound(extractionMethod, qrFound = false) {
  return { status: 'NOT_FOUND', certificate: null, qrData: null, extractedData: null, fieldResults: [], qrFound, extractionMethod }
}

export const verificationService = {
  /**
   * Verify a certificate file (PDF or image) by:
   *  1. Extracting visible text (PDF text extraction or OCR)
   *  2. Scanning the embedded QR code (images) to get the authoritative cert ID
   *  3. Looking up the cert in the database → "QR / Registry data"
   *  4. Comparing the 6 key fields (certId, title, course, holder, issuedBy, date)
   *     between the registry record and what was extracted from the certificate image/text
   *
   * Returns {
   *   status: VALID | TAMPERED | REVOKED | NOT_FOUND,
   *   certificate,
   *   qrData:       { certId, title, course, holder, issuedBy, date },
   *   extractedData:{ certId, title, course, holder, issuedBy, date },
   *   fieldResults: [{ key, label, qrValue, extractedValue, matched }],
   *   qrFound: boolean,
   *   extractionMethod: 'pdf-parse' | 'ocr' | null,
   * }
   */
  async verifyByUpload({ buffer, mimetype, originalName, manualCertId, ip }) {
    const mt    = (mimetype || '').toLowerCase()
    const ext   = (originalName || '').split('.').pop().toLowerCase()
    const isImg = mt.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)

    // ── Step 1: Extract certificate fields via Gemini AI ─────────────────────
    let textFields = null
    let extractionMethod = 'gemini'

    try {
      textFields = await geminiExtractFields(buffer, mimetype)
    } catch (err) {
      console.warn('[verificationService] Gemini extraction failed, falling back to OCR/PDF:', err.message)
      try {
        const fallback = await extractFromFile(buffer, mimetype, originalName)
        textFields       = fallback.fields
        extractionMethod = fallback.method
      } catch (err2) {
        console.warn('[verificationService] fallback extraction failed:', err2.message)
        return notFound(null)
      }
    }

    // ── Step 2: Obtain authoritative cert ID from QR (preferred) or visible text ──
    // Priority: (1) Gemini-decoded QR URL — works for both PDF and image
    //           (2) jsQR binary scan — images only, catches cases Gemini misses
    //           (3) Visible text cert ID from Gemini — fallback when no QR found
    //           (4) Caller-supplied hint / filename
    let certId  = null
    let qrFound = false

    // 1. Gemini QR decode (PDF + image)
    if (textFields.qrUrl) {
      const id = parseCertIdFromQR(textFields.qrUrl)
      if (id) { certId = id; qrFound = true }
    }

    // 2. jsQR binary scan (images only — backup when Gemini couldn't decode the QR)
    if (!certId && isImg) {
      const raw = await scanQRFromBuffer(buffer)
      const id  = parseCertIdFromQR(raw)
      if (id) { certId = id; qrFound = true }
    }

    // 3. Visible text cert ID from Gemini
    if (!certId) certId = textFields.certId || null

    // 4. Caller hint / filename
    if (!certId) certId = manualCertId?.trim().toUpperCase() || null
    if (!certId) {
      const m = (originalName || '').match(/CERT-\d{4}-\d+/i)
      if (m) certId = m[0].toUpperCase()
    }

    console.log('[verificationService] certId=%s qrFound=%s qrUrl=%s', certId, qrFound, textFields.qrUrl)

    if (!certId) return notFound(extractionMethod, false)

    // ── Step 3: DB lookup ─────────────────────────────────────────────────────
    const cert = await prisma.certificate.findUnique({
      where: { certificateId: certId },
      select: CERT_SELECT,
    })

    if (!cert) return notFound(extractionMethod, qrFound)

    if (cert.isRevoked) {
      await safeLog(cert.id, ip, 'REVOKED')
      return { status: 'REVOKED', certificate: cert, qrData: null, extractedData: null, fieldResults: [], qrFound, extractionMethod }
    }

    // ── Step 4: Build authoritative QR / registry data (from DB) ─────────────
    const qrData = {
      certId:   cert.certificateId,
      title:    cert.title              || null,
      course:   cert.course             || null,
      holder:   cert.holder?.name       || null,
      issuedBy: cert.issuedByUser?.name || null,
      date:     cert.issueDate ? formatIssueDate(cert.issueDate) : null,
    }

    // ── Step 5: Build extracted data (from Gemini AI extraction) ─────────────
    const extractedData = {
      certId:   textFields.certId   || null,
      title:    textFields.title    || null,
      course:   textFields.course   || null,
      holder:   textFields.holder   || null,
      issuedBy: textFields.issuedBy || null,
      date:     textFields.date     || null,
    }

    // ── Step 6: Field-by-field comparison ─────────────────────────────────────
    const comparison = compareFieldSets(qrData, extractedData)
    const status = comparison.anyMismatch ? 'TAMPERED' : 'VALID'
    await safeLog(cert.id, ip, status)

    return {
      status,
      certificate:     cert,
      qrData,
      extractedData,
      fieldResults:    comparison.fieldResults,
      allMatched:      comparison.allMatched,
      anyMismatch:     comparison.anyMismatch,
      anyInconclusive: comparison.anyInconclusive,
      qrFound,
      extractionMethod,
    }
  },
}
