// 백엔드 task 패키지의 DTO와 모양을 맞춘다. (API_SPEC v0.5 5.0~5.1)

// 할 일 하나.
export type Task = {
  id: number
  title: string
  // 배정일 'YYYY-MM-DD'. 할 일은 이 날짜에만 보인다. (v0.5부터 항상 값이 있다)
  date: string
  // 마감 일시 'YYYY-MM-DDTHH:mm:ss' (서울 시간, 오프셋 없음). 마감이 없으면 null
  dueDate: string | null
  completed: boolean
  // 완료한 날 'YYYY-MM-DD'. 참고용이라 화면 노출 기준으로는 쓰지 않는다.
  completedDate: string | null
  // 업무별 메모 (기록 화면에서 쓴다)
  memo: string | null
  // 마감까지 남은 일수(서버 "오늘" 기준). 양수=D-n, 0=D-DAY, 음수=D+n.
  // 마감이 없거나 완료한 할 일이면 null 이다. (완료 항목의 칩은 시안대로 프론트가 dueDate 로 따로 계산한다)
  dueInDays: number | null
}

// GET /api/tasks?date= 응답. 그 날짜에 배정된 할 일이 완료/미완료로 나뉘어 온다.
// 각 목록은 서버에서 id 오름차순(= 사용자가 입력한 순서)으로 정렬되어 온다.
export type DailyTasks = {
  date: string
  completedCount: number
  totalCount: number
  completed: Task[]
  incomplete: Task[]
}
