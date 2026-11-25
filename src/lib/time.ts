import type { DropdownOption } from '../components/Dropdown'

// 시간 선택 드롭다운(오전/오후 · 시 · 분)의 선택지. 할 일 추가 모달의 마감 시간, 가입 화면의 퇴근 시간에서 같이 쓴다.
// 디자이너 전언(2026-11-26): 시는 1~12시, 분은 5분 단위(0·5·…·55분)
export const AM_PM_OPTIONS: DropdownOption[] = [
  { value: 'AM', label: '오전' },
  { value: 'PM', label: '오후' },
]
export const HOUR_OPTIONS: DropdownOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: String(index + 1),
  label: `${index + 1}시`,
}))
export const MINUTE_OPTIONS: DropdownOption[] = Array.from({ length: 12 }, (_, index) => ({
  value: String(index * 5),
  label: `${index * 5}분`,
}))

// 오전/오후 + 시 + 분 → 서버 형식 'HH:mm'. (오전 12시 = 00시, 오후 12시 = 12시)
export function toTimeString(amPm: string, hour: string, minute: string): string {
  const hour24 = (Number(hour) % 12) + (amPm === 'PM' ? 12 : 0)
  return `${String(hour24).padStart(2, '0')}:${minute.padStart(2, '0')}`
}
