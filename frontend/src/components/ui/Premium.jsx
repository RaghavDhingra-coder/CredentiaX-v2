import { motion } from 'framer-motion'
import { cardHover, reveal } from './motion.js'

export function PageSurface({ children, className = '' }) {
  return (
    <motion.div
      variants={reveal}
      initial="initial"
      animate="animate"
      className={`cx-bg min-h-screen w-full ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function PremiumCard({ children, className = '', hover = true }) {
  return (
    <motion.div
      variants={reveal}
      {...(hover ? cardHover : {})}
      className={`glass-card rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function SoftCard({ children, className = '', hover = false }) {
  return (
    <motion.div
      variants={reveal}
      {...(hover ? cardHover : {})}
      className={`glass-card-soft rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function GlowBadge({ children, tone = 'indigo', className = '' }) {
  const tones = {
    indigo: 'bg-indigo-500/10 border-indigo-400/25 text-indigo-300 shadow-indigo-500/20',
    sky: 'bg-sky-500/10 border-sky-400/25 text-sky-300 shadow-sky-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-400/25 text-emerald-300 shadow-emerald-500/20',
    violet: 'bg-violet-500/10 border-violet-400/25 text-violet-300 shadow-violet-500/20',
    red: 'bg-red-500/10 border-red-400/25 text-red-300 shadow-red-500/20',
    amber: 'bg-amber-500/10 border-amber-400/25 text-amber-300 shadow-amber-500/20',
  }

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium shadow-lg ${tones[tone] ?? tones.indigo} ${className}`}>
      {children}
    </span>
  )
}

export function AnimatedStat({ value, label, note, tone = 'indigo' }) {
  const tones = {
    indigo: 'from-indigo-400 to-sky-300 text-indigo-300',
    emerald: 'from-emerald-300 to-teal-200 text-emerald-300',
    sky: 'from-sky-300 to-cyan-200 text-sky-300',
    violet: 'from-violet-300 to-fuchsia-200 text-violet-300',
    red: 'from-red-300 to-rose-200 text-red-300',
  }
  const toneClass = tones[tone] ?? tones.indigo

  return (
    <PremiumCard className="p-4 sm:p-5 overflow-hidden">
      <div className="relative">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-white/5 blur-2xl" />
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 160, damping: 18 }}
          className={`bg-gradient-to-r ${toneClass} bg-clip-text text-2xl sm:text-3xl font-bold leading-none text-transparent`}
        >
          {value}
        </motion.p>
        <p className="mt-2 text-xs sm:text-sm font-semibold text-white">{label}</p>
        {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
      </div>
    </PremiumCard>
  )
}
