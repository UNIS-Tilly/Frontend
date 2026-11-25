// 백엔드 meta 패키지의 DTO와 모양을 맞춘다. (API_SPEC v0.5 4.3)
// 직군·역량·성별 선택지는 값이 [임시]이고 자주 바뀌므로 화면에 하드코딩하지 않고 이 응답으로 그린다.

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export type ProfileOption = {
  code: string // 서버에 보내는 값 (예: 'MARKETING')
  label: string // 화면에 보여 줄 이름 (예: '마케팅')
}

export type CompetencyOption = ProfileOption & {
  type: 'COMMON' | 'JOB' // 공통 역량 / 직군 역량
  jobGroup: string | null // 직군 역량이면 소속 직군 code
  description: string
}

// GET /api/meta/profile-options
export type ProfileOptions = {
  genders: { code: Gender; label: string }[]
  jobGroups: ProfileOption[]
  competencies: CompetencyOption[]
  selectionRules: { commonMin: number; commonMax: number; jobMin: number; jobMax: number }
}
