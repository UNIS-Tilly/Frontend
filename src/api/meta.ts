import type { ProfileOptions } from '../types/meta'

// 프로필 선택지(성별·직군·역량) API.
//
// MOCK: 2026-11-26 — 실제 API(GET /api/meta/profile-options)는 로그인해야 부를 수 있는데,
// 가입 화면(0-3·0-4)은 아직 로그인 전이라 토큰이 없다. 백엔드에 "로그인 없이 열어 달라"고 요청했고(사용자 결정),
// 열리기 전까지는 아래 가짜 데이터를 쓴다. 열리면 이 함수 안을 아래 한 줄로 바꾸면 된다.
//   return apiFetch<ProfileOptions>('/api/meta/profile-options', { auth: false })
//
// 주의: 직군 이름(label)은 시안(0-3)의 칩 문구, code 는 실제 서버 값을 몰라 임시로 지은 것이다.
//       역량 목록은 0-4(역량 선택) 화면을 만들 때 채운다.
export async function getProfileOptions(): Promise<ProfileOptions> {
  return MOCK_PROFILE_OPTIONS
}

const MOCK_PROFILE_OPTIONS: ProfileOptions = {
  genders: [
    { code: 'MALE', label: '남성' },
    { code: 'FEMALE', label: '여성' },
    { code: 'OTHER', label: '기타' },
  ],
  jobGroups: [
    { code: 'HR', label: '인사/HR' },
    { code: 'MARKETING', label: '마케팅' },
    { code: 'PR', label: '홍보/광고' },
    { code: 'DESIGN', label: '디자인' },
    { code: 'SALES', label: '영업/판매' },
    { code: 'STRATEGY', label: '전략 기획' },
    { code: 'FINANCE', label: '재무/회계' },
    { code: 'PURCHASING', label: '구매/조달' },
    { code: 'QUALITY', label: '품질 관리' },
    { code: 'RND', label: 'R&D' },
    { code: 'PRODUCTION', label: '생산 관리' },
    { code: 'MANUFACTURING', label: '생산/제조' },
    { code: 'DEVELOPMENT', label: 'IT/개발' },
  ],
  competencies: [],
  selectionRules: { commonMin: 1, commonMax: 3, jobMin: 2, jobMax: 5 },
}
