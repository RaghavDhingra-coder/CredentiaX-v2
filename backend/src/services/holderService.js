import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

const SAFE_HOLDER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  walletAddress: true,
  createdByUniversityId: true,
  createdAt: true,
}

function generateTempPassword() {
  // 12 printable chars: 4-char prefix + 8 random hex chars
  return `Cx-${crypto.randomBytes(5).toString('hex')}`
}

export const holderService = {
  async create({ name, email, walletAddress, createdByUniversityId }) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('An account with this email already exists', 409)

    const tempPassword = generateTempPassword()
    const hashed = await bcrypt.hash(tempPassword, 12)

    const holder = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'HOLDER',
        walletAddress: walletAddress || undefined,
        createdByUniversityId,
      },
      select: SAFE_HOLDER_SELECT,
    })

    // Return the plain-text temp password once — it is never stored in plain text
    return { holder, tempPassword }
  },

  async findAllByCreator(createdByUniversityId) {
    return prisma.user.findMany({
      where: { role: 'HOLDER', createdByUniversityId },
      select: SAFE_HOLDER_SELECT,
      orderBy: { createdAt: 'desc' },
    })
  },

  async findByIdForCreator(id, createdByUniversityId) {
    const holder = await prisma.user.findUnique({
      where: { id },
      select: { ...SAFE_HOLDER_SELECT },
    })
    if (!holder) throw new AppError('Holder not found', 404)
    if (holder.createdByUniversityId !== createdByUniversityId) {
      throw new AppError('Access denied: holder belongs to a different institution', 403)
    }
    return holder
  },
}
