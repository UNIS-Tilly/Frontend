import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { devLogin } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { buildGoogleLoginUrl, isGoogleConfigured } from '../lib/googleOAuth'

export default function LoginPage() {
  const { status, completeLogin } = useAuth()
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState('')

  // 이미 로그인된 사용자가 /login 에 오면 홈으로 보낸다.
  if (status === 'authenticated') return <Navigate to="/" replace />

  const handleGoogleLogin = () => {
    window.location.href = buildGoogleLoginUrl() // 구글 로그인 화면으로 이동
  }

  // 개발용: 구글 설정 없이 테스트 계정으로 로그인 (백엔드 local 프로파일 + npm run dev 에서만 보인다)
  const handleDevLogin = async () => {
    try {
      const result = await devLogin()
      completeLogin(result.accessToken)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '개발용 로그인에 실패했어요.')
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface p-8 text-center">
        <h1 className="text-3xl font-bold text-brand-600">TILLY</h1>
        <p className="mt-2 text-sm text-muted">오늘 배운 것을, 퇴근 전 3분에 남겨요</p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isGoogleConfigured}
          className="mt-8 w-full rounded-xl bg-brand-500 py-3 font-semibold text-white
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          구글로 시작하기
        </button>
        {!isGoogleConfigured && (
          <p className="mt-2 text-xs text-muted">
            .env.local 에 VITE_GOOGLE_CLIENT_ID 를 설정하면 활성화돼요.
          </p>
        )}

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={handleDevLogin}
            className="mt-3 w-full rounded-xl border border-line py-2.5 text-sm text-muted"
          >
            개발용 로그인 (dev-login)
          </button>
        )}

        {errorMessage && <p className="mt-4 text-sm text-danger">{errorMessage}</p>}
      </div>
    </div>
  )
}
