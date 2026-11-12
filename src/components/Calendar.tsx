import { useState } from 'react'
import { parseDateString, toDateString } from '../lib/date'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

type Props = {
  // 선택된 날짜 'YYYY-MM-DD'. 선택 상태는 부모(HomePage)가 들고 있고, 여기서는 보여주기만 한다.
  selectedDate: string
  onSelect: (dateString: string) => void
}

// 홈 화면 왼쪽의 월 캘린더. 시안(P-01)대로 일요일부터 시작하고, 화살표로 한 달씩 이동한다.
export default function Calendar({ selectedDate, onSelect }: Props) {
  const selected = parseDateString(selectedDate)

  // "지금 보고 있는 달"은 선택한 날짜와 별개다. 달을 넘겨 봐도 선택한 날짜는 그대로 유지된다.
  const [view, setView] = useState({ year: selected.year, month: selected.month })

  const moveMonth = (amount: number) => {
    // new Date(2026, 12, 1) 처럼 범위를 넘긴 달은 JS 가 알아서 다음 해 1월로 바꿔 준다.
    const moved = new Date(view.year, view.month - 1 + amount, 1)
    setView({ year: moved.getFullYear(), month: moved.getMonth() + 1 })
  }

  // 달력 칸 만들기: 1일이 무슨 요일인지에 맞춰 앞뒤를 이전·다음 달 날짜로 채운다. (5줄 또는 6줄)
  const firstWeekday = new Date(view.year, view.month - 1, 1).getDay() // 0=일요일
  const daysInMonth = new Date(view.year, view.month, 0).getDate()
  const weekCount = Math.ceil((firstWeekday + daysInMonth) / 7)

  const cells = Array.from({ length: weekCount * 7 }, (_, index) => {
    // 1일에서 (firstWeekday - index)일 만큼 거슬러 올라가면 그 칸의 실제 날짜가 된다.
    const date = new Date(view.year, view.month - 1, 1 - firstWeekday + index)
    return {
      dateString: toDateString(date.getFullYear(), date.getMonth() + 1, date.getDate()),
      day: date.getDate(),
      inCurrentMonth: date.getMonth() + 1 === view.month,
    }
  })

  return (
    <section className="w-[312px] rounded-m bg-white px-m py-l">
      <div className="flex items-center justify-between px-s">
        <button
          type="button"
          onClick={() => moveMonth(-1)}
          aria-label="이전 달"
          className="grid size-6 cursor-pointer place-items-center text-black-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
            <path
              d="M14.333 16.667L9.667 12L14.333 7.333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <h2 className="text-body1 font-semibold">
          {view.year}년 {view.month}월
        </h2>

        <button
          type="button"
          onClick={() => moveMonth(1)}
          aria-label="다음 달"
          className="grid size-6 cursor-pointer place-items-center text-black-300"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
            <path
              d="M9.667 7.333L14.333 12L9.667 16.667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="mt-l grid grid-cols-7 text-center text-caption font-normal text-black-300">
        {WEEKDAYS.map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="mt-xs grid grid-cols-7">
        {cells.map(({ dateString, day, inCurrentMonth }) => {
          const isSelected = dateString === selectedDate
          return (
            <button
              key={dateString}
              type="button"
              // 다른 달 날짜(연한 글씨)는 누를 수 없다. 달 이동은 위쪽 화살표로만 한다.
              disabled={!inCurrentMonth}
              onClick={() => onSelect(dateString)}
              aria-label={`${Number(dateString.slice(5, 7))}월 ${day}일`}
              aria-current={isSelected ? 'date' : undefined}
              className="grid h-10 cursor-pointer place-items-center disabled:cursor-default"
            >
              <span
                className={`grid size-6 place-items-center rounded-full text-body3 ${
                  isSelected
                    ? 'bg-primary-500 text-white'
                    : inCurrentMonth
                      ? 'text-black-500'
                      : 'text-gray-400'
                }`}
              >
                {day}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
