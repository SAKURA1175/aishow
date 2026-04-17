import { Navigate } from 'react-router-dom'
import useStore from '@/store/useStore'

export default function ProtectedRoute({ children, roles }) {
  const user = useStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/chat" replace />
  }

  return children
}
