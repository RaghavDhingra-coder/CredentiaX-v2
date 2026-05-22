import multer from 'multer'
import { AppError } from '../utils/AppError.js'

const ACCEPTED_MIMETYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

const ACCEPTED_EXTENSIONS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp'])

// Memory storage — buffer lives only for the duration of the request.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB (images can be larger than PDFs)
  fileFilter(_req, file, cb) {
    const ext  = file.originalname.toLowerCase().split('.').pop()
    const ok   = ACCEPTED_MIMETYPES.has(file.mimetype) || ACCEPTED_EXTENSIONS.has(ext)
    ok ? cb(null, true) : cb(new AppError('Only PDF, PNG, JPG, and WEBP files are accepted', 400))
  },
}).single('pdf') // field name kept as "pdf" for backward-compat

export function handleUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 15 MB.'
          : err.message
      return next(new AppError(msg, 400))
    }
    if (err) return next(err)
    if (!req.file) return next(new AppError('No file provided', 400))
    next()
  })
}
