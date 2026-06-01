import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/stores/app-store'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated)
  const token = localStorage.getItem('access_token')

  if (!isAuthenticated && !token) {
    return <Navigate to="/connect" replace />
  }

  return <>{children}</>
}
