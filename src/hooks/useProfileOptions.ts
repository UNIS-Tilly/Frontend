import { useQuery } from '@tanstack/react-query'
import { getProfileOptions } from '../api/meta'

// 프로필 선택지(성별·직군·역량). 거의 바뀌지 않는 값이라 한 번 받으면 앱을 쓰는 동안 다시 요청하지 않는다.
export function useProfileOptions() {
  return useQuery({
    queryKey: ['profile-options'],
    queryFn: getProfileOptions,
    staleTime: Infinity,
  })
}
