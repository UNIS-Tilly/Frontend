// Access Token은 메모리(변수)에만 둔다. localStorage에 두면 XSS로 탈취될 수 있어서이다.
// 새로고침하면 사라지지만, HttpOnly 쿠키의 Refresh Token으로 /api/auth/reissue 를 호출해 다시 받는다.
let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}
