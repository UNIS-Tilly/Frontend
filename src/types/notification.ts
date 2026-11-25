// 알림 하나. (2026-11-26) 백엔드에 알림 API가 아직 없어서 시안(1-7 home-notification)에 보이는 정보로만 정한 임시 모양이다.
// 알림 API가 생기면 백엔드 DTO에 맞춰 이 타입을 다시 정한다. (예: timeLabel → 서버가 주는 생성 시각)
export type AppNotification = {
  id: number
  title: string
  body: string // 시안처럼 줄을 직접 나누려고 '\n' 을 쓸 수 있다
  timeLabel: string // '방금 전', '1시간 전', '어제' …
  read: boolean
}
