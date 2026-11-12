import { useQuery } from '@tanstack/react-query'
import { getTasks } from '../api/tasks'

// 선택한 날짜의 할 일을 가져오는 훅. 로딩 중/실패/성공 상태를 TanStack Query 가 관리해 준다.
// queryKey 는 캐시 이름표다. 날짜가 바뀌면 다른 이름표라서 날짜별로 따로 저장·조회된다.
// 나중에 완료 체크 등으로 데이터를 바꾼 뒤 ['tasks'] 이름표를 무효화하면 목록이 새로 불러와진다.
export function useTasks(date: string) {
  return useQuery({
    queryKey: ['tasks', date],
    queryFn: () => getTasks(date),
  })
}
