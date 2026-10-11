import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Loader from './Loader'

/**
 * Guards routes: redirects guests to /login and blocks users
 * whose role is not in `roles` (e.g. roles={['admin']}).
 */
export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Loader full />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// Keeps logged-in users away from the login/register pages
export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <Loader full />
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />
}
