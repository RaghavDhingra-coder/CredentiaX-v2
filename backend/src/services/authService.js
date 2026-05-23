import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'
import { config } from '../config/env.js'
import { AppError } from '../utils/AppError.js'
import { institutionVerificationService } from './institutionVerificationService.js'

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  walletAddress: true,
  createdByUniversityId: true,
  createdAt: true,
}

function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

export const authService = {
  async register({ name, email, password, role }) {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new AppError('An account with this email already exists', 409)

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
      select: SAFE_USER_SELECT,
    })

    const token = signToken({ id: user.id, role: user.role })
    return { user, token }
  },

  async login({ email, password }) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) throw new AppError('Invalid email or password', 401)

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) throw new AppError('Invalid email or password', 401)

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      walletAddress: user.walletAddress,
      createdByUniversityId: user.createdByUniversityId,
      createdAt: user.createdAt,
    }

    const token = signToken({ id: safeUser.id, role: safeUser.role })
    return { user: await institutionVerificationService.enrichUser(safeUser), token }
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwtSecret)
    } catch (err) {
      if (err.name === 'TokenExpiredError') throw new AppError('Session expired, please log in again', 401)
      throw new AppError('Invalid token', 401)
    }
  },

  async getCurrentUser(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    })
    if (!user) throw new AppError('User not found', 404)
    return institutionVerificationService.enrichUser(user)
  },

  async updateWallet(id, walletAddress) {
    const current = await prisma.user.findUnique({
      where: { id },
      select: { role: true, walletAddress: true },
    })
    const nextWallet = walletAddress ? walletAddress.toLowerCase() : null
    const walletChanged = current?.walletAddress?.toLowerCase() !== nextWallet

    // Skip write if nothing changed
    if (!walletChanged) {
      const user = await prisma.user.findUnique({ where: { id }, select: SAFE_USER_SELECT })
      return institutionVerificationService.enrichUser(user)
    }

    // Check if the new wallet is already claimed by another user (case-insensitive)
    if (nextWallet) {
      const [existing] = await prisma.$queryRaw`
        SELECT id FROM users WHERE LOWER("walletAddress") = ${nextWallet} AND id != ${id} LIMIT 1
      `
      if (existing) {
        throw new AppError('This wallet address is already registered to another account', 409)
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: { walletAddress: nextWallet },
      select: SAFE_USER_SELECT,
    })
    if (current?.role === 'UNIVERSITY') {
      await institutionVerificationService.resetForWalletChange(id)
    }
    return institutionVerificationService.enrichUser(user)
  },
}
