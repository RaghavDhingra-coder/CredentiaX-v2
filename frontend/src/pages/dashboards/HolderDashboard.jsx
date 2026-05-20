import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../services/api.js'
import toast from 'react-hot-toast'

function CredIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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

export default function HolderDashboard() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const credentialsPanelRef = useRef(null)

  const fetchCertificates = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/certificates/my-certificates')
      setCertificates(data.data.certificates)
    } catch (err) {
      toast.error('Failed to load certificates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCertificates()
  }, [fetchCertificates])

  const stats = [
    { label: 'My Credentials', value: String(certificates.length), note: certificates.length === 0 ? 'No credentials yet' : 'Credentials issued to you' },
    { label: 'Verified Today',  value: '0', note: 'Start verifying' },
    { label: 'Active DIDs',     value: '0', note: 'Connect wallet' },
    { label: 'Network Status',  value: 'Live', note: 'All systems operational', green: true },
  ]

  return (
    <div className="w-full">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-8 sm:py-10">

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            Credential Holder
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Welcome, {user?.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">View and manage your credentials</p>
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

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

          {/* Credentials panel */}
          <div ref={credentialsPanelRef} className="lg:col-span-2 bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
              <h2 className="font-semibold text-white text-sm sm:text-base">My Credentials</h2>
              <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0">View all</button>
            </div>

            {loading ? (
              <div className="px-6 py-10 text-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Loading credentials…</p>
              </div>
            ) : certificates.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-3">
                  <CredIcon />
                </div>
                <p className="text-slate-400 text-sm font-medium mb-1">No credentials yet</p>
                <p className="text-slate-500 text-xs">Credentials issued to you by institutions will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {certificates.map((cert) => (
                  <div
                    key={cert.id}
                    className="px-5 sm:px-6 py-5 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-white mb-1">{cert.title}</h3>
                        <p className="text-sm text-slate-400 mb-2">{cert.course}</p>
                        {cert.description && (
                          <p className="text-xs text-slate-500 mb-2">{cert.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            {new Date(cert.issueDate).toLocaleDateString()}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                            {cert.certificateId}
                          </span>
                          {cert.isRevoked ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Active
                            </span>
                          )}
                          {cert.blockchainTxHash && (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                              </svg>
                              On-chain
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => window.open(`/api/v1/certificates/file/${cert.certificateId}`, '_blank')}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors whitespace-nowrap"
                        >
                          <DownloadIcon />
                          Download
                        </button>
                        {cert.blockchainTxHash && (
                          <a
                            href={`https://amoy.polygonscan.com/tx/${cert.blockchainTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium transition-colors whitespace-nowrap text-center"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            View TX
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Issued by</span>
                        <span className="text-white font-medium">{cert.issuedByUser?.name}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{cert.issuedByUser?.email}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-4 sm:gap-5">

            {/* Profile card */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-4">My Profile</h2>
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 mx-auto mb-3 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <p className="text-center text-white text-sm font-medium">{user?.name}</p>
              <p className="text-center text-slate-400 text-xs mt-0.5">{user?.email}</p>
              <div className="mt-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Role</span>
                  <span className="text-indigo-400 font-medium">Credential Holder</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span className="text-slate-500">Member since</span>
                  <span className="text-slate-300">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 sm:p-6">
              <h2 className="font-semibold text-white text-sm sm:text-base mb-3">Quick Actions</h2>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: 'View Credentials', action: () => credentialsPanelRef.current?.scrollIntoView({ behavior: 'smooth' }) },
                  { label: 'Verify a Credential', action: () => window.open('/verify', '_blank') },
                ].map(({ label, action }) => (
                  <button key={label} type="button" onClick={action} className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-200">
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
  )
}
