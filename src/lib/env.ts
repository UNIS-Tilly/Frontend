// 환경변수를 한곳에서 읽는다. 다른 파일에서는 import.meta.env 를 직접 쓰지 않고 여기서 가져다 쓴다.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
export const GOOGLE_REDIRECT_URI =
  import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? `${window.location.origin}/auth/callback/google`
