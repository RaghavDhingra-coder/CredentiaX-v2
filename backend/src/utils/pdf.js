import PDFDocument from 'pdfkit'

// A4 landscape dimensions in PDF points
const W = 841.89
const H = 595.28

// Colour palette
const C = {
  bg:          '#FFFFFF',
  borderOuter: '#4338ca',
  borderInner: '#818cf8',
  headerBg:    '#312e81',
  headerText:  '#FFFFFF',
  headerSub:   '#a5b4fc',
  bodyDark:    '#1e1b4b',
  bodyMid:     '#0f172a',
  bodyLight:   '#334155',
  muted:       '#64748b',
  accent:      '#6366f1',
  divider:     '#e2e8f0',
  brand:       '#94a3b8',
  qrLabel:     '#94a3b8',
}

function centeredText(doc, text, y, opts = {}) {
  doc.text(text, 0, y, { align: 'center', width: W, ...opts })
}

export async function generateCertificatePDF({
  universityName,
  holderName,
  title,
  course,
  description,
  issueDate,
  certificateId,
  issuerWalletAddress,
  qrBuffer,
}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 0, autoFirstPage: true })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end',  () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Background ────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, H).fill(C.bg)

    // ── Outer border ─────────────────────────────────────────────────────────
    doc.rect(18, 18, W - 36, H - 36).lineWidth(3).strokeColor(C.borderOuter).stroke()
    doc.rect(26, 26, W - 52, H - 52).lineWidth(0.75).strokeColor(C.borderInner).stroke()

    // ── Corner ornaments ─────────────────────────────────────────────────────
    const corners = [[32, 32], [W - 32, 32], [32, H - 32], [W - 32, H - 32]]
    corners.forEach(([cx, cy]) => {
      doc.circle(cx, cy, 4).fill(C.borderOuter)
    })

    // ── Header band ──────────────────────────────────────────────────────────
    doc.rect(18, 18, W - 36, 86).fill(C.headerBg)

    doc.font('Helvetica-Bold').fontSize(22).fillColor(C.headerText)
    centeredText(doc, universityName.toUpperCase(), 36)

    doc.font('Helvetica').fontSize(9).fillColor(C.headerSub)
    centeredText(doc, '✦  C E R T I F I C A T E  O F  C O M P L E T I O N  ✦', 68)

    // ── Body ─────────────────────────────────────────────────────────────────

    // "This is to certify that"
    doc.font('Helvetica-Oblique').fontSize(12).fillColor(C.muted)
    centeredText(doc, 'This is to certify that', 128)

    // Holder name
    doc.font('Helvetica-Bold').fontSize(38).fillColor(C.bodyDark)
    centeredText(doc, holderName, 152)

    // Underline name
    const nameBottom = 200
    doc.moveTo(W / 2 - 160, nameBottom).lineTo(W / 2 + 160, nameBottom)
      .lineWidth(1.5).strokeColor(C.accent).stroke()

    // "has successfully completed"
    doc.font('Helvetica-Oblique').fontSize(12).fillColor(C.muted)
    centeredText(doc, 'has successfully completed', 212)

    // Course
    doc.font('Helvetica-Bold').fontSize(20).fillColor(C.bodyMid)
    centeredText(doc, course, 236)

    // Title (if different from course)
    let descriptionY = 268
    if (title && title.trim().toLowerCase() !== course.trim().toLowerCase()) {
      doc.font('Helvetica').fontSize(13).fillColor(C.bodyLight)
      centeredText(doc, title, 266)
      descriptionY = 292
    }

    // Description
    if (description) {
      doc.font('Helvetica-Oblique').fontSize(10).fillColor(C.muted)
      centeredText(doc, description, descriptionY, { width: W - 200 })
    }

    // ── Bottom divider ────────────────────────────────────────────────────────
    const lineY = 358
    doc.moveTo(40, lineY).lineTo(W - 40, lineY)
      .lineWidth(0.75).strokeColor(C.divider).stroke()

    // ── Bottom section ───────────────────────────────────────────────────────
    const bottomTop = lineY + 14

    // Left column — issue date
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted)
    doc.text('ISSUED ON', 60, bottomTop, { characterSpacing: 1 })
    doc.font('Helvetica').fontSize(12).fillColor(C.bodyMid)
    const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
    doc.text(formattedDate, 60, bottomTop + 14)

    // Left column — certificate ID
    doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted)
    doc.text('CERTIFICATE ID', 60, bottomTop + 42, { characterSpacing: 1 })
    doc.font('Helvetica').fontSize(11).fillColor(C.accent)
    doc.text(certificateId, 60, bottomTop + 56)

    // Centre column — issuer wallet
    if (issuerWalletAddress) {
      doc.font('Helvetica-Bold').fontSize(8).fillColor(C.muted)
      doc.text('ISSUER WALLET', W / 2 - 130, bottomTop, { characterSpacing: 1, width: 260 })
      doc.font('Helvetica').fontSize(8).fillColor(C.bodyLight)
      doc.text(issuerWalletAddress, W / 2 - 130, bottomTop + 14, { width: 260 })
    }

    // Centre column — seal line
    doc.moveTo(W / 2 - 60, bottomTop + 80).lineTo(W / 2 + 60, bottomTop + 80)
      .lineWidth(0.5).strokeColor(C.divider).stroke()
    doc.font('Helvetica').fontSize(8).fillColor(C.muted)
    doc.text('Authorised Signatory', W / 2 - 60, bottomTop + 83, { width: 120, align: 'center' })

    // Right column — QR code
    const qrSize = 108
    const qrX = W - 60 - qrSize
    const qrY = bottomTop - 4
    if (qrBuffer) {
      doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize })
    }
    doc.font('Helvetica').fontSize(7.5).fillColor(C.qrLabel)
    doc.text('Scan to verify', qrX, qrY + qrSize + 3, { width: qrSize, align: 'center' })

    // ── Footer brand ─────────────────────────────────────────────────────────
    doc.font('Helvetica').fontSize(7.5).fillColor(C.brand)
    centeredText(doc, 'Secured by CredentiaX  ·  Blockchain-Verified Credential  ·  Powered by Polygon Amoy', H - 28)

    doc.end()
  })
}
