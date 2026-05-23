import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useWallet } from '../../context/WalletContext.jsx'
import WalletButton from '../../components/WalletButton.jsx'
import AnalyticsSection from '../../components/analytics/AnalyticsSection.jsx'
import api from '../../services/api.js'
import toast from 'react-hot-toast'
import { issueOnChain, isContractConfigured, CHAIN_ID } from '../../utils/contract.js'

// ── Icons ───────────────────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function UserPlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  )
}

// ── Create Holder Modal ──────────────────────────────────────────────────────

function CreateHolderModal({ onClose, onCreated }) {
  const [form, setForm]       = useState({ name: '', email: '', walletAddress: '' })
  const [errors, setErrors]   = useState({})
  const [submitting, setSub]  = useState(false)
  const [created, setCreated] = useState(null) // { holder, tempPassword }

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSub(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        ...(form.walletAddress.trim() ? { walletAddress: form.walletAddress.trim() } : {}),
      }
      const { data } = await api.post('/holders', payload)
      setCreated(data.data)
      onCreated(data.data.holder)
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else toast.error(data?.message || 'Failed to create holder')
    } finally {
      setSub(false)
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(created.tempPassword)
    toast.success('Temporary password copied')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!created ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <UserPlusIcon />
            </div>
            <h2 className="font-semibold text-white text-sm">
              {created ? 'Holder Created' : 'Create New Holder'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {created ? (
            /* Success state — show temp password once */
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-emerald-400 text-sm font-semibold mb-0.5">Holder account created</p>
                  <p className="text-slate-400 text-xs">Share the credentials below with the holder. The temporary password will <strong className="text-slate-200">not be shown again</strong>.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Name</p>
                  <p className="text-sm text-white font-medium">{created.holder.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-sm text-white font-medium">{created.holder.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Temporary Password</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-600 font-mono text-sm text-amber-300 tracking-wider">
                      {created.tempPassword}
                    </div>
                    <button
                      type="button"
                      onClick={copyPassword}
                      className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-800 border border-slate-600 hover:border-slate-500 text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                  <p className="text-xs text-amber-400/70 mt-1.5">Instruct the holder to change this password after first login.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium transition-colors mt-1"
              >
                Done
              </button>
            </div>
          ) : (
            /* Creation form */
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full name <span className="text-red-400">*</span></label>
                <input
                  name="name"
                  type="text"
                  placeholder="Jane Smith"
                  value={form.name}
                  onChange={onChange}
                  disabled={submitting}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.name ? 'border-red-500' : 'border-slate-600'}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email address <span className="text-red-400">*</span></label>
                <input
                  name="email"
                  type="email"
                  placeholder="holder@example.com"
                  value={form.email}
                  onChange={onChange}
                  disabled={submitting}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.email ? 'border-red-500' : 'border-slate-600'}`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Wallet address <span className="text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  name="walletAddress"
                  type="text"
                  placeholder="0x..."
                  value={form.walletAddress}
                  onChange={onChange}
                  disabled={submitting}
                  className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.walletAddress ? 'border-red-500' : 'border-slate-600'}`}
                />
                {errors.walletAddress && <p className="mt-1 text-xs text-red-400">{errors.walletAddress}</p>}
              </div>

              <p className="text-xs text-slate-500 -mt-1 bg-slate-800/60 border border-slate-700/60 rounded-xl px-3 py-2.5">
                A temporary password will be auto-generated and shown once after creation.
              </p>

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
                >
                  {submitting ? 'Creating…' : 'Create Holder'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Issue Certificate Modal ──────────────────────────────────────────────────

function CertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  )
}

// ── Step indicators ───────────────────────────────────────────────────────────

const STEPS = [
  { id: 'form',      label: 'Details'      },
  { id: 'preparing', label: 'Generating'   },
  { id: 'signing',   label: 'Sign'         },
  { id: 'pending',   label: 'Confirming'   },
  { id: 'success',   label: 'Done'         },
]

function StepBar({ current }) {
  const idx = STEPS.findIndex((s) => s.id === current)
  return (
    <div className="flex items-center gap-0 px-6 py-3 border-b border-slate-800">
      {STEPS.map((step, i) => {
        const done    = i < idx
        const active  = i === idx
        const future  = i > idx
        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done   ? 'bg-emerald-500 text-white' :
                active ? 'bg-indigo-500 text-white ring-2 ring-indigo-500/40' :
                         'bg-slate-800 border border-slate-700 text-slate-500'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-indigo-400' : done ? 'text-emerald-400' : 'text-slate-600'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 transition-all ${done ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Error codes → human-friendly messages ─────────────────────────────────────

function parseWalletError(err) {
  const code = err?.code
  if (code === 4001 || code === 'ACTION_REJECTED') return 'Signature rejected. You declined the MetaMask prompt.'
  if (code === -32603) return 'Internal RPC error. Check your MetaMask network.'
  if (err?.message?.includes('insufficient funds')) return 'Insufficient MATIC for gas fees.'
  if (err?.message?.includes('Credential already exists')) return 'This certificate ID already exists on-chain.'
  if (err?.message?.includes('Expiry must be in the future')) return 'Contract rejected the expiry timestamp.'
  return err?.reason || err?.message || 'Transaction failed'
}

// ── IssueCertificateModal ─────────────────────────────────────────────────────

function IssueCertificateModal({ holders, onClose, onIssued }) {
  const { address, isCorrectNetwork, getSigner, connect, isInstalled } = useWallet()
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm]     = useState({ holderId: holders[0]?.id || '', title: '', course: '', usn: '', cgpa: '', description: '', issueDate: today })
  const [errors, setErrors] = useState({})
  const [step, setStep]     = useState('form')   // form | preparing | signing | pending | success | error
  const [issued, setIssued] = useState(null)
  const [txHash, setTxHash] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  const useBlockchain = isContractConfigured() && address && isCorrectNetwork

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!form.holderId)  errs.holderId  = 'Select a holder'
    if (!form.title)     errs.title     = 'Title is required'
    if (!form.course)    errs.course    = 'Course is required'
    if (!form.issueDate) errs.issueDate = 'Issue date is required'
    if (form.cgpa && isNaN(parseFloat(form.cgpa))) errs.cgpa = 'Enter a valid CGPA (e.g. 9.5)'
    if (Object.keys(errs).length) { setErrors(errs); return }

    if (useBlockchain) {
      await runBlockchainFlow()
    } else {
      await runLegacyFlow()
    }
  }

  // ── Legacy (off-chain) path ─────────────────────────────────────────────────
  async function runLegacyFlow() {
    setStep('preparing')
    try {
      const { data } = await api.post('/certificates/issue', {
        holderId:    form.holderId,
        title:       form.title,
        course:      form.course,
        usn:         form.usn.trim()  || undefined,
        cgpa:        form.cgpa.trim() || undefined,
        description: form.description || undefined,
        issueDate:   form.issueDate,
      })
      setIssued(data.data.certificate)
      onIssued(data.data.certificate)
      setStep('success')
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setErrors(d.errors)
      setErrMsg(d?.message || 'Certificate issuance failed')
      setStep('error')
    }
  }

  // ── Decentralized (on-chain) path ───────────────────────────────────────────
  async function runBlockchainFlow() {
    setErrMsg('')

    // ── Phase 1: backend prepares PDF + hash ──────────────────────────────────
    setStep('preparing')
    let cert, payload
    try {
      const { data } = await api.post('/certificates/prepare-issuance', {
        holderId:    form.holderId,
        title:       form.title,
        course:      form.course,
        usn:         form.usn.trim()  || undefined,
        cgpa:        form.cgpa.trim() || undefined,
        description: form.description || undefined,
        issueDate:   form.issueDate,
      })
      cert    = data.data.certificate
      payload = data.data.blockchainPayload
    } catch (err) {
      const d = err.response?.data
      if (d?.errors) setErrors(d.errors)
      setErrMsg(d?.message || 'Failed to prepare certificate')
      setStep('error')
      return
    }

    // ── Phase 2: MetaMask signature ───────────────────────────────────────────
    setStep('signing')
    let tx
    try {
      const signer = await getSigner()
      tx = await issueOnChain({
        signer,
        certId:  cert.certificateId,
        payload,
      })
    } catch (err) {
      setErrMsg(parseWalletError(err))
      setStep('error')
      return
    }

    // ── Phase 3: wait for on-chain confirmation ───────────────────────────────
    setStep('pending')
    let receipt
    try {
      receipt = await tx.wait()
      setTxHash(receipt.hash)
    } catch (err) {
      setErrMsg('Transaction reverted on-chain: ' + (err?.reason || err?.message || 'unknown error'))
      setStep('error')
      return
    }

    // ── Phase 4: tell backend to finalise ────────────────────────────────────
    try {
      const { data } = await api.post('/certificates/finalize-issuance', {
        certificateId: cert.certificateId,
        txHash:        receipt.hash,
        signerAddress: address,
        chainId:       CHAIN_ID,
        blockNumber:   receipt.blockNumber,
      })
      setIssued(data.data.certificate)
      onIssued(data.data.certificate)
      setStep('success')
      toast.success('Certificate anchored on-chain!')
    } catch (err) {
      setErrMsg(err.response?.data?.message || 'Finalisation failed — tx is on-chain but not recorded')
      setStep('error')
    }
  }

  function downloadPDF() {
    window.open(`/api/v1/certificates/file/${issued.certificateId}`, '_blank')
  }

  const fieldCls = (key) =>
    `w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors[key] ? 'border-red-500' : 'border-slate-600'}`

  const showStepBar = step !== 'form' && step !== 'error'
  const stepBarId   = step === 'success' ? 'success' : step === 'pending' ? 'pending' : step

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 'form' ? onClose : undefined} />
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CertIcon />
            </div>
            <h2 className="font-semibold text-white text-sm">
              {step === 'success' ? 'Certificate Issued' : 'Issue Certificate'}
            </h2>
          </div>
          {(step === 'form' || step === 'success' || step === 'error') && (
            <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <XIcon />
            </button>
          )}
        </div>

        {/* Step bar */}
        {showStepBar && <StepBar current={stepBarId} />}

        <div className="p-6">

          {/* ── FORM ─────────────────────────────────────────────────────────── */}
          {step === 'form' && (
            <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>

              {/* Blockchain notice */}
              {useBlockchain ? (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl bg-indigo-500/8 border border-indigo-500/20 text-xs text-indigo-300">
                  <svg className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  <div>
                    <span className="font-semibold text-indigo-200">Decentralized issuance enabled.</span>{' '}
                    MetaMask will prompt you to sign the credential hash on-chain. Your wallet pays gas.
                  </div>
                </div>
              ) : !isInstalled ? (
                <div className="px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300">
                  MetaMask not detected — certificate will be issued off-chain only.
                </div>
              ) : !address ? (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <p className="text-xs text-amber-300 flex-1">Connect your wallet to anchor this credential on-chain.</p>
                  <button type="button" onClick={connect} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 transition-colors whitespace-nowrap">
                    Connect
                  </button>
                </div>
              ) : !isCorrectNetwork ? (
                <div className="px-3 py-2.5 rounded-xl bg-red-500/8 border border-red-500/20 text-xs text-red-300">
                  Wrong network — switch to the correct chain to issue on-chain.
                </div>
              ) : null}

              {/* Holder */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Holder <span className="text-red-400">*</span></label>
                {holders.length === 0 ? (
                  <p className="text-sm text-amber-400 px-4 py-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    No holders found. Create a holder first.
                  </p>
                ) : (
                  <select name="holderId" value={form.holderId} onChange={onChange} className={fieldCls('holderId') + ' cursor-pointer'}>
                    <option value="">Select a holder…</option>
                    {holders.map((h) => (
                      <option key={h.id} value={h.id}>{h.name} ({h.email})</option>
                    ))}
                  </select>
                )}
                {errors.holderId && <p className="mt-1 text-xs text-red-400">{errors.holderId}</p>}
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Certificate Title <span className="text-red-400">*</span></label>
                <input name="title" type="text" placeholder="Bachelor of Computer Science" value={form.title} onChange={onChange} className={fieldCls('title')} />
                {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
              </div>

              {/* Course */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Course / Program <span className="text-red-400">*</span></label>
                <input name="course" type="text" placeholder="Computer Science & Engineering" value={form.course} onChange={onChange} className={fieldCls('course')} />
                {errors.course && <p className="mt-1 text-xs text-red-400">{errors.course}</p>}
              </div>

              {/* USN / Roll Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  USN / Roll Number <span className="text-slate-500 font-normal">(optional — used for tamper detection)</span>
                </label>
                <input name="usn" type="text" placeholder="1BM21CS001" value={form.usn} onChange={onChange} className={fieldCls('usn') + ' font-mono'} />
                {errors.usn && <p className="mt-1 text-xs text-red-400">{errors.usn}</p>}
              </div>

              {/* CGPA */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  CGPA / Marks <span className="text-slate-500 font-normal">(optional — used for tamper detection)</span>
                </label>
                <input name="cgpa" type="text" placeholder="9.5" value={form.cgpa} onChange={onChange} className={fieldCls('cgpa')} />
                {errors.cgpa && <p className="mt-1 text-xs text-red-400">{errors.cgpa}</p>}
              </div>

              {/* Issue date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Issue Date <span className="text-red-400">*</span></label>
                <input name="issueDate" type="date" value={form.issueDate} onChange={onChange} className={fieldCls('issueDate')} />
                {errors.issueDate && <p className="mt-1 text-xs text-red-400">{errors.issueDate}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description <span className="text-slate-500 font-normal">(optional)</span></label>
                <textarea name="description" rows={2} placeholder="Brief description…" value={form.description} onChange={onChange} className={fieldCls('description') + ' resize-none'} />
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={holders.length === 0} className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
                  {useBlockchain ? 'Generate & Sign' : 'Issue Certificate'}
                </button>
              </div>
            </form>
          )}

          {/* ── PREPARING ────────────────────────────────────────────────────── */}
          {step === 'preparing' && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Generating Certificate…</p>
                <p className="text-slate-400 text-xs mt-1">Creating PDF, computing SHA-256 hash</p>
              </div>
            </div>
          )}

          {/* ── AWAITING SIGNATURE ───────────────────────────────────────────── */}
          {step === 'signing' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Awaiting Wallet Signature</p>
                <p className="text-slate-400 text-xs mt-1">Check your MetaMask popup to sign the transaction</p>
              </div>
              <div className="w-full px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-300 text-center">
                Your wallet pays the gas fee. The certificate hash is stored on-chain.
              </div>
            </div>
          )}

          {/* ── TX PENDING ───────────────────────────────────────────────────── */}
          {step === 'pending' && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <p className="text-white font-semibold text-sm">Transaction Pending…</p>
                <p className="text-slate-400 text-xs mt-1">Waiting for block confirmation</p>
              </div>
              {txHash && (
                <a
                  href={CHAIN_ID === 80002 ? `https://amoy.polygonscan.com/tx/${txHash}` : `#`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-indigo-400 hover:text-indigo-300 break-all text-center"
                >
                  {txHash.slice(0, 20)}…
                </a>
              )}
            </div>
          )}

          {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
          {step === 'success' && issued && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <svg className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-emerald-400 text-sm font-semibold mb-0.5">
                    {issued.blockchainTxHash ? 'Certificate anchored on-chain' : 'Certificate issued successfully'}
                  </p>
                  <p className="text-slate-400 text-xs">PDF generated, hashed, and stored securely.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">Certificate ID</p>
                  <p className="font-mono text-sm text-indigo-300 font-medium">{issued.certificateId}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">Issued to</p>
                  <p className="text-sm text-white">{issued.holder?.name} <span className="text-slate-500">({issued.holder?.email})</span></p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <p className="text-xs text-slate-500 mb-1">PDF Hash (SHA-256)</p>
                  <p className="font-mono text-xs text-slate-400 break-all">{issued.pdfHash}</p>
                </div>

                {issued.blockchainTxHash ? (
                  <div className="p-3.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-emerald-600 font-semibold">On-Chain TX</p>
                      {issued.chainId && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400">
                          Chain {issued.chainId} · Block {issued.blockNumber}
                        </span>
                      )}
                    </div>
                    <a
                      href={issued.chainId === 80002 ? `https://amoy.polygonscan.com/tx/${issued.blockchainTxHash}` : `#`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-emerald-400 break-all hover:text-emerald-300 transition-colors"
                    >
                      {issued.blockchainTxHash}
                    </a>
                    {issued.issuerWalletAddress && (
                      <p className="text-xs text-slate-500 mt-1.5">
                        Signed by <span className="font-mono text-slate-400">{issued.issuerWalletAddress.slice(0, 10)}…</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
                    <p className="text-xs text-amber-400">Stored off-chain — no blockchain anchor</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-1">
                <button type="button" onClick={downloadPDF}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20">
                  <DownloadIcon />
                  Download PDF
                </button>
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── ERROR ────────────────────────────────────────────────────────── */}
          {step === 'error' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-red-400 text-sm font-semibold mb-0.5">Issuance Failed</p>
                  <p className="text-slate-400 text-xs">{errMsg}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('form')}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all">
                  Try Again
                </button>
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Pending Approval Screen ──────────────────────────────────────────────────

function PendingApprovalScreen({ status, note }) {
  const isRejected = status === 'REJECTED'
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Animated icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${
              isRejected
                ? 'bg-red-500/10 border border-red-500/20 shadow-red-500/10'
                : 'bg-amber-500/10 border border-amber-500/20 shadow-amber-500/10'
            }`}>
              {isRejected ? (
                <svg className="w-12 h-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            {!isRejected && (
              <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-amber-400" />
            )}
          </div>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-8 text-center shadow-2xl shadow-black/60">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            isRejected
              ? 'bg-red-500/10 border border-red-500/20 text-red-400'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isRejected ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
            {isRejected ? 'Registration Rejected' : 'Approval Pending'}
          </div>

          <h1 className="text-xl font-bold text-white mb-3">
            {isRejected ? 'Account Not Approved' : 'Awaiting Admin Approval'}
          </h1>

          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {isRejected
              ? 'Your institution registration was not approved. Please contact the platform administrator for more information.'
              : 'Your institution account is awaiting admin approval.\nYou will gain full access after verification.'}
          </p>

          {isRejected && note && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/8 border border-red-500/20 text-left">
              <p className="text-xs text-slate-500 mb-1">Admin note</p>
              <p className="text-sm text-red-300">{note}</p>
            </div>
          )}

          {!isRejected && (
            <div className="flex flex-col gap-3 mb-6">
              {[
                { icon: '🏛️', text: 'Your institution details are under review' },
                { icon: '✉️', text: 'You will be notified once approved' },
                { icon: '🔒', text: 'Dashboard features unlock automatically' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/40 text-left">
                  <span className="text-lg shrink-0">{icon}</span>
                  <p className="text-xs text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-600">
            Questions? Contact <span className="text-slate-400">admin@credentiax.io</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

function truncateAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function UniversityDashboard() {
  const { user }                    = useAuth()
  const { address, network, isCorrectNetwork, connecting, isInstalled, connect, switchAccount, switchToAmoy } = useWallet()
  const [holders, setHolders]           = useState([])
  const [loadingH, setLoadingH]         = useState(true)
  const [certificates, setCertificates] = useState([])
  const [loadingC, setLoadingC]         = useState(true)
  const [showModal, setShowModal]       = useState(false)
  const [showIssueModal, setShowIssue]  = useState(false)
  const [verification, setVerification] = useState(() => ({
    status: user?.verificationStatus || 'UNVERIFIED',
    note: user?.verificationNote || '',
  }))
  const [requestingVerification, setRequestingVerification] = useState(false)

  const fetchHolders = useCallback(async () => {
    setLoadingH(true)
    try {
      const { data } = await api.get('/holders')
      setHolders(data.data.holders)
    } catch (err) {
      if (err.response?.status !== 403) toast.error('Failed to load holders')
    } finally {
      setLoadingH(false)
    }
  }, [])

  const fetchCertificates = useCallback(async () => {
    setLoadingC(true)
    try {
      const { data } = await api.get('/certificates/issued')
      setCertificates(data.data.certificates)
    } catch {
      // non-critical
    } finally {
      setLoadingC(false)
    }
  }, [])

  useEffect(() => { fetchHolders() }, [fetchHolders])
  useEffect(() => { fetchCertificates() }, [fetchCertificates])
  useEffect(() => {
    setVerification({
      status: user?.verificationStatus || 'UNVERIFIED',
      note: user?.verificationNote || '',
    })
  }, [user])

  // Block unapproved institutions before rendering the full dashboard
  const isApproved = verification.status === 'VERIFIED'
  if (!isApproved) {
    return <PendingApprovalScreen status={verification.status} note={verification.note} />
  }

  async function requestVerification() {
    setRequestingVerification(true)
    try {
      // Ensure the current wallet is persisted before checking on the backend
      if (address) await api.patch('/auth/wallet', { walletAddress: address })
      const { data } = await api.post('/institution-verification/request')
      const institution = data.data.institution
      setVerification({
        status: institution.verificationStatus,
        note: institution.verificationNote || '',
      })
      toast.success('Verification request submitted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit verification request')
    } finally {
      setRequestingVerification(false)
    }
  }

  function onHolderCreated(holder) {
    setHolders((prev) => [holder, ...prev])
  }

  function onCertificateIssued(cert) {
    setCertificates((prev) => [cert, ...prev])
    setShowIssue(false)
  }

  const revokedCount = certificates.filter((c) => c.isRevoked).length

  const stats = [
    { label: 'Total Holders',  value: String(holders.length),      note: holders.length === 0 ? 'No holders yet' : 'Registered holders' },
    { label: 'Credentials',    value: String(certificates.length), note: certificates.length === 0 ? 'No credentials yet' : 'Credentials issued' },
    { label: 'Revocations',    value: String(revokedCount),        note: revokedCount === 0 ? 'All credentials valid' : 'Revoked credentials' },
    { label: 'Network Status', value: 'Live', note: 'All systems operational', green: true },
  ]

  return (
    <>
      {showModal && (
        <CreateHolderModal
          onClose={() => setShowModal(false)}
          onCreated={onHolderCreated}
        />
      )}
      {showIssueModal && (
        <IssueCertificateModal
          holders={holders}
          onClose={() => setShowIssue(false)}
          onIssued={onCertificateIssued}
        />
      )}

      <div className="w-full">
        <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-medium mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                University
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">Institution Dashboard</h1>
              <p className="text-slate-400 text-sm mt-0.5">Issue credentials and manage your holders</p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-sm font-medium transition-all whitespace-nowrap"
              >
                <PlusIcon />
                Create Holder
              </button>
              <button
                type="button"
                onClick={() => setShowIssue(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 whitespace-nowrap"
              >
                <CertIcon />
                Issue Certificate
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {stats.map(({ label, value, note, green }) => (
              <div key={label} className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-700/60 hover:border-slate-600 transition-colors">
                <p className={`text-2xl sm:text-3xl font-bold mb-1 leading-none ${green ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
                <p className="text-xs sm:text-sm font-medium text-white mb-0.5 leading-snug">{label}</p>
                <p className="text-xs text-slate-500 leading-snug">{note}</p>
              </div>
            ))}
          </div>

          {/* ── Analytics & Insights ──────────────────────────────────────── */}
          <AnalyticsSection />

          {/* Main grid */}
          <div className="grid grid-cols-1 gap-5 sm:gap-6 mb-6">

            {/* Issued Certificates panel */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <h2 className="font-semibold text-white text-sm sm:text-base">Issued Certificates</h2>
                <button
                  type="button"
                  onClick={() => setShowIssue(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <PlusIcon />
                  Issue Certificate
                </button>
              </div>

              {loadingC ? (
                <div className="px-6 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Loading certificates…</p>
                </div>
              ) : certificates.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                    <CertIcon />
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-1">No certificates issued yet</p>
                  <p className="text-slate-500 text-xs mb-4">Issue your first certificate to a holder</p>
                  <button
                    type="button"
                    onClick={() => setShowIssue(true)}
                    disabled={holders.length === 0}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <CertIcon />
                    Issue First Certificate
                  </button>
                  {holders.length === 0 && (
                    <p className="text-xs text-amber-400 mt-3">Create a holder first before issuing certificates</p>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/40 border-b border-slate-800">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Certificate</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Holder</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Issue Date</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {certificates.map((cert) => (
                        <tr key={cert.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex flex-col">
                              <p className="text-sm font-medium text-white">{cert.title}</p>
                              <p className="text-xs text-slate-500 font-mono">{cert.certificateId}</p>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {cert.holder?.name?.[0]?.toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <p className="text-sm text-white truncate">{cert.holder?.name}</p>
                                <p className="text-xs text-slate-500 truncate">{cert.holder?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <p className="text-sm text-slate-300">{new Date(cert.issueDate).toLocaleDateString()}</p>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              {cert.isRevoked ? (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                  Revoked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 w-fit">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Active
                                </span>
                              )}
                              {cert.blockchainTxHash && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 w-fit">
                                  On-chain
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => window.open(`/api/v1/certificates/file/${cert.certificateId}`, '_blank')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
                                title="Download PDF"
                              >
                                <DownloadIcon />
                                Download
                              </button>
                              {cert.blockchainTxHash && (
                                <a
                                  href={`https://amoy.polygonscan.com/tx/${cert.blockchainTxHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors"
                                  title="View on Polygonscan"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                                  </svg>
                                  View TX
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Holders and side panel grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

            {/* Holders panel */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <h2 className="font-semibold text-white text-sm sm:text-base">Registered Holders</h2>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0"
                >
                  <PlusIcon />
                  Add Holder
                </button>
              </div>

              {loadingH ? (
                <div className="px-6 py-10 text-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Loading holders…</p>
                </div>
              ) : holders.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                    <UsersIcon />
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-1">No holders yet</p>
                  <p className="text-slate-500 text-xs mb-4">Create your first holder to start issuing credentials</p>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-lg shadow-indigo-500/20"
                  >
                    <PlusIcon />
                    Create First Holder
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {holders.map((h) => (
                    <div
                      key={h.id}
                      className="px-5 sm:px-6 py-4 flex items-center gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                        {h.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{h.name}</p>
                        <p className="text-xs text-slate-500 truncate">{h.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {h.walletAddress && (
                          <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            Wallet linked
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Side column */}
            <div className="flex flex-col gap-4 sm:gap-5">

              {/* Institution info */}
              <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
                <h2 className="font-semibold text-white text-sm sm:text-base mb-4">Institution Info</h2>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-sky-500/20">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
                <p className="text-center text-white text-sm font-medium">{user?.name}</p>
                <p className="text-center text-slate-400 text-xs mt-0.5">{user?.email}</p>
                <div className="mt-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Role</span>
                    <span className="text-sky-400 font-medium">University</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-slate-500">Holders</span>
                    <span className="text-white font-medium">{holders.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1.5">
                    <span className="text-slate-500">Status</span>
                    <span className={`font-medium ${
                      verification.status === 'VERIFIED'
                        ? 'text-emerald-400'
                        : verification.status === 'PENDING'
                        ? 'text-sky-400'
                        : verification.status === 'REJECTED'
                        ? 'text-red-400'
                        : 'text-amber-400'
                    }`}>
                      {verification.status === 'VERIFIED'
                        ? 'Verified Institution'
                        : verification.status === 'PENDING'
                        ? 'Review Pending'
                        : verification.status === 'REJECTED'
                        ? 'Rejected'
                        : 'Unverified'}
                    </span>
                  </div>
                </div>

                {/* Inline verification action */}
                {verification.status === 'REJECTED' && verification.note && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                    {verification.note}
                  </div>
                )}
                {verification.status === 'PENDING' && (
                  <div className="mt-3 px-3 py-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs text-center">
                    Verification request under admin review
                  </div>
                )}
                {(verification.status === 'UNVERIFIED' || verification.status === 'REJECTED') && (
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={requestVerification}
                      disabled={requestingVerification || !address}
                      className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
                    >
                      {requestingVerification ? 'Submitting…' : 'Request Verification'}
                    </button>
                    {!address && (
                      <p className="text-xs text-amber-400 text-center">Connect issuer wallet first</p>
                    )}
                  </div>
                )}
              </div>

              {/* Wallet Connection */}
              <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
                <h2 className="font-semibold text-white text-sm sm:text-base mb-4">Issuer Wallet</h2>

                {!isInstalled ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-slate-400">MetaMask is required to issue credentials on-chain.</p>
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium text-center hover:bg-amber-500/20 transition-colors"
                    >
                      Install MetaMask
                    </a>
                  </div>
                ) : !address ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-slate-400">Connect your issuer wallet to sign and issue credentials on Polygon Amoy.</p>
                    <WalletButton className="w-full justify-center" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${isCorrectNetwork ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
                      <span className={`text-xs font-medium ${isCorrectNetwork ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCorrectNetwork ? 'Connected' : 'Wrong network'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <p className="text-xs text-slate-500 mb-0.5">Address</p>
                      <p className="text-sm font-mono text-white">{truncateAddress(address)}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <p className="text-xs text-slate-500 mb-0.5">Network</p>
                      <p className={`text-sm font-medium ${isCorrectNetwork ? 'text-white' : 'text-red-400'}`}>{network ?? '—'}</p>
                    </div>

                    {!isCorrectNetwork && (
                      <button
                        type="button"
                        onClick={switchToAmoy}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                      >
                        Switch to Polygon Amoy
                      </button>
                    )}

                    <WalletButton className="w-full justify-center" />
                    <button
                      type="button"
                      onClick={switchAccount}
                      className="w-full py-2 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                      Switch Account
                    </button>
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
                <h2 className="font-semibold text-white text-sm sm:text-base mb-3">Quick Actions</h2>
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: 'Create Holder', action: () => setShowModal(true) },
                    { label: 'Issue Credential', action: () => setShowIssue(true) },
                    { label: 'Revoke Credential', action: null },
                    { label: 'Institution Settings', action: null },
                  ].map(({ label, action }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={action ?? undefined}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-200"
                    >
                      <span>{label}</span>
                      <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}
