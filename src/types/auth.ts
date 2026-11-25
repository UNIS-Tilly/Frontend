import type { Gender } from './meta'

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

// POST /api/auth/register 요청. nickname 2~10자, age 정수 14~100([임시])
export type RegisterRequest = {
  signupToken: string
  nickname: string
  gender: Gender | null
  age: number | null
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

// 가입 0-3(기본 정보)에서 입력받는 값. 서버 DTO가 아니라 화면끼리 주고받는 값이다.
// 0-4(역량)까지 마친 뒤 한꺼번에 서버로 보낸다: register(닉네임·성별·나이) → 퇴근 시간 → 프로필(직군·역량)
export type SignupBasicInfo = {
  nickname: string
  gender: Gender | null
  ageText: string // 입력칸 글자 그대로 (비어 있으면 나이 미입력)
  amPm: string | null
  hour: string | null
  minute: string | null
  currentJobGroup: string | null
  targetJobGroup: string | null
}
