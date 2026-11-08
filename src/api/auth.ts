import type { LoginResponse, RegisterResponse } from '../types/auth'
import { apiFetch } from './client'

// 구글 인가 코드(code)를 백엔드에 보내 로그인한다. (구글 → 우리 프론트 콜백으로 받은 code)
export function loginWithGoogle(code: string) {
  return apiFetch<LoginResponse>('/api/auth/login/google', {
    method: 'POST',
    body: { code },
    auth: false,
  })
}

// 첫 로그인(SIGNUP_REQUIRED)이었던 사용자의 가입 완료
export function register(signupToken: string, nickname: string) {
  return apiFetch<RegisterResponse>('/api/auth/register', {
    method: 'POST',
    body: { signupToken, nickname },
    auth: false,
  })
}

export function logout() {
  return apiFetch<null>('/api/auth/logout', { method: 'POST' })
}

// 개발용 로그인. 백엔드가 local 프로파일로 켜져 있을 때만 동작한다. (구글 설정 없이 화면 개발 가능)
export function devLogin() {
  return apiFetch<{ accessToken: string; userId: number }>('/api/auth/dev-login', {
    method: 'POST',
    auth: false,
  })
}
