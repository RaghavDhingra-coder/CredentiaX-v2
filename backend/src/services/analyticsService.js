import prisma from '../config/prisma.js'

// Build a map of { 'YYYY-MM-DD': 0 } for the last N days
function buildDateBuckets(days) {
  const buckets = {}
  const now = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    buckets[d.toISOString().slice(0, 10)] = 0
  }
  return buckets
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export const analyticsService = {
  // ── University-scoped analytics ─────────────────────────────────────────────
  async getUniversityStats(universityUserId) {
    // Collect certificate IDs for this university (needed for log queries)
    const certRows = await prisma.certificate.findMany({
      where:  { issuedByUserId: universityUserId },
      select: { id: true, createdAt: true },
    })
    const certIds = certRows.map((c) => c.id)

    // ── Run all counts + trend queries in parallel ───────────────────────────
    const [
      totalCerts,
      activeCerts,
      revokedCerts,
      totalHolders,
      verGrouped,
      recentCerts,
      recentHolders,
      recentVerifications,
    ] = await Promise.all([
      prisma.certificate.count({ where: { issuedByUserId: universityUserId } }),
      prisma.certificate.count({ where: { issuedByUserId: universityUserId, isRevoked: false } }),
      prisma.certificate.count({ where: { issuedByUserId: universityUserId, isRevoked: true } }),

      prisma.user.count({
        where: { createdByUniversityId: universityUserId, role: 'HOLDER' },
      }),

      // Verification breakdown
      certIds.length
        ? prisma.verificationLog.groupBy({
            by:    ['verificationStatus'],
            where: { certificateId: { in: certIds } },
            _count: { verificationStatus: true },
          })
        : [],

      // Recent 6 certificates for the panel
      prisma.certificate.findMany({
        where:   { issuedByUserId: universityUserId },
        orderBy: { createdAt: 'desc' },
        take:    6,
        select: {
          id: true, certificateId: true, title: true, course: true,
          isRevoked: true, blockchainTxHash: true, createdAt: true,
          holder: { select: { name: true, email: true } },
        },
      }),

      // Recent 6 holders for activity feed
      prisma.user.findMany({
        where:   { createdByUniversityId: universityUserId, role: 'HOLDER' },
        orderBy: { createdAt: 'desc' },
        take:    6,
        select:  { id: true, name: true, email: true, createdAt: true },
      }),

      // Recent 6 verification events on this university's certs
      certIds.length
        ? prisma.verificationLog.findMany({
            where:   { certificateId: { in: certIds } },
            orderBy: { createdAt: 'desc' },
            take:    6,
            select: {
              id: true, verificationStatus: true, verifierIp: true, createdAt: true,
              certificate: { select: { certificateId: true, title: true } },
            },
          })
        : [],
    ])

    // ── Verification stats map ──────────────────────────────────────────────
    const verStats = { VALID: 0, INVALID: 0, REVOKED: 0, NOT_FOUND: 0 }
    verGrouped.forEach((row) => {
      verStats[row.verificationStatus] = row._count.verificationStatus
    })
    const totalVerifications = Object.values(verStats).reduce((a, b) => a + b, 0)
    const verSuccessRate = totalVerifications
      ? Math.round((verStats.VALID / totalVerifications) * 100)
      : 0

    // ── Issuance trend: last 30 days, grouped by date ──────────────────────
    const buckets = buildDateBuckets(30)
    certRows.forEach((c) => {
      const key = c.createdAt.toISOString().slice(0, 10)
      if (key in buckets) buckets[key]++
    })
    const issuanceTrend = Object.entries(buckets).map(([date, count]) => ({
      date:  date.slice(5), // MM-DD
      count,
    }))

    // ── Pie data ────────────────────────────────────────────────────────────
    const verificationBreakdown = [
      { name: 'Valid',     value: verStats.VALID,     color: '#22c55e' },
      { name: 'Tampered',  value: verStats.INVALID,   color: '#ef4444' },
      { name: 'Revoked',   value: verStats.REVOKED,   color: '#f59e0b' },
      { name: 'Not Found', value: verStats.NOT_FOUND, color: '#475569' },
    ].filter((d) => d.value > 0)

    // ── Activity feed (merged, sorted newest-first) ─────────────────────────
    const activityFeed = [
      ...recentCerts.map((c) => ({
        type:          'CERTIFICATE_ISSUED',
        timestamp:     c.createdAt,
        certificateId: c.certificateId,
        title:         c.title,
        holderName:    c.holder?.name,
        isRevoked:     c.isRevoked,
      })),
      ...recentHolders.map((h) => ({
        type:       'HOLDER_CREATED',
        timestamp:  h.createdAt,
        holderName: h.name,
        email:      h.email,
      })),
      ...recentVerifications.map((v) => ({
        type:          'VERIFICATION',
        timestamp:     v.createdAt,
        certificateId: v.certificate?.certificateId,
        certTitle:     v.certificate?.title,
        status:        v.verificationStatus,
        verifierIp:    v.verifierIp,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)

    return {
      stats: {
        totalCerts,
        activeCerts,
        revokedCerts,
        totalHolders,
        totalVerifications,
        validVerifications:  verStats.VALID,
        tamperedDetections:  verStats.INVALID,
        revokedChecks:       verStats.REVOKED,
        notFoundChecks:      verStats.NOT_FOUND,
        verSuccessRate,
      },
      verificationBreakdown,
      issuanceTrend,
      activityFeed,
      recentCerts,
    }
  },

  // ── Admin-scoped system-wide analytics ─────────────────────────────────────
  async getAdminStats() {
    const [
      totalUniversities,
      totalHolders,
      totalVerifiers,
      totalCerts,
      activeCerts,
      revokedCerts,
      totalVerifications,
      tamperedDetections,
      validVerifications,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'UNIVERSITY' } }),
      prisma.user.count({ where: { role: 'HOLDER'     } }),
      prisma.user.count({ where: { role: 'VERIFIER'   } }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { isRevoked: false } }),
      prisma.certificate.count({ where: { isRevoked: true  } }),
      prisma.verificationLog.count(),
      prisma.verificationLog.count({ where: { verificationStatus: 'INVALID'  } }),
      prisma.verificationLog.count({ where: { verificationStatus: 'VALID'    } }),
    ])

    // System-wide issuance trend (last 14 days)
    const systemCerts = await prisma.certificate.findMany({
      where:  { createdAt: { gte: daysAgo(14) } },
      select: { createdAt: true },
    })
    const buckets = buildDateBuckets(14)
    systemCerts.forEach((c) => {
      const key = c.createdAt.toISOString().slice(0, 10)
      if (key in buckets) buckets[key]++
    })
    const issuanceTrend = Object.entries(buckets).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }))

    const successRate = totalVerifications
      ? Math.round((validVerifications / totalVerifications) * 100)
      : 0

    // Recent system-wide activity
    const recentCerts = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        certificateId: true, title: true, isRevoked: true, createdAt: true,
        holder:       { select: { name: true } },
        issuedByUser: { select: { name: true } },
      },
    })

    return {
      totalUniversities,
      totalHolders,
      totalVerifiers,
      totalCerts,
      activeCerts,
      revokedCerts,
      totalVerifications,
      tamperedDetections,
      validVerifications,
      successRate,
      issuanceTrend,
      recentCerts,
    }
  },
}
