import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createTask } from '../api/tasks'

// 할 일 추가 요청. 성공하면 할 일 목록을 다시 불러와 새 할 일이 체크리스트에 나타나게 한다.
// 실패(예: 그날 20개 초과 400 TASK_LIMIT_EXCEEDED, 잠긴 주 409 RECORD_LOCKED)는 모달이 error.message 로 보여 준다.
export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  })
}
