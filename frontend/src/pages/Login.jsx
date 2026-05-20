import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext.jsx'

function ShieldIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
}

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || '/dashboard'

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [submitting, setSub]  = useState(false)

  function onChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: undefined }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setSub(true)
    try {
      await login(form)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      const data = err.response?.data
      if (data?.errors) {
        setErrors(data.errors)
      } else {
        toast.error(data?.message || 'Login failed. Please try again.')
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
          <h1 className="mt-6 text-xl sm:text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1.5 text-slate-400 text-sm">Sign in to your account to continue</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/40">

          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
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
                autoComplete="current-password"
                placeholder="••••••••"
                value={form.password}
                onChange={onChange}
                disabled={submitting}
                className={`w-full px-4 py-3 rounded-xl bg-slate-800 border text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow ${errors.password ? 'border-red-500' : 'border-slate-600'}`}
              />
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 duration-200"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create account
          </Link>
        </p>
        <p className="text-center mt-3 text-xs text-slate-600">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
