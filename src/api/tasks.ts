import type { DailyTasks } from '../types/task'
import { apiFetch } from './client'

// 할 일 API 모음. (Spring 으로 치면 TaskController 를 부르는 클라이언트 계층)

// 그 날짜에 보이는 할 일을 완료/미완료로 나눠서 가져온다.
export function getTasks(date: string) {
  return apiFetch<DailyTasks>(`/api/tasks?date=${date}`)
}
