import { useContext } from 'react'
import { AuthContext } from '../providers/authContext'

// 화면에서 로그인 상태를 읽거나 로그아웃할 때 쓴다.  const { status, signOut } = useAuth()
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth 는 AuthProvider 안에서만 사용할 수 있어요.')
  return context
}
