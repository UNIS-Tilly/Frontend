// 백엔드 auth 패키지의 DTO와 모양을 맞춘다.

// 구글 로그인 결과. status 에 따라 들어 있는 값이 다르다.
//  - LOGGED_IN       : 기존 회원 → accessToken, userId
//  - SIGNUP_REQUIRED : 미가입     → signupToken, email  (닉네임을 입력받아 register 호출)
export type LoginResponse = {
  status: 'LOGGED_IN' | 'SIGNUP_REQUIRED'
  accessToken: string | null
  userId: number | null
  signupToken: string | null
  email: string | null
}

export type RegisterResponse = {
  accessToken: string
  userId: number
}

export type ReissueResponse = {
  accessToken: string
}

// 가입 화면으로 넘겨줄 때 쓰는 값
export type SignupState = {
  signupToken: string
  email: string
}
