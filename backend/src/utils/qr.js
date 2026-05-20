import QRCode from 'qrcode'

export async function generateQRBuffer(text) {
  return QRCode.toBuffer(text, {
    type: 'png',
    width: 220,
    margin: 1,
    color: { dark: '#1e1b4b', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  })
}
