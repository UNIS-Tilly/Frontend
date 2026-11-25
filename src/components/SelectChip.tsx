type Props = {
  label: string
  selected: boolean
  onClick: () => void
}

// 선택 칩. 시안: docs/design/components/chip-select.svg
//  - 기본: 흰 배경 + 회색 테두리 / 마우스 올림: 연한 파랑 + 연한 파랑 테두리 / 선택: 연한 파랑 + 진한 파랑 테두리 + 체크 표시
// 가입 화면의 직군(0-3)·역량(0-4) 선택에서 같이 쓴다.
export default function SelectChip({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex h-11 cursor-pointer items-center rounded-full border text-body2 ${
        selected
          ? 'gap-[9px] border-primary-600 bg-primary-100 pr-m pl-[17px] text-primary-600'
          : 'border-gray-400 bg-white px-m text-black-500 hover:border-primary-300 hover:bg-primary-100 hover:text-primary-600'
      }`}
    >
      {selected && (
        <svg
          viewBox="38 38 10 8"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-2 w-[10px]"
          aria-hidden="true"
        >
          <path d="M39 42L42 45L47 39" />
        </svg>
      )}
      {label}
    </button>
  )
}
