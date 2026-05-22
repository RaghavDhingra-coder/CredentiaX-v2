import { GoogleGenerativeAI } from '@google/generative-ai'
import { PDFParse, VerbosityLevel } from 'pdf-parse'
import { fromBuffer } from 'pdf2pic'
import os from 'os'

// ── Prompts ───────────────────────────────────────────────────────────────────

// Used when processing a PDF: Gemini reads extracted text, no vision needed.
const PDF_TEXT_PROMPT = `You are extracting structured data from raw text that was parsed out of a certificate PDF.

Extract these fields and return ONLY valid JSON:
- certificateId: The certificate number. Look for a label like "CERTIFICATE ID" followed by a code like CERT-2026-000019.
- title: The degree or program title (e.g. "be ise", "be cse", "b.tech cse"). This is the line that appears AFTER the course abbreviation. Do NOT use "Certificate of Completion".
- course: The course, branch, or department abbreviation (e.g. "ise", "cse", "aiml", "mca"). It appears right after "has successfully completed".
- holder: The student's FULL NAME (e.g. "John Smith", "Priya Kumar"). It appears right after "This is to certify that". It is NEVER a student ID, roll number, or USN.
- usn: The student's University Seat Number or Roll Number (e.g. "1RV21CS042", "4NI20IS073"). It appears next to a label like "USN" or "Roll No". It is a short alphanumeric code, NOT a person's name.
- issuedBy: The university or institution name. It is usually the very first meaningful line of text. Do NOT use "Certificate of Completion" or "CERTIFICATE OF COMPLETION".
- issueDate: The issue date. Look for a label like "ISSUED ON" followed by the date (e.g. "May 22, 2026").

CRITICAL DISTINCTION — holder vs usn:
- holder = a PERSON'S NAME (words, e.g. "John Smith")
- usn = an ALPHANUMERIC CODE (letters + digits, e.g. "1RV21CS042")
- If you see both a name and a code, put the name in holder and the code in usn.
- Never put a USN/roll number into holder. Never put a name into usn.

Rules:
- Look for these exact label patterns in the text: "CERTIFICATE ID", "ISSUED ON", "has successfully completed", "This is to certify that", "USN", "Roll No".
- issuedBy is the first institution/organization name, never the document type.
- title is the line after the course code (skip if same as course or absent).
- Use null (JSON null, not the string "null") for any field you cannot find.
- Return ONLY raw JSON — no markdown, no explanation.

Return exactly this structure:
{
  "certificateId": null,
  "title": null,
  "course": null,
  "holder": null,
  "usn": null,
  "issuedBy": null,
  "issueDate": null
}`

// Used when processing an image: Gemini Vision reads the image and also decodes the QR.
const IMAGE_PROMPT = `Extract the following fields from this certificate image and return ONLY valid JSON.

CRITICAL — IGNORE completely:
- Browser UI: tabs, address bar, bookmarks bar, browser buttons, scroll bars
- Window title bar, OS taskbar, desktop icons
- WhatsApp UI, messaging app headers, chat bubbles, contact names
- Any text outside the actual certificate document itself
Only read text that is part of the printed certificate document.

Fields:
- certificateId: Certificate number/ID visible on the certificate (e.g. CERT-2026-000019). Look near a label like "CERTIFICATE ID".
- title: The degree or program title printed AFTER the course name (e.g. "be ise", "be cse"). Do NOT use "Certificate of Completion".
- course: The course/branch/department abbreviation in bold (e.g. "ise", "cse", "aiml"). Appears after "has successfully completed".
- holder: The student's FULL NAME (e.g. "John Smith", "Priya Kumar"). Appears after "This is to certify that". It is NEVER a student ID, roll number, or USN code.
- usn: The student's University Seat Number or Roll Number (e.g. "1RV21CS042", "4NI20IS073"). Look near a label like "USN" or "Roll No". It is a short alphanumeric code, NOT a person's name.
- issuedBy: The institution or university name in the certificate header — the large bold text at the very top of the certificate document. Never "Certificate of Completion". Never a browser tab title or window title.
- issueDate: The issue date as printed (e.g. "May 22, 2026"). Look near the label "ISSUED ON".
- qrUrl: Decode the QR code printed on the certificate (usually bottom-right) and report the full URL or text it encodes. This may contain a DIFFERENT certificate ID than what is visible in the text — report exactly what the QR encodes. Set to null if no QR code found.

CRITICAL DISTINCTION — holder vs usn:
- holder = a PERSON'S NAME made of words (e.g. "Priya Kumar")
- usn = an ALPHANUMERIC CODE mixing letters and digits (e.g. "1RV21CS042")
- Never put a USN/roll code into holder. Never put a name into usn.

Rules:
- issuedBy MUST come from the certificate header — never from browser tabs, window titles, or surrounding UI.
- Preserve exact visible values from the certificate.
- Use null (JSON null, not the string "null") for missing fields.
- Return ONLY raw JSON — no markdown, no explanation.

Return exactly this structure:
{
  "certificateId": null,
  "title": null,
  "course": null,
  "holder": null,
  "usn": null,
  "issuedBy": null,
  "issueDate": null,
  "qrUrl": null
}`

