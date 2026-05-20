import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

export const userService = {
  async create({ name, email, password, role, walletAddress }) {
    return prisma.user.create({
      data: { name, email, password, role, walletAddress },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    })
  },

  async findAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          walletAddress: true,
          createdAt: true,
        },
      }),
      prisma.user.count(),
    ])
    return { users, total, page, limit }
  },

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
      },
    })
    if (!user) throw new AppError('User not found', 404)
    return user
  },

  async findByEmail(email) {
    return prisma.user.findUnique({ where: { email } })
  },

  async update(id, data) {
    await this.findById(id) // throws 404 if not found
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletAddress: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  },

  async delete(id) {
    await this.findById(id)
    await prisma.user.delete({ where: { id } })
  },
}
