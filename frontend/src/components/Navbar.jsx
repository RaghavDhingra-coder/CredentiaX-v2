import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import WalletButton from './WalletButton.jsx'

const ROLE_COLORS = {
  HOLDER:     'text-indigo-400',
  UNIVERSITY: 'text-sky-400',
  VERIFIER:   'text-emerald-400',
  ADMIN:      'text-violet-400',
}

const ROLE_LABELS = {
  HOLDER:     'Credential Holder',
  UNIVERSITY: 'University',
  VERIFIER:   'Verifier',
  ADMIN:      'Admin',
}

const NAV_LINKS = [
  { label: 'Home',      to: '/' },
  { label: 'Dashboard', to: '/dashboard', requireAuth: true },
]

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}

export default function Navbar() {
  const { pathname }    = useLocation()
  const { user, logout} = useAuth()
  const navigate        = useNavigate()
  const [open, setOpen] = useState(false)
  const close           = () => setOpen(false)

  async function handleLogout() {
    try {
      await logout()
      toast.success('Signed out successfully')
      navigate('/', { replace: true })
    } catch {
      toast.error('Logout failed')
    }
    close()
  }

  const visibleLinks = NAV_LINKS.filter((l) => !l.requireAuth || !!user)

  return (
    <nav className="w-full sticky top-0 z-50 border-b border-slate-700/60 bg-slate-900/90 backdrop-blur-md">
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12">
        <div className="h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" onClick={close} className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-400 transition-colors">
              <ShieldIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-base tracking-tight">CredentiaX</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-1">
            {visibleLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === to
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Desktop right side */}
          <div className="hidden sm:flex items-center gap-3">
            {user?.role === 'UNIVERSITY' && <WalletButton />}
            {user ? (
              <>
                <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="leading-none">
                    <p className="text-white text-xs font-semibold truncate max-w-[120px]">{user.name}</p>
                    <p className={`text-xs ${ROLE_COLORS[user.role] || 'text-slate-400'}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/8 transition-all duration-200"
                >
                  <LogoutIcon />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-500/20 whitespace-nowrap shrink-0"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="sm:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-md">
          <div className="px-5 pt-3 pb-4 flex flex-col gap-1">
            {visibleLinks.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-indigo-500/15 text-indigo-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {label}
              </Link>
            ))}

            {user?.role === 'UNIVERSITY' && (
              <div className="mt-1">
                <WalletButton className="w-full justify-center" />
              </div>
            )}
            {user ? (
              <>
                <div className="flex items-center gap-2.5 px-4 py-3 mt-1 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{user.name}</p>
                    <p className={`text-xs ${ROLE_COLORS[user.role] || 'text-slate-400'}`}>
                      {ROLE_LABELS[user.role] ?? user.role}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/8 transition-colors"
                >
                  <LogoutIcon />
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={close}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={close}
                  className="mt-1 px-4 py-3 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-center shadow-lg shadow-indigo-500/20"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
