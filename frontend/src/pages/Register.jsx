import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'
import { useWallet } from '../context/WalletContext.jsx'

const ROLES = [
  { value: 'UNIVERSITY', label: 'Institution / University', desc: 'Issue credentials to holders' },
  { value: 'VERIFIER',   label: 'Verifier',                  desc: 'Verify credential authenticity' },
]

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

export default function Register() {
  const { register } = useAuth()
  const { connect, isInstalled } = useWallet()
  const navigate     = useNavigate()

  const [form, setForm]      = useState({ name: '', email: '', password: '', role: 'UNIVERSITY' })
  const [errors, setErrors]  = useState({})
  const [submitting, setSub] = useState(false)

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSub(true)
    try {
      await register(form)
      toast.success('Account created! Welcome to CredentiaX.')
      if (form.role === 'UNIVERSITY' && isInstalled) {
        try { await connect() } catch { /* non-blocking */ }
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setErrors(data.errors)
      } else {
        toast.error(data?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setSub(false)
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4 py-12"
      style={{
        background:
          'radial-gradient(ellipse 80% 50% at 50% 30%, rgba(99,102,241,0.12) 0%, transparent 65%), #0f172a',
      }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:bg-indigo-400 transition-colors">
              <ShieldIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">CredentiaX</span>
          </Link>
          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1.5 text-slate-400 text-sm">Register as an institution or verifier</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Smith"
                value={form.name}
                onChange={onChange}
                disabled={submitting}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.name ? 'border-red-500' : 'border-slate-600'}`}
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={onChange}
                disabled={submitting}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.email ? 'border-red-500' : 'border-slate-600'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={onChange}
                disabled={submitting}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.password ? 'border-red-500' : 'border-slate-600'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Role selection */}
            <div>
              <p className="block text-sm font-medium text-slate-300 mb-2">Account type</p>
              <div className="flex flex-col gap-2">
                {ROLES.map(({ value, label, desc }) => {
                  const active = form.role === value
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => { setForm((f) => ({ ...f, role: value })); setErrors((e) => ({ ...e, role: undefined })) }}
                      disabled={submitting}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                        active
                          ? 'border-indigo-500 bg-indigo-500/10'
                          : 'border-slate-700 hover:border-slate-500 bg-slate-800/40'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${active ? 'border-indigo-400' : 'border-slate-600'}`}>
                        {active && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${active ? 'text-indigo-300' : 'text-slate-300'}`}>{label}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                      {active && <CheckIcon />}
                    </button>
                  )
                })}
              </div>
              {errors.role && <p className="mt-1 text-xs text-red-400">{errors.role}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 duration-200 mt-1"
            >
              {submitting ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Sign in
          </Link>
        </p>
        <p className="text-center mt-3 text-xs text-slate-600">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
