import { useEffect, type RefObject } from 'react'

// 열려 있는 팝업(메뉴·드롭다운·날짜 달력)을 "바깥을 누르거나 Esc 를 누르면" 닫게 하는 훅.
// containerRef: 버튼과 팝업을 함께 감싼 요소. 이 안쪽을 누른 것은 바깥으로 치지 않는다.
export function useCloseOnOutside(
  containerRef: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!open) return

    function handleMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) onClose()
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    // 팝업이 닫히거나 화면에서 사라질 때 등록한 리스너를 꼭 지운다.
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, open, onClose])
}