// ── Gemini client ─────────────────────────────────────────────────────────────

let _client = null

function getModel() {
  if (!_client) {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY is not set')
    _client = new GoogleGenerativeAI(key)
  }
  return _client.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractJSON(text) {
  try { return JSON.parse(text) } catch {}
  const start = text.indexOf('{')
  const end   = text.lastIndexOf('}')
  if (start !== -1 && end > start) {
    try { return JSON.parse(text.slice(start, end + 1)) } catch {}
  }
  throw new Error('No valid JSON in Gemini response: ' + text.slice(0, 200))
}

function sanitize(val) {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'n/a' || s === '-') return null
  return s
}

function mapParsed(parsed, includeQrUrl = false) {
  const fields = {
    certId:   sanitize(parsed.certificateId),
    title:    sanitize(parsed.title),
    course:   sanitize(parsed.course),
    holder:   sanitize(parsed.holder),
    usn:      sanitize(parsed.usn),
    issuedBy: sanitize(parsed.issuedBy),
    date:     sanitize(parsed.issueDate),
  }
  if (includeQrUrl) fields.qrUrl = sanitize(parsed.qrUrl)
  return fields
}

async function callGemini(content) {
  const model = getModel()
  const result = await model.generateContent(content)
  let raw = result.response.text().trim()
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return extractJSON(raw)
}

// ── PDF → image conversion ────────────────────────────────────────────────────

async function pdfToImageBuffer(pdfBuffer) {
  const convert = fromBuffer(pdfBuffer, {
    density:      200,
    format:       'jpeg',
    savePath:     os.tmpdir(),
    saveFilename: 'cert-' + Date.now(),
  })
  const result = await convert(1, { responseType: 'base64' })
  if (!result?.base64) throw new Error('pdf2pic: no image data returned')
  return Buffer.from(result.base64, 'base64')
}

// ── PDF path: extract text → Gemini text task (fallback) ─────────────────────

async function extractFromPDF(buffer) {
  // Step 1: get raw text from PDF using pdf-parse
  const parser = new PDFParse({ data: buffer, verbosity: VerbosityLevel.ERRORS })
  const result = await parser.getText()
  await parser.destroy()
  const rawText = (result.text || '').trim()

  if (!rawText) throw new Error('pdf-parse returned empty text')

  console.log('[geminiExtract/pdf] raw text (%d chars):\n%s', rawText.length, rawText.slice(0, 600))

  // Step 2: send text to Gemini as a language task (no vision)
  const prompt = PDF_TEXT_PROMPT + '\n\nCERTIFICATE TEXT:\n' + rawText.slice(0, 5000)
  const parsed = await callGemini(prompt)

  const fields = { ...mapParsed(parsed), qrUrl: null }  // QR not available from text
  console.log('[geminiExtract/pdf] extracted fields:', JSON.stringify(fields))
  return fields
}

// ── Image path: send image → Gemini Vision + QR decode ───────────────────────

async function extractFromImage(buffer, mimetype) {
  const parsed = await callGemini([
    IMAGE_PROMPT,
    { inlineData: { data: buffer.toString('base64'), mimeType: mimetype } },
  ])

  const fields = mapParsed(parsed, true)
  console.log('[geminiExtract/image] extracted fields:', JSON.stringify(fields))
  return fields
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Extract the 6 comparison fields from a certificate buffer.
 * PDFs: pdf2pic → JPEG → Gemini Vision (same path as images; fallback: pdf-parse text task)
 * Images: Gemini Vision (includes QR URL decode)
 *
 * Returns { certId, title, course, holder, issuedBy, date, qrUrl }
 */
export async function geminiExtractFields(buffer, mimetype) {
  const mt    = (mimetype || '').toLowerCase()
  const isPDF = mt === 'application/pdf'

  if (isPDF) {
    try {
      const imageBuffer = await pdfToImageBuffer(buffer)
      console.log('[geminiExtract/pdf] converted PDF to JPEG (%d bytes)', imageBuffer.length)
      return extractFromImage(imageBuffer, 'image/jpeg')
    } catch (err) {
      console.warn('[geminiExtract/pdf] pdf2pic failed, falling back to text extraction:', err.message)
      return extractFromPDF(buffer)
    }
  }

  return extractFromImage(buffer, mt || 'image/png')
}
