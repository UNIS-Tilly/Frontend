import type { UserInfo } from '../types/user'
import { apiFetch } from './client'

// 아래 4개는 백엔드 feature/user 브랜치의 UserController 와 같은 경로/형식이다.

export function getMe() {
  return apiFetch<UserInfo>('/api/users/me')
}

export function updateNickname(nickname: string) {
  return apiFetch<{ nickname: string }>('/api/users/me/nickname', {
    method: 'PATCH',
    body: { nickname },
  })
}

// workEndTime 을 null 로 보내면 퇴근 시간 설정이 해제된다.
export function updateWorkEndTime(workEndTime: string | null) {
  return apiFetch<{ workEndTime: string | null }>('/api/users/me/work-end-time', {
    method: 'PUT',
    body: { workEndTime },
  })
}

// 탈퇴. 확인을 위해 가입 이메일을 다시 입력받아 보낸다. (성공하면 서버가 로그아웃 처리까지 한다)
export function withdraw(confirmEmail: string) {
  return apiFetch<null>('/api/users/me/withdrawal', {
    method: 'POST',
    body: { confirmEmail },
  })
}
