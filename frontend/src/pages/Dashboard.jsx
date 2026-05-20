import { useAuth } from '../context/AuthContext.jsx'
import HolderDashboard     from './dashboards/HolderDashboard.jsx'
import UniversityDashboard from './dashboards/UniversityDashboard.jsx'
import VerifierDashboard   from './dashboards/VerifierDashboard.jsx'
import AdminDashboard      from './dashboards/AdminDashboard.jsx'

const DASHBOARD_MAP = {
  HOLDER:     HolderDashboard,
  UNIVERSITY: UniversityDashboard,
  VERIFIER:   VerifierDashboard,
  ADMIN:      AdminDashboard,
}

export default function Dashboard() {
  const { user } = useAuth()
  const RoleDashboard = DASHBOARD_MAP[user?.role] ?? HolderDashboard
  return <RoleDashboard />
}
