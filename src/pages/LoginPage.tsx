import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { devLogin } from '../api/auth'
import googleLogoUrl from '../assets/google-logo.png'
import loginTreeUrl from '../assets/login-tree.png'
import logoUrl from '../assets/logo.svg'
import { useAuth } from '../hooks/useAuth'
import { buildGoogleLoginUrl, isGoogleConfigured } from '../lib/googleOAuth'

// 로그인 화면. 시안: docs/design/screens/0-signup/0-1-login.svg (1440×900)
// 로그인은 구글만 지원한다. 처음 온 사용자는 구글 로그인 뒤 서버가 SIGNUP_REQUIRED 를 주면 가입 화면으로 간다(GoogleCallbackPage).
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
    // 내용은 위쪽 흰 바와 상관없이 화면 전체의 세로 가운데에 놓인다(시안 좌표 기준).
    <div className="relative grid min-h-screen place-items-center bg-page">
      {/* 위쪽 흰 바 (높이 81). 시안 왼쪽의 뒤로 가기(‹)는 로그인에서 돌아갈 곳이 없어 디자이너 확인 전까지 비워 둔다 */}
      <header className="absolute inset-x-0 top-0 h-[81px] bg-white" />

      <main className="flex flex-col items-center">
        <img src={loginTreeUrl} alt="" className="h-[104px] w-[95px]" />
        <h1 className="mt-l">
          <img src={logoUrl} alt="TILLY" className="w-[140px]" />
        </h1>
        {/* 간격 21px: 시안은 24px 이지만, 확정 로고(logo.svg)가 시안 속 로고보다 3px 높아서 그만큼 뺐다 */}
        <p className="mt-[21px] text-h3 font-semibold text-black-300">
          경험 기록과 개선을 함께하는 나만의 커리어 컨설턴트
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isGoogleConfigured}
          className="mt-2xl flex h-12 w-[500px] cursor-pointer items-center justify-center gap-[10px] rounded-m bg-white text-h3 font-semibold text-black-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <img src={googleLogoUrl} alt="" className="h-[21px] w-5" />
          Google로 계속하기
        </button>

        {/* 누르면 어디로 갈지 정해지지 않아(2026-11-26 사용자 결정) 지금은 글자만 보여 준다 */}
        <p className="mt-xs text-body2 text-black-300">로그인에 문제가 있나요?</p>
      </main>

      {/* 시안에 없는 개발용 안내·버튼. 시안 배치를 밀지 않게 화면 아래에 따로 띄운다.
          배포 화면(npm run build)에는 나오지 않는다 */}
      {import.meta.env.DEV && (
        <div className="absolute inset-x-0 bottom-xl flex flex-col items-center gap-xs">
          {!isGoogleConfigured && (
            <p className="text-caption font-normal text-black-300">
              .env.local 에 VITE_GOOGLE_CLIENT_ID 를 설정하면 구글 로그인이 활성화돼요.
            </p>
          )}
          <button
            type="button"
            onClick={handleDevLogin}
            className="cursor-pointer rounded-s border border-gray-300 px-m py-xs text-body3 text-black-300"
          >
            개발용 로그인 (dev-login)
          </button>
          {errorMessage && <p className="text-body3 text-danger">{errorMessage}</p>}
        </div>
      )}
    </div>
  )
}
