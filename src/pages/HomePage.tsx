import { useState } from 'react'
import Calendar from '../components/Calendar'
import TaskChecklist from '../components/TaskChecklist'
import { getTodayInSeoul } from '../lib/date'

export default function HomePage() {
  // 선택된 날짜. 처음에는 오늘(서울 기준)이다. 캘린더에서 날짜를 누르면 바뀌고, 체크리스트가 그 날짜로 다시 조회한다.
  const [selectedDate, setSelectedDate] = useState(getTodayInSeoul)

  return (
    // 여백은 시안(1440px) 좌표 기준: 상단 바 아래 21, 왼쪽 49, 오른쪽 60, 칸 사이 30
    <div className="flex items-start gap-[30px] pt-[21px] pr-[60px] pb-2xl pl-[49px]">
      <div className="shrink-0">
        <Calendar selectedDate={selectedDate} onSelect={setSelectedDate} />
      </div>

      <TaskChecklist selectedDate={selectedDate} />
    </div>
  )
}
