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

// 사용자가 어느 나라에 있든 "오늘"은 서울 기준으로 계산한다.
// 'en-CA' 로케일은 날짜를 YYYY-MM-DD 모양으로 돌려주는 점을 이용한다.
export function getTodayInSeoul(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date())
}
