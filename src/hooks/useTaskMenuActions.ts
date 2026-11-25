import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTask, updateTask } from '../api/tasks'
import { addDays } from '../lib/date'
import type { Task } from '../types/task'

// 할 일 ⋮ 메뉴의 "내일 하기"와 "삭제" 요청.
// 둘 다 할 일이 지금 목록에서 사라지는 동작이라, 성공한 뒤 목록을 다시 불러온다.
// ['tasks'] 로 무효화하면 날짜와 상관없이 모든 할 일 목록이 새로고침된다. (내일 하기는 다음 날 목록도 바뀌기 때문)
export function useTaskMenuActions() {
  const queryClient = useQueryClient()
  const refreshAllTaskLists = () => queryClient.invalidateQueries({ queryKey: ['tasks'] })

  // 배정일을 다음 날로 옮긴다. 마감 기한은 보내지 않으므로 서버가 그대로 유지한다.
  // 다음 날 할 일이 이미 20개면 400 TASK_LIMIT_EXCEEDED, 잠긴 주면 409 RECORD_LOCKED 가 온다.
  const moveToTomorrow = useMutation({
    mutationFn: (task: Task) => updateTask(task.id, { date: addDays(task.date, 1) }),
    onSuccess: refreshAllTaskLists,
  })

  const remove = useMutation({
    mutationFn: (task: Task) => deleteTask(task.id),
    onSuccess: refreshAllTaskLists,
  })

  return { moveToTomorrow, remove }
}
