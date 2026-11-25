import { useEffect, useRef, useState } from 'react'

type Props = {
  taskTitle: string
  onMoveToTomorrow: () => void
  onDelete: () => void
}

// 할 일 한 줄 오른쪽의 ⋮ 버튼과, 누르면 열리는 메뉴(수정 / 내일 하기 / 삭제).
// 시안: docs/design/screens/1-home/popover-task-menu.svg (158×125)
// 메뉴 위치는 피그마 1-2 home-popover 캡처 기준: ⋮ 아래로 12px, 오른쪽 끝은 ⋮보다 4px 안쪽.
export default function TaskMenu({ taskTitle, onMoveToTomorrow, onDelete }: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 메뉴가 열려 있을 때만: 메뉴 바깥을 누르거나 Esc 를 누르면 닫는다.
  useEffect(() => {
    if (!open) return

    function handleMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    // 메뉴가 닫히거나 화면에서 사라질 때 등록한 리스너를 꼭 지운다.
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  // 메뉴 항목을 누르면 메뉴를 닫고 동작을 실행한다.
  function select(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div ref={containerRef} className="relative ml-[18px] size-6 shrink-0">
      <button
        type="button"
        aria-label={`${taskTitle} 메뉴`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid size-6 cursor-pointer place-items-center text-black"
      >
        <MoreVerticalIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full right-2xs z-10 mt-s flex w-[158px] flex-col overflow-hidden rounded-m border border-gray-400 bg-white text-body2 font-normal shadow-popover"
        >
          {/* TODO(할 일 추가 모달을 만들 때): "수정"은 같은 모달을 수정 모드로 열어 연결한다. 지금은 눌러도 동작하지 않는다. */}
          <button
            type="button"
            role="menuitem"
            disabled
            className="h-[38px] border-b border-gray-300 text-black-500"
          >
            수정
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => select(onMoveToTomorrow)}
            className="h-[43px] cursor-pointer border-b border-gray-300 text-black-500"
          >
            내일 하기
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => select(onDelete)}
            className="h-[43px] cursor-pointer text-red-500"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  )
}

// ⋮ 아이콘 (시안: akar-icons more-vertical, 24px, 선 2px)
function MoreVerticalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-6">
      <circle cx="12" cy="6" r="0.75" />
      <circle cx="12" cy="12" r="0.75" />
      <circle cx="12" cy="18" r="0.75" />
    </svg>
  )
}
