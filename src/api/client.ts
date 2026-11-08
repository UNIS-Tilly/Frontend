import { API_BASE_URL } from '../lib/env'
import { getAccessToken, setAccessToken } from '../lib/token'
import type { ApiResponse } from '../types/api'
import type { ReissueResponse } from '../types/auth'

// 백엔드가 실패 응답을 주면 이 에러로 바꿔서 던진다.
// 화면에서는 error.message 를 그대로 사용자에게 보여주거나, error.errorCode 로 분기한다.
export class ApiError extends Error {
  status: number
  errorCode: string

  constructor(status: number, errorCode: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errorCode = errorCode
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  // false 면 Authorization 헤더를 붙이지 않고, 401 이어도 재발급을 시도하지 않는다. (로그인 등)
  auth?: boolean
  headers?: Record<string, string>
}

// 재발급에 완전히 실패했을 때(= 로그인이 풀렸을 때) AuthProvider 가 화면 상태를 바꿀 수 있게 알려주는 통로
let onAuthFailure: (() => void) | null = null

export function setAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler
}

// 실제로 서버에 요청 한 번을 보내고, 백엔드의 공통 응답(ApiResponse)에서 data 만 꺼내 돌려준다.
async function request<T>(path: string, options: RequestOptions): Promise<T> {
  const { method = 'GET', body, auth = true, headers = {} } = options

  const finalHeaders: Record<string, string> = { ...headers }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'

  const token = getAccessToken()
  if (auth && token) finalHeaders.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      // Refresh Token 쿠키를 주고받으려면 필요하다.
      credentials: 'include',
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.')
  }

  // 서버 앞단(프록시 등)에서 JSON 이 아닌 에러 페이지를 줄 수도 있어서 실패해도 죽지 않게 한다.
  let json: ApiResponse<T> | null = null
  try {
    json = await response.json()
  } catch {
    json = null
  }

  if (!response.ok || !json?.success) {
    throw new ApiError(
      response.status,
      json?.errorCode ?? 'UNKNOWN_ERROR',
      json?.message ?? '요청에 실패했어요. 잠시 후 다시 시도해 주세요.',
    )
  }

  return json.data
}

// Access Token 재발급. 여러 곳에서 동시에 호출돼도 서버 요청은 한 번만 보낸다.
// (Refresh Token 은 한 번 쓰면 새것으로 바뀌는 방식이라, 동시에 두 번 보내면 두 번째가 실패한다.)
let refreshPromise: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = request<ReissueResponse>('/api/auth/reissue', {
      method: 'POST',
      auth: false,
      // 백엔드가 CSRF 방지용으로 요구하는 헤더
      headers: { 'X-Tilly-Client': 'web' },
    })
      .then((data) => {
        setAccessToken(data.accessToken)
        return data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

// 화면/훅에서 서버를 부를 때 쓰는 공통 함수.
// Access Token 이 만료돼 401 이 오면, 재발급을 받은 뒤 같은 요청을 한 번 더 보낸다.
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  try {
    return await request<T>(path, options)
  } catch (error) {
    const isAuthError = error instanceof ApiError && error.status === 401 && options.auth !== false
    if (!isAuthError) throw error

    try {
      await refreshAccessToken()
    } catch {
      // 재발급도 실패 = 로그인이 풀린 상태
      setAccessToken(null)
      onAuthFailure?.()
      throw error
    }
    return request<T>(path, options)
  }
}
