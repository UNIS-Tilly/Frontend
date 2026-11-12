import { useState } from 'react'
import Calendar from '../components/Calendar'
import { getTodayInSeoul } from '../lib/date'

export default function HomePage() {
  // 선택된 날짜. 처음에는 오늘(서울 기준)이다. 다음 단계에서 이 날짜로 할 일 목록을 조회한다.
  const [selectedDate, setSelectedDate] = useState(getTodayInSeoul)

  return (
    // 여백은 시안(1440px) 좌표 기준: 상단 바 아래 21, 왼쪽 49, 오른쪽 60, 칸 사이 30
    <div className="flex items-start gap-[30px] pt-[21px] pr-[60px] pb-2xl pl-[49px]">
      <div className="shrink-0">
        <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      {/* 임시: 오른쪽 할 일 목록은 다음 단계에서 만든다 */}
      <section className="min-h-[328px] flex-1 rounded-m bg-white p-l">
        <p className="text-body3 text-black-300">선택한 날짜: {selectedDate}</p>
      </section>
    </div>
  )
}
