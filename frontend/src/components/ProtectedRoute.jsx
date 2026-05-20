import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Spinner() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()
  const location          = useLocation()

  if (loading) return <Spinner />

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
