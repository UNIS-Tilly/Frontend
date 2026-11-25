import type { DailyTasks, Task, UpdateTaskRequest } from '../types/task'
import { apiFetch } from './client'

// 할 일 API 모음. (Spring 으로 치면 TaskController 를 부르는 클라이언트 계층)

// 그 날짜에 보이는 할 일을 완료/미완료로 나눠서 가져온다.
export function getTasks(date: string) {
  return apiFetch<DailyTasks>(`/api/tasks?date=${date}`)
}

// 할 일 수정 / 완료 토글. 응답은 바뀐 할 일 하나다.
export function updateTask(taskId: number, request: UpdateTaskRequest) {
  return apiFetch<Task>(`/api/tasks/${taskId}`, {
    method: 'PATCH',
    body: request,
  })
}
