import { useCallback, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api.js'

// ─── Icons ────────────────────────────────────────────────────────────────────

function ShieldCheckIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function ShieldExclamationIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
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

function UploadIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    </svg>
  )
}

function DocumentIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function XIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

function chainLabel(chainId) {
  if (!chainId) return null
  const id = Number(chainId)
  if (id === 31337) return 'Hardhat Local'
  if (id === 80002) return 'Polygon Amoy'
  if (id === 137)   return 'Polygon Mainnet'
  return `Chain ${id}`
}

// ─── Field comparison row (QR/Registry vs Extracted Text) ────────────────────

function FieldComparisonRow({ field }) {
  const { label, qrValue, extractedValue, matched } = field
  const isMismatch = matched === false
  const isMatch    = matched === true

  const rowCls = isMismatch
    ? 'border-red-500/20 bg-red-500/5'
    : isMatch
    ? 'border-emerald-500/15 bg-emerald-500/5'
    : 'border-slate-700/40 bg-slate-800/20'

  const statusLabel = isMismatch ? '✗ Mismatch' : isMatch ? '✓ Match' : '— Inconclusive'
  const statusColor = isMismatch ? 'text-red-400' : isMatch ? 'text-emerald-400' : 'text-slate-600'

  return (
    <div className={`rounded-lg border px-3 py-2.5 ${rowCls}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <span className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">QR / Registry</p>
          <p className={`text-xs font-mono break-all ${isMismatch ? 'text-red-300' : isMatch ? 'text-emerald-300' : 'text-slate-400'}`}>
            {qrValue ?? <span className="text-slate-600 italic">—</span>}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-600 mb-0.5">Certificate Text</p>
          <p className={`text-xs font-mono break-all ${isMismatch ? 'text-red-300' : isMatch ? 'text-emerald-300' : 'text-slate-500 italic'}`}>
            {extractedValue ?? <span className="text-slate-600 italic">—</span>}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Certificate detail row ───────────────────────────────────────────────────

function Row({ label, children }) {
  return (
    <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-800 last:border-0 gap-0.5 sm:gap-3">
      <span className="text-xs text-slate-500 sm:w-32 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-200 break-all">{children}</span>
    </div>
  )
}

function issuerIsVerified(cert) {
  const approvedWallet = cert?.issuedByUser?.walletAddress?.toLowerCase()
  const certificateWallet = cert?.issuerWalletAddress?.toLowerCase()
  return cert?.issuedByUser?.verificationStatus === 'VERIFIED'
    && approvedWallet
    && certificateWallet
    && approvedWallet === certificateWallet
}

// ─── Status configs ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  VALID: {
    border:    'border-emerald-500/30',
    bg:        'bg-emerald-500/5',
    headerBg:  'bg-emerald-500/8',
    headerBorder: 'border-emerald-500/20',
    iconBg:    'bg-emerald-500/15 border-emerald-500/25',
    iconColor: 'text-emerald-400',
    titleColor:'text-emerald-400',
    badge:     'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    dot:       'bg-emerald-400',
    Icon:      ShieldCheckIcon,
    title:     'Credential Verified',
    subtitle:  'QR registry data and extracted certificate content match across all fields.',
  },
  TAMPERED: {
    border:    'border-red-500/30',
    bg:        'bg-red-500/5',
    headerBg:  'bg-red-500/8',
    headerBorder: 'border-red-500/20',
    iconBg:    'bg-red-500/15 border-red-500/25',
    iconColor: 'text-red-400',
    titleColor:'text-red-400',
    badge:     'bg-red-500/10 border-red-500/20 text-red-400',
    dot:       'bg-red-400',
    Icon:      ShieldExclamationIcon,
    title:     'Certificate Tampered',
    subtitle:  'One or more fields differ between the QR registry data and certificate content.',
  },
  REVOKED: {
    border:    'border-amber-500/30',
    bg:        'bg-amber-500/5',
    headerBg:  'bg-amber-500/8',
    headerBorder: 'border-amber-500/20',
    iconBg:    'bg-amber-500/15 border-amber-500/25',
    iconColor: 'text-amber-400',
    titleColor:'text-amber-400',
    badge:     'bg-amber-500/10 border-amber-500/20 text-amber-400',
    dot:       'bg-amber-400',
    Icon:      BanIcon,
    title:     'Credential Revoked',
    subtitle:  'This credential has been revoked by the issuing institution.',
  },
  NOT_FOUND: {
    border:    'border-slate-700',
    bg:        'bg-slate-800/30',
    headerBg:  'bg-slate-800/60',
    headerBorder: 'border-slate-700',
    iconBg:    'bg-slate-700/60 border-slate-600',
    iconColor: 'text-slate-500',
    titleColor:'text-slate-300',
    badge:     'bg-slate-700 border-slate-600 text-slate-400',
    dot:       'bg-slate-500',
    Icon:      QuestionMarkIcon,
    title:     'Credential Not Found',
    subtitle:  'No credential with this ID exists in the registry.',
  },
}

// ─── Shared result card ───────────────────────────────────────────────────────

function ResultCard({ result, onReset }) {
  const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG.NOT_FOUND
  const cert = result.certificate

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden shadow-lg`}>

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
              {result.status}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5">{cfg.subtitle}</p>
        </div>
      </div>

      {/* Certificate details */}
      {cert && (
        <div className="px-5 py-1">
          <Row label="Certificate ID">
            <span className="font-mono text-indigo-300">{cert.certificateId}</span>
          </Row>
          <Row label="Title">{cert.title}</Row>
          <Row label="Course">{cert.course}</Row>
          {cert.description && <Row label="Description">{cert.description}</Row>}
          <Row label="Holder">{cert.holder?.name} <span className="text-slate-500">({cert.holder?.email})</span></Row>
          <Row label="Issued by">
            <span className="inline-flex items-center gap-2 flex-wrap">
              {cert.issuedByUser?.name}
              {issuerIsVerified(cert) ? (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  Verified Institution
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  Unverified Institution
                </span>
              )}
            </span>
          </Row>
          <Row label="Issue Date">
            {new Date(cert.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </Row>
          {cert.blockchainTxHash && (
            <Row label="Blockchain TX">
              {Number(cert.chainId) === 80002 ? (
                <a
                  href={`https://amoy.polygonscan.com/tx/${cert.blockchainTxHash}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  {cert.blockchainTxHash.slice(0, 16)}…{cert.blockchainTxHash.slice(-8)}
                </a>
              ) : (
                <span className="font-mono text-slate-300">
                  {cert.blockchainTxHash.slice(0, 16)}…{cert.blockchainTxHash.slice(-8)}
                </span>
              )}
            </Row>
          )}
        </div>
      )}

      {/* Blockchain proof panel */}
      {cert && (cert.blockchainTxHash || cert.chainId) && (
        <div className="mx-5 mb-4 rounded-xl bg-slate-800/50 border border-slate-700/60 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-700/60 flex items-center gap-2">
            <CubeIcon className="w-3.5 h-3.5 text-indigo-400" />
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Blockchain Proof</p>
            {chainLabel(cert.chainId) && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                {chainLabel(cert.chainId)}
              </span>
            )}
          </div>
          <div className="px-4 py-3 space-y-2 text-xs">
            {cert.blockchainTxHash && (
              <div className="flex flex-col gap-0.5">
                <span className="text-slate-500">TX Hash</span>
                {Number(cert.chainId) === 80002 ? (
                  <a href={`https://amoy.polygonscan.com/tx/${cert.blockchainTxHash}`} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-indigo-400 hover:text-indigo-300 transition-colors break-all">
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
              {cert.blockNumber && <div><span className="text-slate-500">Block </span><span className="text-slate-300">#{cert.blockNumber}</span></div>}
              {cert.chainId && <div><span className="text-slate-500">Chain ID </span><span className="text-slate-300">{cert.chainId}</span></div>}
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-medium">Stored On-Chain</span>
            </div>
          </div>
        </div>
      )}

      {/* Field comparison panel */}
      {result.fieldResults && result.fieldResults.length > 0 && (
        <div className="px-5 py-4 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Field Comparison
            </p>
            <div className="flex items-center gap-1.5">
              {result.qrFound && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-medium">
                  QR detected
                </span>
              )}
              {result.extractionMethod && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500">
                  {result.extractionMethod === 'gemini'
                    ? 'Gemini AI'
                    : result.extractionMethod === 'pdf-parse'
                    ? 'PDF text'
                    : 'OCR'}
                </span>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-2 gap-2 px-3">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              QR / Registry Data
            </p>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
              Certificate Text
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            {result.fieldResults.map((f) => <FieldComparisonRow key={f.key} field={f} />)}
          </div>

          {result.anyMismatch ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/8 border border-red-500/20">
              <ShieldExclamationIcon className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-red-400 text-xs font-medium">
                Field mismatch detected — certificate content does not match QR registry data
              </p>
            </div>
          ) : result.anyInconclusive ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/8 border border-amber-500/20">
              <ShieldExclamationIcon className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-400 text-xs font-medium">
                Some fields could not be extracted — review manually for complete assurance
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <p className="text-emerald-400 text-xs font-medium">
                All fields match — certificate is authentic
              </p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-600">
          Verified via CredentiaX registry · {new Date().toLocaleString()}
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap"
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

// ─── Drag & Drop Upload Zone ──────────────────────────────────────────────────

function DropZone({ file, isDragging, onDrop, onDragOver, onDragLeave, onFileChange, onClear, fileInputRef }) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
        isDragging
          ? 'border-indigo-400 bg-indigo-500/8 scale-[1.01]'
          : file
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-slate-700 hover:border-slate-500 bg-slate-800/30 hover:bg-slate-800/50'
      }`}
      onClick={() => !file && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf,image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
        className="sr-only"
        onChange={onFileChange}
      />

      <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        {file ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
              <DocumentIcon className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-700"
            >
              <XIcon className="w-3.5 h-3.5" />
              Remove file
            </button>
          </>
        ) : isDragging ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <UploadIcon className="w-6 h-6 text-indigo-400 animate-bounce" />
            </div>
            <p className="text-indigo-300 font-medium text-sm">Drop file here</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-slate-700/60 border border-slate-600 flex items-center justify-center">
              <UploadIcon className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                Drop a file here, or{' '}
                <span className="text-indigo-400 hover:text-indigo-300 transition-colors">browse</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">PDF, PNG, JPEG · Max 15 MB</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ text }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-400 text-sm">{text}</p>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function VerifyCertificate() {
  const [file,          setFile]          = useState(null)
  const [isDragging,    setIsDragging]    = useState(false)
  const [uploadResult,  setUploadResult]  = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const fileInputRef = useRef(null)

  function onDragOver(e) {
    e.preventDefault()
    setIsDragging(true)
  }
  function onDragLeave(e) {
    e.preventDefault()
    setIsDragging(false)
  }

  const ACCEPTED_TYPES = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
  const ACCEPTED_EXTS  = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp'])

  function onDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (!f) return
    const ext = f.name.toLowerCase().split('.').pop()
    if (!ACCEPTED_TYPES.has(f.type) && !ACCEPTED_EXTS.has(ext)) {
      toast.error('Please drop a PDF or image file (PNG, JPG, JPEG)')
      return
    }
    if (f.size > 15 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 15 MB.')
      return
    }
    setFile(f)
    setUploadResult(null)
  }

  function onFileChange(e) {
    const f = e.target.files[0]
    if (f) { setFile(f); setUploadResult(null) }
    e.target.value = ''
  }

  function clearFile() {
    setFile(null)
    setUploadResult(null)
  }

  async function handleUploadSubmit(e) {
    e.preventDefault()
    if (!file) { toast.error('Please select a certificate file first'); return }

    setUploadLoading(true)
    setUploadResult(null)

    const formData = new FormData()
    formData.append('pdf', file)

    try {
      const { data } = await api.post('/verify/upload', formData)
      setUploadResult(data.data)
    } catch (err) {
      const msg = err.response?.data?.message || 'Verification failed. Please try again.'
      toast.error(msg)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-4 py-10"
      style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 25%, rgba(99,102,241,0.10) 0%, transparent 65%), #0f172a' }}
    >
      {/* Logo */}
      <Link to="/dashboard" className="inline-flex items-center gap-2.5 mb-8 group">
        <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-400 transition-colors">
          <ShieldCheckIcon className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">CredentiaX</span>
      </Link>

      {/* Hero */}
      <div className="text-center mb-8 max-w-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Verify Certificate</h1>
        <p className="text-slate-400 text-sm">
          Upload a certificate as a PDF, PNG, or JPEG. The system automatically extracts the
          embedded QR code, looks up the registry record, and compares the certificate content
          against the blockchain-stored data to detect tampering.
        </p>
      </div>

      {/* Card container */}
      <div className="w-full max-w-xl">

        {/* Upload card */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-1">Certificate Integrity Check</h2>
          <p className="text-xs text-slate-500 mb-4">
            Upload the certificate file. We scan the embedded QR code to retrieve the authoritative
            registry record, then compare key fields against what is printed on the certificate.
            Any mismatch flags tampering.
          </p>

          <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
            <DropZone
              file={file}
              isDragging={isDragging}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onFileChange={onFileChange}
              onClear={clearFile}
              fileInputRef={fileInputRef}
            />

            <button
              type="submit"
              disabled={uploadLoading || !file}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
            >
              {uploadLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <ShieldCheckIcon className="w-4 h-4" />
                  Verify Certificate
                </>
              )}
            </button>
          </form>
        </div>

        {uploadLoading && <Spinner text="Scanning QR code and comparing certificate fields…" />}

        {uploadResult && (
          <div className="mt-4">
            <ResultCard
              result={uploadResult}
              onReset={() => { setUploadResult(null); clearFile() }}
            />
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-slate-700 text-xs mt-8">
          Powered by{' '}
          <Link to="/" className="text-slate-600 hover:text-slate-400 transition-colors">
            CredentiaX
          </Link>{' '}
          · Tamper-proof credential registry on Polygon Amoy
        </p>
      </div>
    </div>
  )
}
