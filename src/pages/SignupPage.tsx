import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { register } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import type { SignupState } from '../types/auth'

// 첫 로그인한 사용자가 닉네임을 정하고 가입을 마치는 화면.
// TODO(기획 확정 후): 기능명세서의 온보딩에는 성별·현재 직군·희망 직군·퇴근 시간·약관 버전 저장도 있지만,
//   백엔드 register API 는 아직 닉네임만 받는다. 백엔드와 필드를 맞춘 뒤 이 화면을 확장한다.
export default function SignupPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()

  const [nickname, setNickname] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 구글 콜백을 거치지 않고 직접 /signup 으로 들어온 경우(= 가입 토큰이 없음)는 로그인 화면으로 돌려보낸다.
  const signupState = location.state as SignupState | null
  if (!signupState?.signupToken) return <Navigate to="/login" replace />

  const nicknameLength = nickname.trim().length
  const nicknameValid = nicknameLength >= 2 && nicknameLength <= 10

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!nicknameValid || !agreed) return

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
    <div className="grid min-h-screen place-items-center px-4">
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

        <label className="mt-m flex items-center gap-xs text-body3">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
          />
          (필수) 서비스 이용약관 및 개인정보 처리방침에 동의합니다
        </label>
        {/* TODO: 약관 전문 링크 + 약관 버전 저장 (백엔드 API 필요) */}

        {errorMessage && <p className="mt-m text-body3 text-danger">{errorMessage}</p>}

        <button
          type="submit"
          disabled={!nicknameValid || !agreed || submitting}
          className="mt-l w-full rounded-s bg-primary-500 py-s text-button font-semibold text-white
            disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '가입 중…' : '가입하고 시작하기'}
        </button>
      </form>
    </div>
  )
}
