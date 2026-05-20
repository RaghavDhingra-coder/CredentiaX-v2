const stats = [
  { label: 'Credentials Issued', value: '0', delta: 'No credentials yet' },
  { label: 'Verified Today', value: '0', delta: 'Start verifying' },
  { label: 'Active DIDs', value: '0', delta: 'Connect wallet' },
  { label: 'Network Status', value: 'Live', delta: 'All systems operational', accent: true },
]

const placeholderCredentials = [
  { id: 1, name: 'University Degree', issuer: 'MIT', status: 'pending', date: '--' },
  { id: 2, name: 'Professional License', issuer: 'IEEE', status: 'pending', date: '--' },
]

const statusStyles = {
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  revoked: 'bg-red-500/10 text-red-400 border-red-500/20',
}

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage your decentralized identity and credentials</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Issue Credential
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, delta, accent }) => (
          <div
            key={label}
            className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className={`text-3xl font-bold mb-1 ${accent ? 'text-emerald-400' : 'text-white'}`}>
              {value}
            </div>
            <div className="text-sm font-medium text-white mb-0.5">{label}</div>
            <div className="text-xs text-slate-500">{delta}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Credentials Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">My Credentials</h2>
            <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              View all
            </button>
          </div>
          <div className="divide-y divide-slate-800">
            {placeholderCredentials.map(({ id, name, issuer, status, date }) => (
              <div key={id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{name}</div>
                    <div className="text-xs text-slate-500">Issued by {issuer} · {date}</div>
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[status]}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-8 text-center text-slate-500 text-sm">
            Connect your wallet to load your on-chain credentials
          </div>
        </div>

        {/* Identity Panel */}
        <div className="flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">My Identity (DID)</h2>
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <p className="text-center text-sm text-slate-400 mb-4">No wallet connected</p>
            <div className="bg-slate-800 rounded-xl p-3 font-mono text-xs text-slate-500 break-all text-center mb-4">
              did:ethr:0x0000...0000
            </div>
            <button
              type="button"
              className="w-full py-2.5 rounded-xl border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white text-sm font-medium transition-all"
            >
              Connect Wallet
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2">
              {['Issue New Credential', 'Verify a Credential', 'Revoke Credential'].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="w-full text-left px-4 py-3 rounded-xl text-sm text-slate-300 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
