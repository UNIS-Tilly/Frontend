// 백엔드 user 패키지의 DTO와 모양을 맞춘다. (API_SPEC v0.5 4.1~4.2)
import type { Gender } from './meta'

// GET /api/users/me (PUT /users/me/profile 응답도 같은 모양)
export type UserInfo = {
  nickname: string
  email: string
  // "HH:mm" 형식 (예: "18:30"). 설정하지 않았으면 null
  workEndTime: string | null
  gender: Gender | null
  age: number | null
  currentJobGroup: string | null // 재직(현재 인턴) 직군 code
  targetJobGroup: string | null // 희망 직군 code
  competencies: string[] // 얻고 싶은 역량 code (공통 + 희망 직군)
  level: number // 성장 레벨 1~9 (9 다음은 1)
}

// PUT /api/users/me/profile 요청. 전체 교체라 선택 항목은 null 이 "해제"다.
// 규칙: 닉네임 2~10자, 공통 역량 1~3개 필수, 희망 직군을 고르면 그 직군 역량 2~5개 필수
export type ProfileUpdateRequest = {
  nickname: string
  gender: Gender | null
  age: number | null
  currentJobGroup: string | null
  targetJobGroup: string | null
  competencies: string[]
}
