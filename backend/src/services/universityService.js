import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

export const universityService = {
  async create({ universityName, universityCode, walletAddress }) {
    return prisma.university.create({
      data: {
        universityName,
        universityCode: universityCode.toUpperCase(),
        walletAddress,
      },
    })
  },

  async findAll({ page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit
    const [universities, total] = await Promise.all([
      prisma.university.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          universityName: true,
          universityCode: true,
          walletAddress: true,
          isVerified: true,
          createdAt: true,
          _count: { select: { certificates: true } },
        },
      }),
      prisma.university.count(),
    ])
    return { universities, total, page, limit }
  },

  async findById(id) {
    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        _count: { select: { certificates: true } },
      },
    })
    if (!university) throw new AppError('University not found', 404)
    return university
  },

  async findByCode(universityCode) {
    return prisma.university.findUnique({
      where: { universityCode: universityCode.toUpperCase() },
    })
  },

  async verify(id) {
    await this.findById(id)
    return prisma.university.update({
      where: { id },
      data: { isVerified: true },
    })
  },

  async update(id, data) {
    await this.findById(id)
    return prisma.university.update({ where: { id }, data })
  },
}
