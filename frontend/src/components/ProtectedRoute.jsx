import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

export function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="auth-loading" role="status">VERIFYING YOUR SESSION</div>
  if (!user) return <Navigate to={role === 'admin' ? '/admin/login' : '/account'} replace state={{ from: location.pathname }} />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}
