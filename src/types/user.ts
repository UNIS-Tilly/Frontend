// 백엔드 user 패키지의 DTO와 모양을 맞춘다. (feature/user 브랜치 기준 — develop 에 머지되면 확정)

// GET /api/users/me
export type UserInfo = {
  nickname: string
  email: string
  // "HH:mm" 형식 (예: "18:30"). 설정하지 않았으면 null
  workEndTime: string | null
}
