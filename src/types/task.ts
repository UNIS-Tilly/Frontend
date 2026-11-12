// 백엔드 task 패키지의 DTO와 모양을 맞춘다. (API_SPEC v0.3 5.1, 백엔드 develop 의 TaskItemResponse / TaskListResponse 확인함)

// 할 일 하나. 날짜는 모두 'YYYY-MM-DD', 없으면 null
export type Task = {
  id: number
  title: string
  // 배정일. null 이면 끝내기 전까지 만든 날부터 계속 보인다.
  date: string | null
  // 마감일. D-n 표시에 쓴다.
  dueDate: string | null
  completed: boolean
  completedDate: string | null
  // 업무별 메모 (기록 화면에서 쓴다)
  memo: string | null
  // 마감일이 지난 미완료 할 일의 지난 일수 ("D+n" 표시용). 그 외에는 null
  overdueDays: number | null
}

// GET /api/tasks?date= 응답. 선택한 날짜에 보이는 할 일이 완료/미완료로 나뉘어 온다.
// 각 목록은 서버에서 id 오름차순(= 사용자가 입력한 순서)으로 정렬되어 온다.
export type DailyTasks = {
  date: string
  completedCount: number
  totalCount: number
  completed: Task[]
  incomplete: Task[]
}
