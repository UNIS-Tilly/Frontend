import type { LatestInsight } from '../types/insight'

// MOCK: 2026-11-26 사용자 결정으로 지금은 시안(1-1 home)의 문구를 그대로 보여 준다.
// 실제 API(GET /api/insights/weekly/latest)는 백엔드에 구현돼 있으니, 디자인·기획 답변
// (보여 줄 개수, 인사이트가 없을 때 화면, 카드 이름)이 오면 useQuery 로 바꾸고 로딩·실패·빈 상태를 붙인다.
const MOCK_LATEST_INSIGHT: LatestInsight = {
  status: 'PUBLISHED',
  insightId: 1,
  weekStart: '2026-11-02',
  weekEnd: '2026-11-08',
  weekLabel: '11월 2주차',
  title: null,
  subtitle: null,
  actions: [{ text: '조사 업무를 시작하기 전에 비교 기준을 먼저 정의해 보기' }],
}

// 홈 왼쪽 칸, 캘린더 아래의 "이번 주 추천 행동" 카드 (시안 312×98)
export default function RecommendedActionCard() {
  // 시안에는 추천 행동이 1개만 보여서 첫 번째 것만 쓴다. (서버는 최대 2개를 준다)
  const action = MOCK_LATEST_INSIGHT.actions[0]

  return (
    <section className="w-[312px] rounded-m bg-white py-s pr-m pl-m">
      <h2 className="flex items-center gap-2xs text-body2 font-semibold text-primary-500">
        <LightBulbIcon />
        이번 주 추천 행동
      </h2>
      {/* 시안은 본문이 제목 줄보다 16px 더 안쪽에서 시작한다.
          break-keep: 한글 단어 중간에서 줄이 끊기지 않게 한다(시안처럼 "…먼저 / 정의해 보기") */}
      <p className="mt-2xs pl-m text-body3 break-keep text-black-500">{action.text}</p>
    </section>
  )
}

// 전구 아이콘 (시안 akar-icons light-bulb, 18px, 선 1.5px). 시안 좌표 그대로라 viewBox 로 그 위치만 잘라 쓴다.
function LightBulbIcon() {
  return (
    <svg
      viewBox="304 482 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
      aria-hidden="true"
    >
      <path d="M311.5 498.5H314.5M310 493.25H316M307.75 488.75C307.75 487.358 308.303 486.022 309.288 485.038C310.272 484.053 311.608 483.5 313 483.5C314.392 483.5 315.728 484.053 316.712 485.038C317.697 486.022 318.25 487.358 318.25 488.75C318.251 489.595 318.046 490.428 317.654 491.177C317.262 491.926 316.695 492.569 316 493.05L315.594 494.975C315.54 495.33 315.361 495.653 315.088 495.887C314.816 496.121 314.47 496.25 314.111 496.25H311.889C311.53 496.25 311.184 496.121 310.912 495.887C310.64 495.653 310.46 495.33 310.407 494.975L310 493.059C309.305 492.576 308.737 491.931 308.345 491.181C307.954 490.431 307.749 489.596 307.75 488.75Z" />
    </svg>
  )
}
