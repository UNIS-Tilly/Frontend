import { diffInDays, formatShortDate } from '../lib/date'
import type { Task } from '../types/task'

type Props = {
  task: Task
  // 지금 보고 있는 날짜. D-n 을 "이 날짜 기준으로 마감까지 며칠 남았나"로 계산하는 데 쓴다.
  selectedDate: string
}

// 마감 칩("D-4", "D-DAY", "D+2") 에 쓸 글자와 강조 여부를 정한다. 보여줄 게 없으면 null.
function getDueChip(task: Task, selectedDate: string) {
  if (!task.dueDate) return null

  // 마감일이 지난 미완료 할 일: 서버가 알려주는 지난 일수를 그대로 쓴다.
  // 시안에 D+n 모양이 없어서, 가장 눈에 띄는 D-DAY 와 같은 모양으로 임시 표시한다.
  if (task.overdueDays !== null) return { label: `D+${task.overdueDays}`, strong: true }

  const daysLeft = diffInDays(selectedDate, task.dueDate)
  if (daysLeft === 0) return { label: 'D-DAY', strong: true }
  if (daysLeft > 0) return { label: `D-${daysLeft}`, strong: false }
  return null // 마감이 지난 뒤 완료한 할 일: 서버가 지난 일수를 주지 않아 칩을 만들지 않는다
}

// 체크리스트의 한 줄: 체크박스 · 업무 이름 · 마감 기한(날짜 + D-n 칩)
export default function TaskItem({ task, selectedDate }: Props) {
  const chip = getDueChip(task, selectedDate)

  return (
    <li className="flex items-center py-[14px]">
      {/* TODO(다음 단계): 클릭하면 완료/미완료가 바뀌게 연결한다. 지금은 모양만 보여준다. */}
      <span
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`${task.title} 완료 여부`}
        className={`grid size-6 shrink-0 place-items-center rounded-[6px] ${
          task.completed ? 'bg-primary-500' : 'border-[1.5px] border-gray-500 bg-white'
        }`}
      >
        {task.completed && (
          <svg viewBox="0 0 24 24" fill="none" stroke="white" className="size-6">
            <path
              d="M6 12L10.5 16.5L18 7.5"
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>

      <span
        className={`ml-s min-w-0 flex-1 truncate text-body2 ${
          task.completed ? 'text-black-300 line-through' : 'text-black-500'
        }`}
      >
        {task.title}
      </span>

      {/* 마감 기한. 시안에는 "11/13 (금) 16:00" 처럼 시간도 있지만, 백엔드가 날짜만 줘서 날짜만 보여준다(보류 항목). */}
      <div className="flex w-[200px] shrink-0 items-center justify-center gap-[17px] text-body3 text-black-300">
        {task.dueDate ? <span>{formatShortDate(task.dueDate)}</span> : <span>-</span>}
        {chip && (
          <span
            className={`grid h-[25px] w-[67px] place-items-center rounded-full ${
              chip.strong ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-600'
            }`}
          >
            {chip.label}
          </span>
        )}
      </div>

      {/* 시안의 ⋮(수정·삭제) 버튼 자리. 수정·삭제를 만들 때 버튼으로 채운다. */}
      <div className="ml-[18px] size-6 shrink-0" />
    </li>
  )
}
