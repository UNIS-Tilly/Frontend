import { diffInDays, formatDueDateTime, getDatePart, getTodayInSeoul } from '../lib/date'
import type { Task } from '../types/task'

type Props = {
  task: Task
}

// 마감 칩("D-4", "D-DAY", "D+2") 에 쓸 글자와 강조 여부를 정한다. 마감이 없으면 null.
function getDueChip(task: Task) {
  if (!task.dueDate) return null

  // 남은 일수는 서버가 "오늘" 기준으로 계산해 준다(dueInDays).
  // 다만 서버는 완료한 할 일에는 이 값을 주지 않는다. 시안(컴포넌트 시트 todo-item)은 완료 항목에도
  // D-DAY 칩을 보여주므로(시안 우선 원칙), 그때는 마감 날짜와 오늘로 프론트가 직접 계산한다.
  const daysLeft = task.dueInDays ?? diffInDays(getTodayInSeoul(), getDatePart(task.dueDate))

  // 시안에 D+n 모양이 없어서, 가장 눈에 띄는 D-DAY 와 같은 모양(파란 채움)으로 표시한다.
  if (daysLeft <= 0) {
    return { label: daysLeft === 0 ? 'D-DAY' : `D+${-daysLeft}`, strong: true }
  }
  return { label: `D-${daysLeft}`, strong: false }
}

// 체크리스트의 한 줄: 체크박스 · 업무 이름 · 마감 기한(일시 + D-n 칩)
export default function TaskItem({ task }: Props) {
  const chip = getDueChip(task)

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

      {/* 마감 기한: 시안대로 "11/13 (금) 16:00" + 칩. 마감이 없으면 "-" */}
      <div className="flex w-[200px] shrink-0 items-center justify-center gap-[17px] text-body3 text-black-300">
        {task.dueDate ? <span>{formatDueDateTime(task.dueDate)}</span> : <span>-</span>}
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
