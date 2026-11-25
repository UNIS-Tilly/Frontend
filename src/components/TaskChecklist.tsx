import { useState } from 'react'
import { useTaskMenuActions } from '../hooks/useTaskMenuActions'
import { useTasks } from '../hooks/useTasks'
import { useToggleTask } from '../hooks/useToggleTask'
import { formatLongDate } from '../lib/date'
import type { Task } from '../types/task'
import AddTaskModal from './AddTaskModal'
import TaskItem from './TaskItem'

type Props = {
  selectedDate: string
}

// 홈 오른쪽의 할 일 체크리스트 카드. 선택한 날짜의 할 일을 서버에서 가져와 보여준다.
export default function TaskChecklist({ selectedDate }: Props) {
  const { data, isPending, isError, error, refetch } = useTasks(selectedDate)
  const toggleTask = useToggleTask(selectedDate)
  const { moveToTomorrow, remove } = useTaskMenuActions()

  // 할 일 동작(완료 체크 · 내일 하기 · 삭제)이 실패했을 때 보여 줄 서버 문구. 새 동작을 시작하면 지운다.
  const [actionError, setActionError] = useState<string | null>(null)
  const showError = (error: Error) => setActionError(error.message)

  // 할 일 추가 모달이 열려 있는지
  const [addModalOpen, setAddModalOpen] = useState(false)

  function handleToggle(task: Task, completed: boolean) {
    setActionError(null)
    toggleTask.mutate({ task, completed }, { onError: showError })
  }
  function handleMoveToTomorrow(task: Task) {
    setActionError(null)
    moveToTomorrow.mutate(task, { onError: showError })
  }
  function handleDelete(task: Task) {
    setActionError(null)
    remove.mutate(task, { onError: showError })
  }

  // 디자인 요청: "사용자가 입력한 순서대로 나열하되, 완료한 항목은 가장 아래로".
  // 서버가 미완료/완료를 따로, 각각 입력한 순서(id 오름차순)로 주기 때문에 이어 붙이기만 하면 된다.
  const tasks = data ? [...data.incomplete, ...data.completed] : []

  return (
    <section className="flex min-h-[696px] flex-1 flex-col rounded-m bg-white px-xl pt-l pb-xl">
      <div className="flex items-center justify-between">
        <h2 className="text-h3 font-semibold">{formatLongDate(selectedDate)}</h2>

        {/* 진행도: "2/5 완료" + 막대. 할 일이 하나도 없으면 보여주지 않는다 */}
        {data && data.totalCount > 0 && (
          <div className="flex items-center gap-s text-body3 text-black-300">
            <span>
              {data.completedCount}/{data.totalCount} 완료
            </span>
            <div className="h-[7px] w-[160px] overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${(data.completedCount / data.totalCount) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 표 머리글. 글자 위치는 시안(1440px) 좌표에 맞춘 값이다 */}
      <div className="mt-xl flex h-10 items-center border-b-2 border-gray-400 text-body3 text-black-300">
        <span className="w-[310px] text-center">할 일</span>
        <span className="ml-[43px] w-[316px] text-center">마감 기한</span>
      </div>

      {isPending && <TaskSkeleton />}

      {isError && (
        <div className="grid flex-1 place-content-center justify-items-center gap-m text-center">
          <p className="text-body2 text-black-300">{error.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="cursor-pointer rounded-full bg-primary-500 px-l py-xs text-button font-semibold text-white"
          >
            다시 시도
          </button>
        </div>
      )}

      {data && tasks.length === 0 && (
        // 빈 상태에서도 아래쪽 "+ 할 일 추가하기" 버튼으로 추가한다. (하이파이 1-1의 버튼 위치)
        <p className="grid flex-1 place-content-center text-body2 text-black-300">
          오늘 할 업무를 추가해 보세요
        </p>
      )}

      {/* 할 일 동작이 실패했을 때(예: 409 잠긴 주, 400 다음 날 20개 초과) 서버 문구를 보여 준다.
          시안에 없는 상태라 목록 위에 한 줄로 둔다. 다른 동작을 하면 사라진다. */}
      {actionError && (
        <p role="alert" className="mt-xs text-body3 text-danger">
          {actionError}
        </p>
      )}

      {data && tasks.length > 0 && (
        <ul className="mt-[11px]">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onMoveToTomorrow={handleMoveToTomorrow}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}

      {/* "+ 할 일 추가하기" 버튼: 카드 맨 아래 왼쪽 (시안 146×34). 목록을 불러온 뒤에만 보인다 */}
      {data && (
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="mt-auto flex h-[34px] w-fit cursor-pointer items-center gap-[7px] rounded-full bg-primary-500 px-m text-body2 font-normal text-white"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            className="size-4"
            aria-hidden="true"
          >
            <path d="M8 13.333V2.667M2.667 8H13.333" strokeWidth={2} strokeLinecap="round" />
          </svg>
          할 일 추가하기
        </button>
      )}

      {addModalOpen && (
        <AddTaskModal assignedDate={selectedDate} onClose={() => setAddModalOpen(false)} />
      )}
    </section>
  )
}

// 불러오는 동안 보여주는 회색 막대 5줄 (시안에는 없는 상태라 줄 높이만 실제 목록과 같게 맞췄다)
function TaskSkeleton() {
  return (
    <ul className="mt-[11px]" aria-label="할 일을 불러오는 중">
      {Array.from({ length: 5 }, (_, index) => (
        <li key={index} className="flex items-center gap-s py-[14px]">
          <div className="size-6 animate-pulse rounded-[6px] bg-gray-200" />
          <div className="h-5 w-64 animate-pulse rounded-s bg-gray-200" />
        </li>
      ))}
    </ul>
  )
}
