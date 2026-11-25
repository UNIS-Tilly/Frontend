type Props = {
  checked: boolean
}

// 체크박스 모양(24px). 시안: docs/design/components/checkbox.svg
// 모양만 그린다. 누르는 동작은 감싸는 버튼(role="checkbox")이 맡는다. (할 일 목록, 약관 동의에서 같이 쓴다)
export default function Checkbox({ checked }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-6 shrink-0 place-items-center rounded-[6px] ${
        checked ? 'bg-primary-500' : 'border-[1.5px] border-gray-500 bg-white'
      }`}
    >
      {checked && (
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
  )
}
