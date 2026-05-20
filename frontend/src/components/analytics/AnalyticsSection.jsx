import { useEffect, useRef, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import api from '../../services/api.js'

// ─── Animated counter hook ────────────────────────────────────────────────────
function useAnimatedCounter(target, duration = 900) {
  const [value, setValue]  = useState(0)
  const frameRef           = useRef(null)
  const startRef           = useRef(null)
  const fromRef            = useRef(0)

  useEffect(() => {
    if (target === undefined || target === null) return
    cancelAnimationFrame(frameRef.current)
    startRef.current = null
    fromRef.current  = value

    function tick(ts) {
      if (!startRef.current) startRef.current = ts
      const pct    = Math.min((ts - startRef.current) / duration, 1)
      const eased  = 1 - Math.pow(1 - pct, 3)       // ease-out cubic
      const current = Math.round(fromRef.current + (target - fromRef.current) * eased)
      setValue(current)
      if (pct < 1) frameRef.current = requestAnimationFrame(tick)
    }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  return value
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded-xl ${className}`} />
}

// ─── Recharts custom tooltip ──────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ─── Stat card with animated counter ─────────────────────────────────────────
function StatCard({ label, value, note, accent = 'indigo', icon, loading, suffix = '' }) {
  const displayed = useAnimatedCounter(loading ? 0 : (value ?? 0))

  const accents = {
    indigo:  { ring: 'border-indigo-500/20',  text: 'text-indigo-400',  icon: 'bg-indigo-500/10' },
    emerald: { ring: 'border-emerald-500/20', text: 'text-emerald-400', icon: 'bg-emerald-500/10' },
    red:     { ring: 'border-red-500/20',     text: 'text-red-400',     icon: 'bg-red-500/10' },
    amber:   { ring: 'border-amber-500/20',   text: 'text-amber-400',   icon: 'bg-amber-500/10' },
    sky:     { ring: 'border-sky-500/20',     text: 'text-sky-400',     icon: 'bg-sky-500/10' },
    slate:   { ring: 'border-slate-600/40',   text: 'text-slate-400',   icon: 'bg-slate-700/50' },
  }
  const a = accents[accent] ?? accents.indigo

  if (loading) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/60">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border ${a.ring} hover:brightness-110 transition-all duration-200 group`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`text-xs font-medium ${a.text} uppercase tracking-wide`}>{label}</p>
        {icon && (
          <div className={`w-7 h-7 rounded-lg ${a.icon} flex items-center justify-center ${a.text}`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl sm:text-3xl font-bold text-white leading-none">
        {displayed.toLocaleString()}{suffix}
      </p>
      {note && <p className="text-xs text-slate-500 mt-1 leading-snug">{note}</p>}
    </div>
  )
}

// ─── Activity item ────────────────────────────────────────────────────────────
const ACTIVITY_META = {
  CERTIFICATE_ISSUED: {
    dot:   'bg-indigo-400',
    label: (a) => `Issued "${a.title}"`,
    sub:   (a) => a.holderName ? `to ${a.holderName}` : '',
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </svg>
    ),
  },
  HOLDER_CREATED: {
    dot:   'bg-sky-400',
    label: (a) => `Holder added: ${a.holderName}`,
    sub:   (a) => a.email,
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
      </svg>
    ),
  },
  VERIFICATION: {
    VALID:     { dot: 'bg-emerald-400', label: (a) => `Verified: ${a.certTitle || a.certificateId}`, sub: () => 'Valid credential' },
    INVALID:   { dot: 'bg-red-400',    label: (a) => `Tampering detected on ${a.certTitle || a.certificateId}`, sub: () => 'Hash mismatch' },
    REVOKED:   { dot: 'bg-amber-400',  label: (a) => `Revoked cert checked: ${a.certTitle || a.certificateId}`, sub: () => 'Credential revoked' },
    NOT_FOUND: { dot: 'bg-slate-500',  label: (a) => `Unknown cert lookup`, sub: () => 'Not found' },
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
}

function ActivityItem({ item }) {
  const meta = ACTIVITY_META[item.type]
  if (!meta) return null

  let dot, labelText, subText, icon
  if (item.type === 'VERIFICATION') {
    const sub = meta[item.status] ?? meta.NOT_FOUND
    dot       = sub.dot
    labelText = sub.label(item)
    subText   = sub.sub(item)
    icon      = meta.icon
  } else {
    dot       = meta.dot
    labelText = meta.label(item)
    subText   = meta.sub(item)
    icon      = meta.icon
  }

  const elapsed = (() => {
    const secs = Math.floor((Date.now() - new Date(item.timestamp)) / 1000)
    if (secs < 60)   return `${secs}s ago`
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return new Date(item.timestamp).toLocaleDateString()
  })()

  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-800/60 last:border-0 group">
      <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-200 leading-snug truncate">{labelText}</p>
        {subText && <p className="text-xs text-slate-500 mt-0.5 truncate">{subText}</p>}
      </div>
      <span className="text-xs text-slate-600 shrink-0">{elapsed}</span>
    </div>
  )
}

// ─── Main analytics section ───────────────────────────────────────────────────
export default function AnalyticsSection() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    api.get('/analytics/university')
      .then(({ data: res }) => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const s = data?.stats ?? {}

  // ── Verification Pie chart colours ─────────────────────────────────────────
  const pieData = data?.verificationBreakdown ?? []

  // ── Recharts dark theme constants ─────────────────────────────────────────
  const gridColor   = '#1e293b'
  const axisColor   = '#475569'
  const tooltipStyle = {
    contentStyle: { background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '8px 12px' },
    labelStyle:   { color: '#94a3b8', fontSize: 11 },
    itemStyle:    { color: '#818cf8', fontSize: 11, fontWeight: 600 },
  }

  if (error) return null // Non-critical — fail silently

  return (
    <div className="flex flex-col gap-5 sm:gap-6">

      {/* ── Divider ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Analytics & Insights</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      {/* ── Stats row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          loading={loading}
          label="Total Verifications"
          value={s.totalVerifications}
          note={s.verSuccessRate != null ? `${s.verSuccessRate}% success rate` : undefined}
          accent="indigo"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label="Valid Verifications"
          value={s.validVerifications}
          note="Authentic credentials confirmed"
          accent="emerald"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label="Tampering Detected"
          value={s.tamperedDetections}
          note="Modified PDFs caught"
          accent="red"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          }
        />
        <StatCard
          loading={loading}
          label="Success Rate"
          value={s.verSuccessRate}
          note="Valid vs total checks"
          accent="sky"
          suffix="%"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
            </svg>
          }
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">

        {/* Line chart — issuance trend */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Certificate Issuance</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 30 days</p>
            </div>
            {!loading && data && (
              <span className="text-xs text-indigo-400 font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                {s.totalCerts} total
              </span>
            )}
          </div>

          {loading ? (
            <Skeleton className="h-44" />
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data?.issuanceTrend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: axisColor, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fill: axisColor, fontSize: 9 }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Issued']} />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Certificates"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut chart — verification breakdown */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Verification Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">All-time outcomes</p>
          </div>

          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-36 rounded-full w-36 mx-auto" />
              <Skeleton className="h-3 w-28 mx-auto mt-2" />
            </div>
          ) : pieData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 gap-2">
              <svg className="w-8 h-8 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="text-slate-600 text-xs text-center">No verifications yet</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '6px 10px', fontSize: 11 }}
                  itemStyle={{ color: '#cbd5e1' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  formatter={(v) => <span style={{ color: '#64748b', fontSize: 10 }}>{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Activity feed + Recent certs ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">

        {/* Activity feed */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-semibold text-white">Live Activity Feed</h3>
          </div>

          {loading ? (
            <div className="px-5 py-2 flex flex-col gap-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
                  <Skeleton className="w-2 h-2 rounded-full shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-3 w-3/4 mb-1.5" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                  <Skeleton className="h-2.5 w-12 shrink-0" />
                </div>
              ))}
            </div>
          ) : !data?.activityFeed?.length ? (
            <div className="px-6 py-10 text-center">
              <p className="text-slate-500 text-sm">No recent activity</p>
              <p className="text-slate-600 text-xs mt-1">Activity will appear here as events occur</p>
            </div>
          ) : (
            <div className="px-5 py-1">
              {data.activityFeed.map((item, i) => (
                <ActivityItem key={i} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Recent certificates */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Recently Issued</h3>
          </div>

          {loading ? (
            <div className="px-5 py-2 flex flex-col gap-1">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
                  <div className="flex-1">
                    <Skeleton className="h-3 w-2/3 mb-1.5" />
                    <Skeleton className="h-2.5 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-lg" />
                </div>
              ))}
            </div>
          ) : !data?.recentCerts?.length ? (
            <div className="px-6 py-10 text-center">
              <p className="text-slate-500 text-sm">No certificates issued yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {data.recentCerts.map((cert) => (
                <div key={cert.id} className="px-5 py-3 flex items-center gap-3 hover:bg-slate-800/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">{cert.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {cert.holder?.name} · <span className="font-mono">{cert.certificateId}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cert.isRevoked ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                        Revoked
                      </span>
                    ) : cert.blockchainTxHash ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        On-chain
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        Active
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => window.open(`/api/v1/certificates/file/${cert.certificateId}`, '_blank')}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Download PDF"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
