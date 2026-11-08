import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } from './env'

const STATE_KEY = 'tilly:oauth-state'

export const isGoogleConfigured = GOOGLE_CLIENT_ID !== ''

// 구글 로그인 화면으로 보낼 주소를 만든다. (인가 코드 방식: 로그인이 끝나면 구글이 ?code=... 를 붙여 GOOGLE_REDIRECT_URI 로 돌려보낸다)
// state 는 "내가 시작한 로그인이 맞는지" 확인하기 위한 일회용 값이다. (CSRF 방지)
export function buildGoogleLoginUrl() {
  const state = crypto.randomUUID()
  try {
    sessionStorage.setItem(STATE_KEY, state)
  } catch {
    // 저장이 막힌 브라우저(시크릿 모드 등)에서는 state 검증 없이 진행된다.
  }

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'openid email',
    state,
    prompt: 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// 콜백에서 돌아온 state 가 로그인 시작 때 저장한 값과 같은지 확인한다. (한 번 쓰면 지운다)
export function consumeAndVerifyState(returnedState: string | null) {
  try {
    const saved = sessionStorage.getItem(STATE_KEY)
    sessionStorage.removeItem(STATE_KEY)
    return saved !== null && saved === returnedState
  } catch {
    return true
  }
}
