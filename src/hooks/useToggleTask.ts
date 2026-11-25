import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateTask } from '../api/tasks'
import type { DailyTasks, Task } from '../types/task'

type ToggleInput = { task: Task; completed: boolean }

// 할 일 완료 체크/해제 훅. (useMutation = 서버 데이터를 "바꾸는" 요청용. 조회용 useQuery 와 짝)
//
// "기록이 또 하나의 업무가 되면 안 된다"는 원칙 때문에, 서버 응답을 기다리지 않고 화면부터 바꾼다(낙관적 업데이트).
//   1) 누르는 즉시: 캐시에 들어 있는 목록에서 그 할 일을 완료/미완료 쪽으로 옮긴다
//   2) 실패하면: 누르기 전 목록으로 되돌린다 (오류 문구는 화면이 mutation.error 로 보여 준다)
//   3) 성공·실패 모두 끝나면: 서버에서 목록을 다시 받아 진짜 값(개수·dueInDays 등)으로 맞춘다
export function useToggleTask(date: string) {
  const queryClient = useQueryClient()
  const queryKey = ['tasks', date]

  return useMutation({
    mutationFn: ({ task, completed }: ToggleInput) => updateTask(task.id, { completed }),

    onMutate: async ({ task, completed }) => {
      // 진행 중인 목록 조회가 늦게 도착해서 방금 바꾼 화면을 덮어쓰지 않게 멈춘다.
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<DailyTasks>(queryKey)
      if (previous) {
        queryClient.setQueryData<DailyTasks>(queryKey, moveTask(previous, task, completed))
      }
      return { previous } // onError 에서 되돌릴 때 쓴다
    },

    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous)
      }
    },

    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })
}

// 할 일 하나를 완료/미완료 목록 사이에서 옮긴 새 목록을 만든다. (서버와 같은 규칙: 각 목록은 id 오름차순)
function moveTask(data: DailyTasks, task: Task, completed: boolean): DailyTasks {
  const moved: Task = { ...task, completed }
  const byId = (a: Task, b: Task) => a.id - b.id
  const others = (list: Task[]) => list.filter((item) => item.id !== task.id)

  const completedList = completed
    ? [...others(data.completed), moved].sort(byId)
    : others(data.completed)
  const incompleteList = completed
    ? others(data.incomplete)
    : [...others(data.incomplete), moved].sort(byId)

  return {
    ...data,
    completed: completedList,
    incomplete: incompleteList,
    completedCount: completedList.length,
  }
}
