import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { label: 'Verifications Today', value: '0', note: 'Start verifying' },
  { label: 'Total Verified',      value: '0', note: 'Lifetime count' },
  { label: 'Invalid Found',       value: '0', note: 'No fraud detected' },
  { label: 'Network Status',      value: 'Live', note: 'All systems operational', green: true },
]

// ─── Main component ───────────────────────────────────────────────────────────

export default function VerifierDashboard() {
  const { user }   = useAuth()
  const navigate   = useNavigate()

  return (
    <div className="w-full">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Verifier
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Verification Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Verify the authenticity of credentials on the network</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {STATS.map(({ label, value, note, green }) => (
            <div key={label} className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-colors">
              <p className={`text-2xl sm:text-3xl font-bold mb-1 leading-none ${green ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
              <p className="text-xs sm:text-sm font-medium text-white mb-0.5 leading-snug">{label}</p>
              <p className="text-xs text-slate-500 leading-snug">{note}</p>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Verify Certificate card */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-white text-sm sm:text-base">Verify Certificate</h2>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Upload a PDF, PNG, or JPEG — we extract the QR code and check for tampering
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/verify')}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <UploadIcon className="w-4 h-4" />
                Verify Certificate
              </button>
            </div>

            {/* Recent verifications */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800">
                <h2 className="font-semibold text-white text-sm sm:text-base">Recent Verifications</h2>
              </div>
              <div className="px-6 py-10 text-center">
                <p className="text-slate-500 text-sm">No recent verifications</p>
                <p className="text-slate-600 text-xs mt-1">Verification history will appear here</p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-4 sm:gap-5">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-4">My Profile</h2>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <p className="text-center text-white text-sm font-medium">{user?.name}</p>
              <p className="text-center text-slate-400 text-xs mt-0.5">{user?.email}</p>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Role</span>
                  <span className="text-emerald-400 font-medium">Verifier</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-slate-500">Member since</span>
                  <span className="text-slate-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-3">How to Verify</h2>
              <ol className="flex flex-col gap-2.5">
                {[
                  'Click "Verify Certificate" to open the verification page',
                  'Upload the certificate as a PDF, PNG, or JPEG',
                  'The system automatically extracts the embedded QR code',
                  'Certificate fields are compared against the blockchain registry — VALID or TAMPERED result is shown',
                ].map((step, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-xs text-slate-400 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
