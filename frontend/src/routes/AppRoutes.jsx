import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import MainLayout           from '../layouts/MainLayout.jsx'
import ProtectedRoute       from '../components/ProtectedRoute.jsx'
import Home                 from '../pages/Home.jsx'
import Login                from '../pages/Login.jsx'
import Register             from '../pages/Register.jsx'
import Dashboard            from '../pages/Dashboard.jsx'
import Unauthorized         from '../pages/Unauthorized.jsx'
import VerifyCertificate    from '../pages/VerifyCertificate.jsx'

// Redirect to dashboard if already logged in
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public pages with nav/footer layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
      </Route>

      {/* Guest-only pages (redirect to dashboard if logged in) */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Unauthorized page */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Public certificate verification (linked from QR codes on PDFs) */}
      <Route path="/verify/:certId" element={<VerifyCertificate />} />

      {/* Protected pages with nav/footer layout */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
