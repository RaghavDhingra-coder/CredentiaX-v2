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

function BanIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  )
}

function QuestionMarkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
  )
}

function CameraIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  )
}

function CubeIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  )
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  VALID: {
    border: 'border-emerald-500/30', headerBg: 'bg-emerald-500/8',
    headerBorder: 'border-emerald-500/20', iconBg: 'bg-emerald-500/15 border-emerald-500/25',
    iconColor: 'text-emerald-400', titleColor: 'text-emerald-400',
    badge: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-400',
    Icon: ShieldCheckIcon, title: 'Credential Verified',
    subtitle: 'This credential is authentic and has not been tampered with.',
  },
  REVOKED: {
    border: 'border-amber-500/30', headerBg: 'bg-amber-500/8',
    headerBorder: 'border-amber-500/20', iconBg: 'bg-amber-500/15 border-amber-500/25',
    iconColor: 'text-amber-400', titleColor: 'text-amber-400',
    badge: 'bg-amber-500/10 border-amber-500/20 text-amber-400', dot: 'bg-amber-400',
    Icon: BanIcon, title: 'Credential Revoked',
    subtitle: 'This credential has been revoked by the issuing institution.',
  },
  NOT_FOUND: {
    border: 'border-slate-700', headerBg: 'bg-slate-800/60',
    headerBorder: 'border-slate-700', iconBg: 'bg-slate-700/60 border-slate-600',
    iconColor: 'text-slate-500', titleColor: 'text-slate-300',
    badge: 'bg-slate-700 border-slate-600 text-slate-400', dot: 'bg-slate-500',
    Icon: QuestionMarkIcon, title: 'Credential Not Found',
    subtitle: 'No credential with this ID exists in the registry.',
  },
}

// ─── Result card ──────────────────────────────────────────────────────────────

function Row({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-800 last:border-0 gap-0.5 sm:gap-3">
      <span className="text-xs text-slate-500 sm:w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-200 break-all">{children}</span>
    </div>
  )
}

function chainLabel(chainId) {
  if (!chainId) return null
  const id = Number(chainId)
  if (id === 31337) return 'Hardhat Local'
  if (id === 80002) return 'Polygon Amoy'
  if (id === 137)   return 'Polygon Mainnet'
  return `Chain ${id}`
}

function issuerIsVerified(cert) {
  const approvedWallet = cert?.issuedByUser?.walletAddress?.toLowerCase()
  const certificateWallet = cert?.issuerWalletAddress?.toLowerCase()
  return cert?.issuedByUser?.verificationStatus === 'VERIFIED'
    && approvedWallet
    && certificateWallet
    && approvedWallet === certificateWallet
}

function ResultCard({ result, onReset }) {
  const status = result.found ? (result.cert?.isRevoked ? 'REVOKED' : 'VALID') : 'NOT_FOUND'
  const cfg  = STATUS_CONFIG[status]
  const cert = result.cert
  const chain = chainLabel(cert?.chainId)

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden shadow-lg mt-4`}>

      {/* Header */}
      <div className={`px-5 py-4 ${cfg.headerBg} border-b ${cfg.headerBorder} flex items-center gap-3`}>
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
          <cfg.Icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-bold text-sm ${cfg.titleColor}`}>{cfg.title}</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {status}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{cfg.subtitle}</p>
        </div>
      </div>

      {/* Certificate details */}
      {cert && (
        <div className="px-5 py-1">
          <Row label="Certificate ID"><span className="font-mono text-indigo-300">{cert.certificateId}</span></Row>
          <Row label="Title">{cert.title}</Row>
          <Row label="Course">{cert.course}</Row>
          <Row label="Holder">{cert.holder?.name} <span className="text-slate-500">({cert.holder?.email})</span></Row>
          <Row label="Issued by">
            <span className="inline-flex items-center gap-2 flex-wrap">
              {cert.issuedByUser?.name}
              <span className={`inline-flex text-xs px-2 py-0.5 rounded-full border ${
                issuerIsVerified(cert)
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                {issuerIsVerified(cert) ? 'Verified Institution' : 'Unverified Institution'}
              </span>
            </span>
          </Row>
          <Row label="Issue Date">
            {new Date(cert.issueDate || cert.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Row>
        </div>
      )}

      {/* Blockchain proof panel */}
      {cert && (cert.blockchainTxHash || cert.chainId) && (
        <div className="mx-5 mb-4 rounded-xl bg-slate-800/50 border border-slate-700/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700/60 flex items-center gap-2">
            <CubeIcon className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Blockchain Proof</p>
            {chain && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                {chain}
              </span>
            )}
          </div>
          <div className="px-4 py-3 space-y-2 text-xs">
            {cert.blockchainTxHash && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">TX Hash</span>
                {Number(cert.chainId) === 80002 ? (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${cert.blockchainTxHash}`}
                    target="_blank" rel="noopener noreferrer"
                    className="font-mono text-indigo-400 hover:text-indigo-300 transition-colors break-all"
                  >
                    {cert.blockchainTxHash}
                  </a>
                ) : (
                  <span className="font-mono text-slate-300 break-all">{cert.blockchainTxHash}</span>
                )}
              </div>
            )}
            {cert.issuerWalletAddress && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">Issuer Wallet</span>
                <span className="font-mono text-slate-300 break-all">{cert.issuerWalletAddress}</span>
              </div>
            )}
            <div className="flex gap-4 pt-1">
              {cert.blockNumber && (
                <div><span className="text-slate-500">Block </span><span className="text-slate-300">#{cert.blockNumber}</span></div>
              )}
              {cert.chainId && (
                <div><span className="text-slate-500">Chain ID </span><span className="text-slate-300">{cert.chainId}</span></div>
              )}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">Stored On-Chain</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-600">Verified via CredentiaX · {new Date().toLocaleString()}</p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Verify Another
        </button>
      </div>
    </div>
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
