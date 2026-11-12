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
      <div className="w-full max-w-sm rounded-l border border-gray-300 bg-white p-xl text-center">
        <h1 className="text-h1 font-bold text-primary-600">TILLY</h1>
        <p className="mt-xs text-body3 text-black-300">오늘 배운 것을, 퇴근 전 3분에 남겨요</p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isGoogleConfigured}
          className="mt-xl w-full rounded-s bg-primary-500 py-s text-button font-semibold text-white
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          구글로 시작하기
        </button>
        {!isGoogleConfigured && (
          <p className="mt-xs text-caption text-black-300">
            .env.local 에 VITE_GOOGLE_CLIENT_ID 를 설정하면 활성화돼요.
          </p>
        )}

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={handleDevLogin}
            className="mt-s w-full rounded-s border border-gray-300 py-s text-body3 text-black-300"
          >
            개발용 로그인 (dev-login)
          </button>
        )}

        {errorMessage && <p className="mt-m text-body3 text-danger">{errorMessage}</p>}
      </div>
    </div>
  )
}
