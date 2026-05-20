import { Link } from 'react-router-dom'

/* ─── shared wrapper ─────────────────────────────────────── */
/* max-w-6xl = 72 rem = 1152 px.  On a 1280-px laptop this
   gives ~64 px of breathing room each side before padding. */
function Container({ children, className = '' }) {
  return (
    <div className={`w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 ${className}`}>
      {children}
    </div>
  )
}

/* ─── data ───────────────────────────────────────────────── */
const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: 'Tamper-Proof Credentials',
    description: 'Credentials are stored on-chain and cryptographically secured, making forgery mathematically impossible.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
    title: 'Self-Sovereign Identity',
    description: 'Own your identity data entirely. No central authority, no data brokers — just you and the blockchain.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
    title: 'Instant Verification',
    description: 'Verify any credential in seconds without contacting the issuer. Trustless, real-time, and global.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
      </svg>
    ),
    title: 'Interoperable Network',
    description: 'Connect across institutions, borders, and systems. One identity that works everywhere.',
  },
]

const stats = [
  { value: '100%', label: 'Tamper-Proof' },
  { value: '< 1s',  label: 'Verification Time' },
  { value: '∞',     label: 'Scalable Network' },
  { value: '0',     label: 'Central Authority' },
]

/* ─── page ───────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="flex flex-col w-full">

      {/* ══ Hero ══════════════════════════════════════════ */}
      {/* Gradient lives on the section element itself —
          no absolutely-positioned child that could overflow. */}
      <section
        className="w-full overflow-hidden"
        style={{
          background:
            'radial-gradient(ellipse 100% 55% at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 65%)',
        }}
      >
        <Container className="py-16 sm:py-24 lg:py-32 text-center">
          {/* Badge */}
          <div className="flex justify-center mb-6 sm:mb-8">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              Powered by Blockchain Technology
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight mb-5 sm:mb-6">
            Decentralized Credential
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-sky-400 mt-1 sm:mt-2">
              Verification Network
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Issue, manage, and verify digital credentials on a trustless blockchain
            network. Put identity control back in the hands of individuals.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5 duration-200 text-center"
            >
              Get Started
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-semibold text-sm transition-all hover:-translate-y-0.5 duration-200 text-center"
            >
              View Dashboard
            </Link>
          </div>
        </Container>
      </section>

      {/* ══ Stats strip ═══════════════════════════════════ */}
      <section className="w-full border-y border-slate-800 bg-slate-900/60">
        <Container className="py-10 sm:py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
                <p className="text-xs sm:text-sm text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ══ Features ══════════════════════════════════════ */}
      <section className="w-full">
        <Container className="py-16 sm:py-20 lg:py-24">
          {/* Section header */}
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
              Built for Trust at Scale
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              Every component of CredentiaX is designed with security, privacy, and
              interoperability at its core.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {features.map(({ icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-700/60 hover:border-indigo-500/50 hover:bg-slate-800/70 transition-all duration-200 group"
              >
                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4 group-hover:bg-indigo-500/20 transition-colors shrink-0">
                  {icon}
                </div>
                <h3 className="font-semibold text-white text-sm sm:text-base mb-2">{title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ══ CTA banner ════════════════════════════════════ */}
      <section className="w-full">
        <Container className="pb-16 sm:pb-20 lg:pb-24">
          {/* Card — max-w-4xl keeps it well inside the Container */}
          <div className="max-w-4xl mx-auto rounded-2xl sm:rounded-3xl overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)' }}>
            <div
              className="px-8 py-12 sm:px-12 sm:py-16 text-center"
              style={{
                background:
                  'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 70%)',
              }}
            >
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 leading-snug">
                Ready to take control of your identity?
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base mb-7 sm:mb-8 max-w-md mx-auto leading-relaxed">
                Join the decentralized credential network and experience truly sovereign
                digital identity.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-all shadow-lg hover:-translate-y-0.5 duration-200"
              >
                Create Your Identity
              </Link>
            </div>
          </div>
        </Container>
      </section>

    </div>
  )
}
