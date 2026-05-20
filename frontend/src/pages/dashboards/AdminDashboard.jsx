import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
} from 'recharts'
import api from '../../services/api.js'

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCounter(target, duration = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef(null)
  const start = useRef(null)
  const from  = useRef(0)

  useEffect(() => {
    if (!target && target !== 0) return
    cancelAnimationFrame(frame.current)
    start.current = null
    from.current  = value
    const tick = (ts) => {
      if (!start.current) start.current = ts
      const pct    = Math.min((ts - start.current) / duration, 1)
      const eased  = 1 - Math.pow(1 - pct, 3)
      setValue(Math.round(from.current + (target - from.current) * eased))
      if (pct < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps

  return value
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Sk({ className = '' }) {
  return <div className={`animate-pulse bg-slate-700/50 rounded-xl ${className}`} />
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, note, accent = 'violet', loading, suffix = '' }) {
  const n = useCounter(loading ? 0 : (value ?? 0))
  const cfg = {
    violet:  'border-violet-500/20 text-violet-400',
    emerald: 'border-emerald-500/20 text-emerald-400',
    sky:     'border-sky-500/20 text-sky-400',
    red:     'border-red-500/20 text-red-400',
    amber:   'border-amber-500/20 text-amber-400',
    indigo:  'border-indigo-500/20 text-indigo-400',
  }[accent] ?? 'border-slate-700/60 text-slate-400'

  if (loading) return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/60">
      <Sk className="h-3 w-20 mb-3" /><Sk className="h-8 w-14 mb-2" /><Sk className="h-3 w-28" />
    </div>
  )

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-slate-900 border ${cfg} hover:brightness-110 transition-all`}>
      <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${cfg.split(' ')[1]}`}>{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-white leading-none">{n.toLocaleString()}{suffix}</p>
      {note && <p className="text-xs text-slate-500 mt-1">{note}</p>}
    </div>
  )
}

// ─── Activity row ─────────────────────────────────────────────────────────────
const STATUS_DOT = { true: 'bg-red-400', false: 'bg-emerald-400' }

function RecentCertRow({ cert }) {
  const elapsed = (() => {
    const s = Math.floor((Date.now() - new Date(cert.createdAt)) / 1000)
    if (s < 60)    return `${s}s ago`
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return new Date(cert.createdAt).toLocaleDateString()
  })()

  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
      <span className={`w-2 h-2 rounded-full shrink-0 ${cert.isRevoked ? 'bg-red-400' : 'bg-emerald-400'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{cert.title}</p>
        <p className="text-xs text-slate-500 truncate">
          {cert.holder?.name} · by {cert.issuedByUser?.name}
        </p>
      </div>
      <span className="text-xs text-slate-600 shrink-0">{elapsed}</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
const adminActions = [
  { label: 'Manage Users',        desc: 'View, edit, or remove user accounts',  color: 'indigo' },
  { label: 'Manage Universities', desc: 'Verify or suspend institutions',         color: 'sky' },
  { label: 'Audit Logs',          desc: 'View all system activity',               color: 'violet' },
  { label: 'System Settings',     desc: 'Configure platform parameters',          color: 'slate' },
]

const colorMap = {
  indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/15',
  sky:    'bg-sky-500/10    border-sky-500/20    text-sky-400    hover:bg-sky-500/15',
  violet: 'bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/15',
  slate:  'bg-slate-700/40  border-slate-600/40  text-slate-400  hover:bg-slate-700/60',
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [stats,   setStats]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/analytics/admin')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const s = stats ?? {}
  const gridColor    = '#1e293b'
  const axisColor    = '#475569'
  const tooltipStyle = {
    contentStyle: { background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '8px 12px' },
    labelStyle:   { color: '#94a3b8', fontSize: 11 },
    itemStyle:    { color: '#818cf8', fontSize: 11, fontWeight: 600 },
  }

  return (
    <div className="w-full">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              Admin
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Control Panel</h1>
            <p className="text-slate-400 text-sm mt-0.5">System overview and platform management</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium self-start sm:self-auto">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>Full Access</span>
          </div>
        </div>

        {/* ── System-wide stats ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
          <StatCard loading={loading} label="Universities"         value={s.totalUniversities} note="Registered institutions" accent="violet" />
          <StatCard loading={loading} label="Holders"              value={s.totalHolders}      note="Credential holders"       accent="sky"    />
          <StatCard loading={loading} label="Certificates Issued"  value={s.totalCerts}        note={`${s.activeCerts ?? '—'} active · ${s.revokedCerts ?? '—'} revoked`} accent="indigo" />
          <StatCard loading={loading} label="Total Verifications"  value={s.totalVerifications} note={`${s.successRate ?? '—'}% success rate`} accent="emerald" />
        </div>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard loading={loading} label="Active Credentials" value={s.activeCerts}       note="Not revoked"            accent="emerald" />
          <StatCard loading={loading} label="Revoked"           value={s.revokedCerts}      note="Revoked credentials"    accent="amber"   />
          <StatCard loading={loading} label="Tamper Attempts"   value={s.tamperedDetections} note="Modified PDFs detected" accent="red"     />
          <StatCard loading={loading} label="Verifiers"         value={s.totalVerifiers}    note="Registered verifiers"   accent="violet"  />
        </div>

        {/* ── Main grid ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* Left: Admin actions + issuance chart */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Admin actions */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800">
                <h2 className="font-semibold text-white text-sm sm:text-base">Administration</h2>
              </div>
              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {adminActions.map(({ label, desc, color }) => (
                  <button
                    key={label}
                    type="button"
                    className={`flex flex-col gap-1.5 p-4 rounded-xl border text-left transition-all duration-200 ${colorMap[color]}`}
                  >
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs opacity-70">{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Issuance trend chart */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">System Issuance Trend</h3>
                  <p className="text-xs text-slate-500 mt-0.5">All institutions · Last 14 days</p>
                </div>
              </div>
              {loading ? (
                <div className="animate-pulse bg-slate-700/50 rounded-xl h-40" />
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={s.issuanceTrend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 9 }} tickLine={false} axisLine={false} interval={1} />
                    <YAxis tick={{ fill: axisColor, fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip {...tooltipStyle} formatter={(v) => [v, 'Issued']} />
                    <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#a78bfa', strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent certificates */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800">
                <h3 className="font-semibold text-white text-sm sm:text-base">Recent Certificates</h3>
              </div>
              {loading ? (
                <div className="px-5 py-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b border-slate-800/60 last:border-0">
                      <Sk className="w-2 h-2 rounded-full shrink-0" />
                      <div className="flex-1"><Sk className="h-3 w-2/3 mb-1.5" /><Sk className="h-2.5 w-1/2" /></div>
                      <Sk className="h-2.5 w-12 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : !s.recentCerts?.length ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-slate-500 text-sm">No certificates issued yet</p>
                </div>
              ) : (
                <div className="px-5 py-1">
                  {s.recentCerts.map((cert, i) => <RecentCertRow key={i} cert={cert} />)}
                </div>
              )}
            </div>
          </div>

          {/* Right: Profile + health + verification stats */}
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Admin profile */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-4">Admin Profile</h2>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-violet-500/20">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <p className="text-center text-white text-sm font-medium">{user?.name}</p>
              <p className="text-center text-slate-400 text-xs mt-0.5">{user?.email}</p>
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Role</span>
                  <span className="text-violet-400 font-medium">Administrator</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Access Level</span>
                  <span className="text-emerald-400 font-medium">Full</span>
                </div>
              </div>
            </div>

            {/* Verification breakdown mini */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-3">Platform Verification</h2>
              {loading ? (
                <div className="flex flex-col gap-2">
                  {[...Array(3)].map((_, i) => <Sk key={i} className="h-8 rounded-xl" />)}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {[
                    { label: 'Valid',           value: s.validVerifications, color: 'text-emerald-400', bar: 'bg-emerald-500' },
                    { label: 'Tampered',        value: s.tamperedDetections, color: 'text-red-400',     bar: 'bg-red-500' },
                    { label: 'Total',           value: s.totalVerifications, color: 'text-slate-300',   bar: 'bg-indigo-500' },
                  ].map(({ label, value: v, color, bar }) => (
                    <div key={label} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className={`font-semibold ${color}`}>{(v ?? 0).toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${bar} transition-all duration-700`}
                          style={{ width: s.totalVerifications ? `${Math.round(((v ?? 0) / s.totalVerifications) * 100)}%` : '0%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* System health */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-3">System Health</h2>
              <div className="flex flex-col gap-2">
                {[
                  { label: 'API Server',  status: 'Operational', ok: true },
                  { label: 'Database',    status: 'Connected',   ok: true },
                  { label: 'Analytics',   status: loading ? 'Loading…' : 'Live', ok: !loading },
                  { label: 'Blockchain',  status: 'Pending',     ok: false },
                ].map(({ label, status, ok }) => (
                  <div key={label} className="flex items-center justify-between py-1">
                    <span className="text-xs text-slate-400">{label}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
