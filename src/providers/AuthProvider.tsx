import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { logout } from '../api/auth'
import { refreshAccessToken, setAuthFailureHandler } from '../api/client'
import { setAccessToken } from '../lib/token'
import { AuthContext, type AuthStatus } from './authContext'

// 앱 전체에 "로그인 상태"를 알려주는 컴포넌트. (Spring 의 SecurityContext 와 비슷한 역할)
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AuthStatus>('loading')

  // 앱이 처음 뜰 때: 쿠키에 Refresh Token 이 남아 있으면 Access Token 을 다시 받아 로그인 상태를 복구한다.
  useEffect(() => {
    setAuthFailureHandler(() => setStatus('unauthenticated'))

    // 주의: 이 요청이 끝나기 전에 사용자가 이미 로그인을 마쳤을 수 있다. (예: 구글 콜백 화면)
    // 그 경우 늦게 도착한 "실패" 결과가 로그인 상태를 덮어쓰지 않도록, 아직 '확인 중'일 때만 반영한다.
    refreshAccessToken()
      .then(() => setStatus('authenticated'))
      .catch(() => setStatus((current) => (current === 'loading' ? 'unauthenticated' : current)))

    return () => setAuthFailureHandler(null)
  }, [])

  const completeLogin = useCallback((accessToken: string) => {
    setAccessToken(accessToken)
    setStatus('authenticated')
  }, [])

  const signOut = useCallback(async () => {
    try {
      await logout()
    } catch {
      // 서버 로그아웃이 실패해도 이 기기에서는 로그아웃 처리한다.
    }
    setAccessToken(null)
    queryClient.clear() // 이전 사용자의 데이터가 화면에 남지 않게 캐시를 비운다.
    setStatus('unauthenticated')
  }, [queryClient])

  const value = useMemo(
    () => ({ status, completeLogin, signOut }),
    [status, completeLogin, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
