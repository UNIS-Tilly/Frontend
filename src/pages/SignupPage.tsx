import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { register } from '../api/auth'
import { ApiError } from '../api/client'
import { updateProfile, updateWorkEndTime } from '../api/users'
import BasicInfoStep from '../components/BasicInfoStep'
import CapacitiesStep from '../components/CapacitiesStep'
import TermsAgreeStep from '../components/TermsAgreeStep'
import { useAuth } from '../hooks/useAuth'
import { useProfileOptions } from '../hooks/useProfileOptions'
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

const EXPIRED_MESSAGE = '가입 시간이 지났어요. 처음부터 다시 로그인해 주세요.'

// 첫 로그인한 사용자가 가입을 마치는 화면. 한 주소(/signup) 안에서 단계를 바꿔 가며 보여 준다.
// 구글 로그인에서 받은 가입 토큰(signupToken)을 화면 이동 정보(location.state)로 넘겨받는다. 토큰은 30분 뒤 만료된다.
// 단계마다 입력한 값은 여기(부모)가 들고 있어서, 뒤로 갔다가 다시 와도 남아 있다.
export default function SignupPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const options = useProfileOptions()

  const [step, setStep] = useState<SignupStep>('terms')
  const [basicInfo, setBasicInfo] = useState<SignupBasicInfo>(EMPTY_BASIC_INFO)
  const [competencies, setCompetencies] = useState<string[]>([])

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [tokenExpired, setTokenExpired] = useState(false)
  // 가입(register)까지는 성공했는지. 뒤 단계(퇴근 시간·프로필 저장)가 실패해 다시 누르면 가입은 건너뛴다.
  const [registered, setRegistered] = useState(false)

  // 구글 콜백을 거치지 않고 직접 /signup 으로 들어온 경우(= 가입 토큰이 없음)는 로그인 화면으로 돌려보낸다.
  const signupState = location.state as SignupState | null
  if (!signupState?.signupToken) return <Navigate to="/login" replace />

  // 위쪽 바의 뒤로 가기: 첫 단계에서는 로그인 화면으로, 그 뒤 단계에서는 이전 단계로 간다.
  const handleBack = () => {
    if (step === 'terms') navigate('/login', { replace: true })
    else if (step === 'basic') setStep('terms')
    else setStep('basic')
  }

  // 0-4의 "다음": 지금까지 입력한 값을 서버에 저장하고 홈으로 간다.
  //  1) 가입 POST /auth/register (닉네임·성별·나이) → Access Token 을 받아 로그인 상태가 된다
  //  2) 퇴근 시간 PUT /users/me/work-end-time
  //  3) 프로필 PUT /users/me/profile (직군·역량 포함 전체)
  const handleComplete = async () => {
    const { nickname, gender, ageText, amPm, hour, minute } = basicInfo
    const age = ageText === '' ? null : Number(ageText)

    // 희망 직군을 바꾸고 돌아온 경우를 위해, 지금 희망 직군에 속하지 않는 직군 역량은 빼고 보낸다.
    const validCompetencies = competencies.filter((code) => {
      const competency = options.data?.competencies.find((item) => item.code === code)
      return (
        competency !== undefined &&
        (competency.type === 'COMMON' || competency.jobGroup === basicInfo.targetJobGroup)
      )
    })

    setSubmitting(true)
    setErrorMessage(null)
    try {
      if (!registered) {
        const result = await register({
          signupToken: signupState.signupToken,
          nickname: nickname.trim(),
          gender,
          age,
        })
        completeLogin(result.accessToken) // 여기서부터 로그인 상태라 아래 API 를 부를 수 있다
        setRegistered(true)
      }
      if (amPm && hour && minute) {
        await updateWorkEndTime(toTimeString(amPm, hour, minute))
      }
      await updateProfile({
        nickname: nickname.trim(),
        gender,
        age,
        currentJobGroup: basicInfo.currentJobGroup,
        targetJobGroup: basicInfo.targetJobGroup,
        competencies: validCompetencies,
      })
      navigate('/', { replace: true })
    } catch (error) {
      // 가입 토큰은 30분 뒤 만료된다. 만료·잘못된 토큰이면 처음부터 다시 로그인해야 한다.
      if (
        error instanceof ApiError &&
        (error.errorCode === 'EXPIRED_SIGNUP_TOKEN' || error.errorCode === 'INVALID_SIGNUP_TOKEN')
      ) {
        setTokenExpired(true)
        setErrorMessage(EXPIRED_MESSAGE)
      } else {
        setErrorMessage(error instanceof Error ? error.message : '가입에 실패했어요.')
      }
      setSubmitting(false)
    }
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

      <main className="flex flex-col items-center">
        {step === 'terms' && <TermsAgreeStep onNext={() => setStep('basic')} />}
        {step === 'basic' && (
          <BasicInfoStep
            value={basicInfo}
            onChange={(changed) => setBasicInfo((current) => ({ ...current, ...changed }))}
            onNext={() => setStep('capacities')}
          />
        )}
        {step === 'capacities' && (
          <CapacitiesStep
            targetJobGroup={basicInfo.targetJobGroup}
            selected={competencies}
            onChange={setCompetencies}
            onSubmit={() => void handleComplete()}
            submitting={submitting || tokenExpired}
            errorMessage={errorMessage}
          />
        )}
        {tokenExpired && (
          <Link to="/login" replace className="mt-xs text-body3 text-primary-600 underline">
            로그인 화면으로 돌아가기
          </Link>
        )}
      </main>
    </div>
  )
}
