import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { register } from '../api/auth'
import TermsAgreeStep from '../components/TermsAgreeStep'
import { useAuth } from '../hooks/useAuth'
import type { SignupState } from '../types/auth'

// 가입 단계. 시안 순서: 0-2 약관 동의 → 0-3 기본 정보 → 0-4 역량
type SignupStep = 'terms' | 'basic'

// 첫 로그인한 사용자가 가입을 마치는 화면. 한 주소(/signup) 안에서 단계를 바꿔 가며 보여 준다.
// 구글 로그인에서 받은 가입 토큰(signupToken)을 화면 이동 정보(location.state)로 넘겨받는다. 토큰은 30분 뒤 만료된다.
export default function SignupPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState<SignupStep>('terms')

  // 구글 콜백을 거치지 않고 직접 /signup 으로 들어온 경우(= 가입 토큰이 없음)는 로그인 화면으로 돌려보낸다.
  const signupState = location.state as SignupState | null
  if (!signupState?.signupToken) return <Navigate to="/login" replace />

  // 위쪽 바의 뒤로 가기: 첫 단계에서는 로그인 화면으로, 그 뒤 단계에서는 이전 단계로 간다.
  const handleBack = () => {
    if (step === 'terms') navigate('/login', { replace: true })
    else setStep('terms')
  }

  return (
    <div className="relative min-h-screen bg-page pt-[138px] pb-5xl">
      {/* 위쪽 흰 바(높이 81) + 뒤로 가기(‹). 시안 좌표: 화살표 x51~62, y29.5~51.5 */}
      <header className="absolute inset-x-0 top-0 h-[81px] bg-white">
        <button
          type="button"
          onClick={handleBack}
          aria-label="뒤로 가기"
          className="absolute top-[28.5px] left-[44.5px] grid size-6 cursor-pointer place-items-center text-black-300"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
          >
            <path d="M17.5 23L6.5 12L17.5 1" />
          </svg>
        </button>
      </header>

      <main className="flex justify-center">
        {step === 'terms' && <TermsAgreeStep onNext={() => setStep('basic')} />}
        {step === 'basic' && <TemporaryBasicInfoStep signupState={signupState} />}
      </main>
    </div>
  )
}

// TODO(다음 작업, 시안 0-3·0-4): 기본 정보·역량 화면을 만들면 이 임시 단계를 지운다.
// 그때까지 가입이 끝까지 되도록, 예전 가입 화면(닉네임만 받고 가입)을 그대로 옮겨 두었다.
function TemporaryBasicInfoStep({ signupState }: { signupState: SignupState }) {
  const navigate = useNavigate()
  const { completeLogin } = useAuth()

  const [nickname, setNickname] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const nicknameLength = nickname.trim().length
  const nicknameValid = nicknameLength >= 2 && nicknameLength <= 10

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!nicknameValid) return

    setSubmitting(true)
    setErrorMessage('')
    try {
      const result = await register(signupState.signupToken, nickname.trim())
      completeLogin(result.accessToken)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '가입에 실패했어요.')
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-l border border-gray-300 bg-white p-xl"
    >
      <h1 className="text-h3 font-semibold">TILLY 시작하기</h1>
      <p className="mt-2xs text-body3 text-black-300">{signupState.email}</p>

      <label className="mt-l block text-body3 font-medium" htmlFor="nickname">
        닉네임
      </label>
      <input
        id="nickname"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        maxLength={10}
        placeholder="2~10자"
        className="mt-2xs w-full rounded-s border border-gray-300 px-s py-s outline-none focus:border-primary-500"
      />

      {errorMessage && <p className="mt-m text-body3 text-danger">{errorMessage}</p>}

      <button
        type="submit"
        disabled={!nicknameValid || submitting}
        className="mt-l w-full rounded-s bg-primary-500 py-s text-button font-semibold text-white
          disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? '가입 중…' : '가입하고 시작하기'}
      </button>
    </form>
  )
}
