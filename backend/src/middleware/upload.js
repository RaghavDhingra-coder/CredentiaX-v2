import multer from 'multer'
import { AppError } from '../utils/AppError.js'

// Memory storage — buffer lives only for the duration of the request;
// no temp file is ever written to disk (satisfies the "delete after verify" requirement).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter(_req, file, cb) {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf')
    ok ? cb(null, true) : cb(new AppError('Only PDF files are accepted', 400))
  },
}).single('pdf')

export function handleUpload(req, res, next) {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'File too large. Maximum size is 10 MB.'
          : err.message
      return next(new AppError(msg, 400))
    }
    if (err) return next(err)
    if (!req.file) return next(new AppError('No PDF file provided', 400))
    next()
  })
}
