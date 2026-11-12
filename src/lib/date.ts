// 날짜는 앱 전체에서 'YYYY-MM-DD' 문자열로 다룬다. (백엔드와 같은 규칙, 타임존 Asia/Seoul)
// Date 객체를 문자열로 바꿀 때 toISOString() 을 쓰면 UTC 기준이라 날짜가 하루 어긋날 수 있어서,
// 연·월·일 숫자로 직접 문자열을 만든다.

export type DateParts = { year: number; month: number; day: number } // month 는 1~12

export function toDateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

export function parseDateString(dateString: string): DateParts {
  const [year, month, day] = dateString.split('-').map(Number)
  return { year, month, day }
}

const WEEKDAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

function getWeekdayName(dateString: string): string {
  const { year, month, day } = parseDateString(dateString)
  return WEEKDAY_NAMES[new Date(year, month - 1, day).getDay()]
}

// '2026-11-09' → '11월 9일 (월)'  (홈 체크리스트 제목)
export function formatLongDate(dateString: string): string {
  const { month, day } = parseDateString(dateString)
  return `${month}월 ${day}일 (${getWeekdayName(dateString)})`
}

// '2026-11-13' → '11/13 (금)'  (마감 기한 표시)
export function formatShortDate(dateString: string): string {
  const { month, day } = parseDateString(dateString)
  return `${month}/${day} (${getWeekdayName(dateString)})`
}

// from → to 까지 며칠 남았는지. to 가 더 뒤면 양수, 같으면 0, 앞이면 음수.
// Date.UTC 를 쓰는 이유: 서머타임 같은 시간대 영향 없이 "날짜 차이"만 정확히 구하기 위해서다.
export function diffInDays(from: string, to: string): number {
  const a = parseDateString(from)
  const b = parseDateString(to)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / msPerDay,
  )
}

// 사용자가 어느 나라에 있든 "오늘"은 서울 기준으로 계산한다.
// 'en-CA' 로케일은 날짜를 YYYY-MM-DD 모양으로 돌려주는 점을 이용한다.
export function getTodayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}
