import { createContext } from 'react'

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type AuthContextValue = {
  status: AuthStatus
  // 로그인/가입이 성공했을 때 Access Token 을 받아 "로그인된 상태"로 바꾼다.
  completeLogin: (accessToken: string) => void
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
