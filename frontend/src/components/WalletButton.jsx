import { useWallet } from '../context/WalletContext.jsx'

function truncateAddress(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function MetaMaskIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32.958 1L19.199 11.287l2.52-5.97L32.958 1z" fill="#E2761B" stroke="#E2761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.03 1l13.643 10.38-2.396-6.063L2.03 1zM28.16 23.534l-3.662 5.614 7.838 2.157 2.252-7.647-6.428-.124zM.425 23.658l2.24 7.647 7.838-2.157-3.662-5.614-6.416.124z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10.1 14.453l-2.19 3.313 7.804.347-.277-8.39-5.337 4.73zM24.888 14.453l-5.407-4.822-.18 8.482 7.792-.347-2.205-3.313zM10.503 29.148l4.697-2.29-4.047-3.16-.65 5.45zM19.788 26.858l4.71 2.29-.664-5.45-4.046 3.16z" fill="#E4761B" stroke="#E4761B" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function WalletButton({ className = '' }) {
  const { address, network, isCorrectNetwork, connecting, isInstalled, connect, disconnect, switchToAmoy } = useWallet()

  if (!isInstalled) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors ${className}`}
      >
        <MetaMaskIcon />
        Install MetaMask
      </a>
    )
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={connecting}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <MetaMaskIcon />
        {connecting ? 'Connecting…' : 'Connect Wallet'}
      </button>
    )
  }

  if (!isCorrectNetwork) {
    return (
      <button
        type="button"
        onClick={switchToAmoy}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors ${className}`}
      >
        <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 animate-pulse" />
        Wrong Network — Switch
      </button>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <button
        type="button"
        title={address}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
        <span>{truncateAddress(address)}</span>
        <span className="text-emerald-600 hidden sm:inline">· {network}</span>
      </button>
      <button
        type="button"
        onClick={disconnect}
        title="Disconnect wallet"
        className="px-2 py-2 rounded-lg text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/8 transition-colors"
      >
        ×
      </button>
    </div>
  )
}
