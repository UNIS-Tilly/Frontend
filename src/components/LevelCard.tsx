import soilImage from '../assets/level-soil.png'

// 홈 왼쪽 아래의 성장 단계 카드 (시안: docs/design/components/level-card.svg 첫 번째 배리언트, 312×271).
//
// TODO(기획 확정 후): 지금은 시안 그대로 "1단계 · 흙" 고정 화면이다. 서버 데이터와 연결하지 않았다.
//   - 단계: GET /api/users/me 의 level(1~9, 퇴근 완료한 날마다 +1, 9 다음은 1)로 바꿀 예정
//   - 단계별 그림·이름·안내 문구: 시안에는 흙(·새싹) 그림만 있어, 9단계 그림을 받은 뒤 연결
//   - 진행 막대: 무엇의 진행률인지 기획 미정(백엔드 Q-19 ④). 지금은 시안 모양(약 1/3)만 그려 둔다
export default function LevelCard() {
  return (
    <section className="relative flex h-[271px] w-[312px] flex-col items-center overflow-hidden rounded-m bg-secondary-400 pt-[25px]">
      <CardDecoration />

      {/* relative: 장식(absolute) 위에 내용이 올라오게 한다 */}
      <span className="relative grid h-[23px] place-items-center rounded-full bg-white px-[10px] text-body3 text-black-300">
        1단계
      </span>

      <img src={soilImage} alt="" className="relative mt-l h-[59px] w-[104px]" />

      <p className="relative mt-[21px] text-h3 font-semibold text-black-500">흙</p>
      <p className="relative text-body2 text-black-300">오늘의 경험을 하나씩 심어봐요!</p>

      {/* 진행 막대 (의미는 TODO 참고). 시안: 바탕 196×8, 채움 64×7 */}
      <div className="relative mt-auto mb-[39px] flex h-2 w-[196px] items-center rounded-full bg-gray-100">
        <div className="h-[7px] w-[64px] rounded-full bg-primary-500" />
      </div>
    </section>
  )
}

// 카드 배경 장식(번진 빛 · 잎 4개 · 반짝이 3개). 시안 좌표를 그대로 옮겼다.
// 색은 className 의 디자인 토큰(fill-…)으로 칠한다.
function CardDecoration() {
  return (
    <svg
      viewBox="0 0 312 271"
      className="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <filter id="level-card-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <ellipse
        cx="156"
        cy="93"
        rx="100"
        ry="65"
        opacity="0.7"
        filter="url(#level-card-glow)"
        className="fill-secondary-500"
      />

      {/* 시안 원본 좌표가 (20, 20)만큼 밀려 있어서 되돌린다 */}
      <g transform="translate(-20 -20)">
        <g className="fill-secondary-500">
          <path d="M54.0833 86.6883C57.5347 79.2868 65.2868 76.4653 72.6883 79.9167C69.2369 87.3182 61.4849 90.1397 54.0833 86.6883Z" />
          <path d="M288.309 113.011C284.629 107.754 285.754 101.371 291.011 97.6907C294.691 102.947 293.566 109.33 288.309 113.011Z" />
          <path d="M57.6604 138.428C53.1919 134.678 52.6783 128.808 56.4279 124.34C60.8965 128.089 61.41 133.959 57.6604 138.428Z" />
          <path d="M256.287 57.1925C260.786 51.8302 267.83 51.2139 273.193 55.7135C268.693 61.0758 261.649 61.692 256.287 57.1925Z" />
        </g>
        <g className="fill-white">
          <path d="M86 50L87.4 54.6L92 56L87.4 57.4L86 62L84.6 57.4L80 56L84.6 54.6L86 50Z" />
          <path d="M260.5 138L261.55 141.45L265 142.5L261.55 143.55L260.5 147L259.45 143.55L256 142.5L259.45 141.45L260.5 138Z" />
          <path d="M45.5 104L46.3167 106.683L49 107.5L46.3167 108.317L45.5 111L44.6833 108.317L42 107.5L44.6833 106.683L45.5 104Z" />
        </g>
      </g>
    </svg>
  )
}
