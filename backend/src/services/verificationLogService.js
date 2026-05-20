import prisma from '../config/prisma.js'
import { AppError } from '../utils/AppError.js'

export const verificationLogService = {
  async create({ certificateId, verifierIp, verificationStatus }) {
    return prisma.verificationLog.create({
      data: { certificateId, verifierIp, verificationStatus },
      include: {
        certificate: {
          select: { 
            id: true, 
            certificateId: true, 
            title: true,
            holder: {
              select: { name: true, email: true }
            }
          },
        },
      },
    })
  },

  async findByCertificate(certificateId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit
    const cert = await prisma.certificate.findUnique({ where: { id: certificateId } })
    if (!cert) throw new AppError('Certificate not found', 404)

    const [logs, total] = await Promise.all([
      prisma.verificationLog.findMany({
        where: { certificateId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.verificationLog.count({ where: { certificateId } }),
    ])
    return { logs, total, page, limit }
  },

  async countByCertificate(certificateId) {
    return prisma.verificationLog.count({ where: { certificateId } })
  },
}
