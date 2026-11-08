import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

// 로그인하지 않은 사용자가 안쪽 화면에 들어오면 로그인 화면으로 보내는 문지기.
export default function RequireAuth() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-muted">불러오는 중…</div>
  }
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
