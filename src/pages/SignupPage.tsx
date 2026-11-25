import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { register } from '../api/auth'
import { ApiError } from '../api/client'
import { updateWorkEndTime } from '../api/users'
import BasicInfoStep from '../components/BasicInfoStep'
import TermsAgreeStep from '../components/TermsAgreeStep'
import { useAuth } from '../hooks/useAuth'
import { toTimeString } from '../lib/time'
import type { SignupBasicInfo, SignupState } from '../types/auth'

// 가입 단계. 시안 순서: 0-2 약관 동의 → 0-3 기본 정보 → 0-4 역량
type SignupStep = 'terms' | 'basic' | 'capacities'

const EMPTY_BASIC_INFO: SignupBasicInfo = {
  nickname: '',
  gender: null,
  ageText: '',
  amPm: null,
  hour: null,
  minute: null,
  currentJobGroup: null,
  targetJobGroup: null,
}

// 첫 로그인한 사용자가 가입을 마치는 화면. 한 주소(/signup) 안에서 단계를 바꿔 가며 보여 준다.
// 구글 로그인에서 받은 가입 토큰(signupToken)을 화면 이동 정보(location.state)로 넘겨받는다. 토큰은 30분 뒤 만료된다.
// 단계마다 입력한 값은 여기(부모)가 들고 있어서, 뒤로 갔다가 다시 와도 남아 있다.
export default function SignupPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [step, setStep] = useState<SignupStep>('terms')
  const [basicInfo, setBasicInfo] = useState<SignupBasicInfo>(EMPTY_BASIC_INFO)

  // 구글 콜백을 거치지 않고 직접 /signup 으로 들어온 경우(= 가입 토큰이 없음)는 로그인 화면으로 돌려보낸다.
  const signupState = location.state as SignupState | null
  if (!signupState?.signupToken) return <Navigate to="/login" replace />

  // 위쪽 바의 뒤로 가기: 첫 단계에서는 로그인 화면으로, 그 뒤 단계에서는 이전 단계로 간다.
  const handleBack = () => {
    if (step === 'terms') navigate('/login', { replace: true })
    else if (step === 'basic') setStep('terms')
    else setStep('basic')
  }

  return (
    <div className="relative min-h-screen bg-page pt-[138px] pb-[98px]">
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
        {step === 'basic' && (
          <BasicInfoStep
            value={basicInfo}
            onChange={(changed) => setBasicInfo((current) => ({ ...current, ...changed }))}
            onNext={() => setStep('capacities')}
          />
        )}
        {step === 'capacities' && (
          <TemporaryFinishStep signupState={signupState} basicInfo={basicInfo} />
        )}
      </main>
    </div>
  )
}

// TODO(다음 작업, 시안 0-4): 역량 선택 화면을 만들면 이 임시 단계를 지운다.
// 그때까지 가입이 끝까지 되도록, 0-3에서 받은 값 중 지금 저장할 수 있는 것(닉네임·성별·나이·퇴근 시간)만 저장하고 가입을 마친다.
// 직군은 역량과 함께 프로필 API(PUT /users/me/profile, 공통 역량 1개 이상 필수)로 보내야 해서 0-4에서 저장한다.
function TemporaryFinishStep({
  signupState,
  basicInfo,
}: {
  signupState: SignupState
  basicInfo: SignupBasicInfo
}) {
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleFinish = async () => {
    setSubmitting(true)
    setErrorMessage('')
    try {
      const result = await register({
        signupToken: signupState.signupToken,
        nickname: basicInfo.nickname.trim(),
        gender: basicInfo.gender,
        age: basicInfo.ageText === '' ? null : Number(basicInfo.ageText),
      })
      completeLogin(result.accessToken) // 여기서부터 로그인 상태라 아래 API 를 부를 수 있다

      if (basicInfo.amPm && basicInfo.hour && basicInfo.minute) {
        await updateWorkEndTime(toTimeString(basicInfo.amPm, basicInfo.hour, basicInfo.minute))
      }
      navigate('/', { replace: true })
    } catch (error) {
      // 가입 토큰은 30분 뒤 만료된다. 만료·잘못된 토큰이면 처음부터 다시 로그인해야 한다.
      if (
        error instanceof ApiError &&
        (error.errorCode === 'EXPIRED_SIGNUP_TOKEN' || error.errorCode === 'INVALID_SIGNUP_TOKEN')
      ) {
        setErrorMessage('가입 시간이 지났어요. 처음부터 다시 로그인해 주세요.')
      } else {
        setErrorMessage(error instanceof Error ? error.message : '가입에 실패했어요.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-[500px] flex-col items-center gap-m text-center">
      <p className="text-body2 text-black-300">
        역량 선택 화면(0-4)은 다음 작업에서 만들어요. 지금은 여기서 가입을 마칠 수 있어요.
      </p>
      {errorMessage && <p className="text-body3 text-danger">{errorMessage}</p>}
      <button
        type="button"
        onClick={() => void handleFinish()}
        disabled={submitting}
        className="h-[42px] w-full cursor-pointer rounded-m bg-primary-500 text-button font-semibold text-white disabled:cursor-default disabled:bg-gray-400"
      >
        {submitting ? '가입 중…' : '가입하고 시작하기 (임시)'}
      </button>
    </div>
  )
}
