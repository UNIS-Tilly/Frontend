import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { loginWithGoogle } from '../api/auth'
import { useAuth } from '../hooks/useAuth'
import { consumeAndVerifyState } from '../lib/googleOAuth'
import type { SignupState } from '../types/auth'

// 구글 로그인을 마친 뒤 구글이 돌려보내는 화면. 주소에 붙은 code 를 백엔드로 넘겨 로그인을 마무리한다.
export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const [requestError, setRequestError] = useState('')

  const code = searchParams.get('code')
  const returnedState = searchParams.get('state')

  // 구글에서 사용자가 로그인을 취소했거나 code 가 없는 경우는 서버에 물어볼 필요 없이 바로 알 수 있다.
  const immediateError =
    searchParams.get('error') || !code ? '구글 로그인이 취소되었거나 실패했어요.' : ''

  // 개발 모드(StrictMode)에서는 useEffect 가 두 번 실행된다. 그런데 구글 code 는 한 번만 쓸 수 있어서
  // 두 번째 요청이 실패한다. 이미 처리했는지 기억해 두었다가 한 번만 보낸다.
  const handled = useRef(false)

  useEffect(() => {
    if (immediateError || !code || handled.current) return
    handled.current = true

    async function finishLogin(authCode: string) {
      try {
        if (!consumeAndVerifyState(returnedState)) {
          throw new Error('잘못된 접근이에요. 처음부터 다시 로그인해 주세요.')
        }

        const result = await loginWithGoogle(authCode)

        if (result.status === 'LOGGED_IN' && result.accessToken) {
          completeLogin(result.accessToken)
          navigate('/', { replace: true })
        } else if (result.signupToken && result.email) {
          // 첫 로그인: 가입 화면으로 보내 닉네임 등을 입력받는다.
          const state: SignupState = { signupToken: result.signupToken, email: result.email }
          navigate('/signup', { replace: true, state })
        } else {
          throw new Error('로그인 응답이 올바르지 않아요.')
        }
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : '로그인에 실패했어요.')
      }
    }

    void finishLogin(code)
  }, [immediateError, code, returnedState, navigate, completeLogin])

  const errorMessage = immediateError || requestError

  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      {errorMessage ? (
        <div>
          <p className="text-danger">{errorMessage}</p>
          <Link to="/login" className="mt-4 inline-block text-sm text-brand-700 underline">
            로그인 화면으로 돌아가기
          </Link>
        </div>
      ) : (
        <p className="text-muted">로그인 중이에요…</p>
      )}
    </div>
  )
}
