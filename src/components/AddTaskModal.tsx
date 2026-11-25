import { useRef, useState, type FormEvent } from 'react'
import { useCloseOnOutside } from '../hooks/useCloseOnOutside'
import { useCreateTask } from '../hooks/useCreateTask'
import { formatFullDate } from '../lib/date'
import { AM_PM_OPTIONS, HOUR_OPTIONS, MINUTE_OPTIONS, toTimeString } from '../lib/time'
import Calendar from './Calendar'
import Dropdown from './Dropdown'

type Props = {
  // 할 일을 넣을 날짜(배정일). 홈에서 보고 있는 날짜가 그대로 들어간다. (2026-11-24 결정)
  assignedDate: string
  onClose: () => void
}

const TITLE_MAX_LENGTH = 20 // 백엔드 규칙: 앞뒤 공백 제거 후 1~20자

// 할 일 추가 모달. 시안: docs/design/screens/1-home/1-3 ~ 1-6 (카드 520×438)
// 시안에 모달 뒤 어두운 배경이 없어서, 그림자만 있는 카드를 화면 가운데에 띄운다.
export default function AddTaskModal({ assignedDate, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [dueDay, setDueDay] = useState<string | null>(null) // 마감 날짜 'YYYY-MM-DD'
  const [amPm, setAmPm] = useState<string | null>(null)
  const [hour, setHour] = useState<string | null>(null)
  const [minute, setMinute] = useState<string | null>(null)

  const createTask = useCreateTask()

  // 마감 기한은 선택이다. 다만 서버는 시간까지 있어야 받으므로(날짜만 보내면 400),
  // 날짜·오전/오후·시·분 네 칸을 "모두 비우거나, 모두 채워야" 추가할 수 있다.
  const deadlineFields = [dueDay, amPm, hour, minute]
  const deadlineEmpty = deadlineFields.every((field) => field === null)
  const deadlineComplete = deadlineFields.every((field) => field !== null)

  // 디자이너 전언: 할 일을 입력하기 전에는 버튼이 회색으로 막혀 있어야 한다.
  const canSubmit =
    title.trim().length > 0 && (deadlineEmpty || deadlineComplete) && !createTask.isPending

  function handleSubmit(event: FormEvent) {
    event.preventDefault() // 폼 기본 동작(페이지 새로고침)을 막는다
    if (!canSubmit) return

    const dueDate =
      dueDay && amPm && hour && minute ? `${dueDay}T${toTimeString(amPm, hour, minute)}` : undefined

    createTask.mutate({ title: title.trim(), date: assignedDate, dueDate }, { onSuccess: onClose })
  }

  return (
    // 화면 전체를 덮는 투명한 층: 모달이 떠 있는 동안 뒤쪽 화면을 누르지 못하게 한다.
    <div className="fixed inset-0 z-50 grid place-items-center">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        onSubmit={handleSubmit}
        className="w-[520px] rounded-l bg-white p-xl shadow-modal"
      >
        <div className="flex h-8 items-center justify-between">
          {/* 시안 값: 22px SemiBold (디자인 시스템 글자 크기에 22px 는 없다) */}
          <h2 id="add-task-title" className="text-[22px] leading-[1.4] font-semibold">
            할 일 추가
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="mr-2xs grid size-6 cursor-pointer place-items-center text-black-300"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="size-6">
              <path d="M6 6L18 18M18 6L6 18" strokeWidth={2} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <label className="mt-l block text-body2" htmlFor="task-title">
          할 일
        </label>
        <input
          id="task-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={TITLE_MAX_LENGTH}
          placeholder="할 일을 입력해 주세요."
          autoFocus
          className="mt-xs h-12 w-full rounded-m border border-gray-400 px-m text-body2 text-black-500 outline-none placeholder:text-gray-500 focus:border-primary-500"
        />

        <p className="mt-l text-body2">마감 기한 (선택)</p>
        <DueDayField value={dueDay} onChange={setDueDay} />

        <div className="mt-m flex gap-m">
          <Dropdown
            placeholder="오전/오후"
            options={AM_PM_OPTIONS}
            value={amPm}
            onChange={setAmPm}
            className="w-[128px]"
          />
          <Dropdown
            placeholder="시간"
            options={HOUR_OPTIONS}
            value={hour}
            onChange={setHour}
            scrollable
            className="w-[148px]"
          />
          <Dropdown
            placeholder="분"
            options={MINUTE_OPTIONS}
            value={minute}
            onChange={setMinute}
            scrollable
            className="w-[148px]"
          />
        </div>

        {/* 추가 실패 시 서버 문구 (예: 그날 할 일 20개 초과). 시안에 없는 상태라 입력창 오류 글자 모양(12px 빨강)을 쓴다 */}
        {createTask.isError && (
          <p role="alert" className="mt-m text-caption text-red-500">
            {createTask.error.message}
          </p>
        )}

        <div className="mt-l flex justify-end gap-s">
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] w-[134px] cursor-pointer rounded-m border border-gray-400 text-button font-semibold text-black-500"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="h-[42px] w-[135px] cursor-pointer rounded-m bg-primary-500 text-button font-semibold text-white disabled:cursor-default disabled:bg-gray-400"
          >
            추가하기
          </button>
        </div>
      </form>
    </div>
  )
}

// "날짜 선택" 칸. 누르면 아래에 날짜 선택 달력이 열리고, 날짜를 고르면 닫힌다.
function DueDayField({
  value,
  onChange,
}: {
  value: string | null
  onChange: (dateString: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useCloseOnOutside(containerRef, open, () => setOpen(false))

  return (
    <div ref={containerRef} className="relative mt-xs">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full cursor-pointer items-center rounded-m border px-m text-body2 ${
          open ? 'border-primary-500' : 'border-gray-400'
        } ${value ? 'text-black-500' : 'text-gray-500'}`}
      >
        {value ? formatFullDate(value) : '날짜 선택'}
      </button>

      {/* 달력이 뜨는 위치는 시안에 없어서 칸 바로 아래(8px)에 왼쪽을 맞춰 띄운다 */}
      {open && (
        <div className="absolute top-full left-0 z-30 mt-xs">
          <Calendar
            variant="popup"
            selectedDate={value}
            onSelect={(dateString) => {
              onChange(dateString)
              setOpen(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
