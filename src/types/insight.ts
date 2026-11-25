// 백엔드 insight 패키지의 DTO와 모양을 맞춘다. (API_SPEC v0.5 9.4)

// GET /api/insights/weekly/latest — 홈 "이번 주 추천 행동" 카드용. 가장 최근에 발행된 인사이트 하나.
export type LatestInsight = {
  // 발행된 인사이트가 하나도 없으면 'NOT_PUBLISHED' 이고 insightId·title·subtitle 은 null, actions 는 [] 이다.
  status: 'PUBLISHED' | 'NOT_PUBLISHED'
  insightId: number | null
  // 미발행일 때 아래 세 값이 무엇으로 오는지는 명세에 없어서 null 도 받을 수 있게 둔다. [확인 필요]
  weekStart: string | null
  weekEnd: string | null
  weekLabel: string | null // 예: '10월 4주차' (서버가 만들어 준다)
  title: string | null
  subtitle: string | null
  // 추천 행동 문구 (보완 하나당 하나, 최대 2개). 홈에 보여 주기만 하고 할 일로 반영하지 않는다.
  actions: { text: string }[]
}
