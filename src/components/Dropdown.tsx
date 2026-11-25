import { useEffect, useRef, useState } from 'react'
import { useCloseOnOutside } from '../hooks/useCloseOnOutside'

export type DropdownOption = { value: string; label: string }

type Props = {
  placeholder: string
  options: DropdownOption[]
  value: string | null // 고른 값. 아직 안 골랐으면 null
  onChange: (value: string) => void
  // true = 스크롤 있는 버전(시·분), false = 스크롤 없는 버전(오전/오후). 디자이너 전언(2026-11-26)
  scrollable?: boolean
  className?: string // 너비 지정용 (예: 'w-[128px]')
}

// 시간 선택 드롭다운. 시안: docs/design/components/dropdown-time.svg
// 누르면 아래(8px 간격)에 목록이 펼쳐지고, 고른 항목은 연한 파랑 배경 + 진한 파랑 글자로 표시한다.
export default function Dropdown({
  placeholder,
  options,
  value,
  onChange,
  scrollable = false,
  className = '',
}: Props) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useCloseOnOutside(containerRef, open, () => setOpen(false))

  const selectedLabel = options.find((option) => option.value === value)?.label

  function select(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full cursor-pointer items-center justify-between rounded-m border bg-white pr-m pl-m text-body2 ${
          open ? 'border-primary-500' : 'border-gray-400'
        } ${selectedLabel ? 'text-black-500' : 'text-gray-500'}`}
      >
        {selectedLabel ?? placeholder}
        <ChevronDownIcon />
      </button>

      {open &&
        (scrollable ? (
          <ScrollableList options={options} value={value} onSelect={select} />
        ) : (
          <ul
            role="listbox"
            className="absolute top-full left-0 z-20 mt-xs flex w-full flex-col gap-2xs rounded-m border border-gray-400 bg-white p-xs"
          >
            {options.map((option) => (
              <OptionItem
                key={option.value}
                option={option}
                selected={option.value === value}
                onSelect={select}
              />
            ))}
          </ul>
        ))}
    </div>
  )
}

const VISIBLE_HEIGHT = 336 // 시안: 7줄이 보이는 목록 높이
const THUMB_HEIGHT = 56 // 시안: 오른쪽 스크롤 바 길이
const PADDING = 9 // 테두리 1 + 안쪽 여백 8

// 스크롤 있는 목록. 브라우저 기본 스크롤바 대신 시안의 얇은 회색 바를 직접 그린다.
function ScrollableList({
  options,
  value,
  onSelect,
}: {
  options: DropdownOption[]
  value: string | null
  onSelect: (value: string) => void
}) {
  const listRef = useRef<HTMLUListElement>(null)
  const [thumbTop, setThumbTop] = useState(PADDING)

  // 목록을 스크롤한 비율(0~1)만큼 바를 위→아래로 옮긴다.
  function updateThumb() {
    const list = listRef.current
    if (!list) return
    const maxScroll = list.scrollHeight - list.clientHeight
    const ratio = maxScroll > 0 ? list.scrollTop / maxScroll : 0
    setThumbTop(PADDING + ratio * (VISIBLE_HEIGHT - PADDING * 2 - THUMB_HEIGHT))
  }

  // 처음 열 때: 이미 고른 값이 있으면 그 줄이 보이도록 스크롤해 둔다.
  useEffect(() => {
    const selectedItem = listRef.current?.querySelector('[aria-selected="true"]')
    selectedItem?.scrollIntoView({ block: 'center' })
    updateThumb()
  }, [])

  return (
    <div className="absolute top-full left-0 z-20 mt-xs w-full overflow-hidden rounded-m border border-gray-400 bg-white">
      <ul
        ref={listRef}
        role="listbox"
        onScroll={updateThumb}
        // 기본 스크롤바 숨기기 (파이어폭스: scrollbar-width, 크롬·엣지: ::-webkit-scrollbar)
        className="flex flex-col gap-2xs overflow-y-auto py-xs pr-[15px] pl-xs [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: VISIBLE_HEIGHT - 2 }} // 테두리 위아래 1px 씩 제외
      >
        {options.map((option) => (
          <OptionItem
            key={option.value}
            option={option}
            selected={option.value === value}
            onSelect={onSelect}
          />
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="absolute right-[8px] w-[3px] rounded-full bg-gray-400"
        style={{ top: thumbTop - 1, height: THUMB_HEIGHT }}
      />
    </div>
  )
}

// 목록의 한 줄 (높이 42, 줄 사이 4)
function OptionItem({
  option,
  selected,
  onSelect,
}: {
  option: DropdownOption
  selected: boolean
  onSelect: (value: string) => void
}) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={() => onSelect(option.value)}
        className={`flex h-[42px] w-full shrink-0 cursor-pointer items-center rounded-s px-m text-body2 ${
          selected ? 'bg-primary-100 text-primary-600' : 'text-black-500 hover:bg-primary-100'
        }`}
      >
        {option.label}
      </button>
    </li>
  )
}

// ⌄ 아이콘 (시안: 16px, 회색 #666)
function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      className="size-4 shrink-0 text-black-300"
      aria-hidden="true"
    >
      <path d="M13.333 5.333L8 10.667L2.667 5.333" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
