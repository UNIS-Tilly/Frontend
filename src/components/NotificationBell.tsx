import { useRef, useState } from 'react'
import { useCloseOnOutside } from '../hooks/useCloseOnOutside'
import type { AppNotification } from '../types/notification'

// MOCK: 알림은 나중에 구현하기로 했다(2026-11-26, 백엔드 알림 API 없음).
// 지금은 시안(docs/design/screens/1-home/1-7-home-notification.svg)의 예시 알림을 그대로 보여 주고,
// "읽음" 처리도 서버 없이 이 화면 안에서만 바뀐다. 새로고침하면 처음 상태로 돌아간다.
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 1,
    title: '마감이 곧 다가와요',
    body: '‘주간 회의 자료 수집 및 자료 정리’가\n오늘 11:00에 마감이에요.',
    timeLabel: '방금 전',
    read: false,
  },
  {
    id: 2,
    title: '주간 인사이트가 도착했어요',
    body: '11월 2주차 분석 결과를 확인하고\n다음 주 행동을 골라 보세요.',
    timeLabel: '1시간 전',
    read: false,
  },
  {
    id: 3,
    title: '오늘 기록을 아직 남기지 않았어요',
    body: '퇴근 전 5분만 투자해 오늘의 경험을 기록해 볼까요?',
    timeLabel: '어제',
    read: true,
  },
  {
    id: 4,
    title: '새싹이 자라고 있어요',
    body: '기록이 쌓여 흙에서 새싹 단계에\n한 걸음 가까워졌어요.',
    timeLabel: '2일 전',
    read: true,
  },
]

// 상단 바 오른쪽의 종 아이콘 + 누르면 열리는 알림 패널.
// 패널 위치는 시안 기준: 화면 위에서 70px, 오른쪽에서 56px (상단 바와 살짝 겹친다)
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const containerRef = useRef<HTMLDivElement>(null)
  useCloseOnOutside(containerRef, open, () => setOpen(false))

  const unreadCount = notifications.filter((notification) => !notification.read).length

  function markAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    )
  }

  function markAllAsRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
  }

  return (
    <div ref={containerRef}>
      <button
        type="button"
        aria-label={unreadCount > 0 ? `알림 (안 읽은 알림 ${unreadCount}개)` : '알림'}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="grid size-6 cursor-pointer place-items-center text-black-500"
      >
        <BellIcon hasUnread={unreadCount > 0} />
      </button>

      {open && (
        <section
          aria-label="알림"
          className="fixed top-[70px] right-3xl z-40 w-[400px] overflow-hidden rounded-m bg-white shadow-panel"
        >
          <div className="flex h-[61px] items-center justify-between px-l">
            <div className="flex items-center gap-2xs">
              <h2 className="text-h3 font-semibold text-black-500">알림</h2>
              {unreadCount > 0 && (
                <span className="grid h-[22px] min-w-[25px] place-items-center rounded-full bg-primary-500 px-xs text-body3 text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              className="cursor-pointer text-body2 text-primary-600"
            >
              모두 읽음
            </button>
          </div>

          <ul>
            {notifications.map((notification) => (
              <li key={notification.id}>
                {/* 안 읽은 알림은 흰 배경 + 파란 점, 읽은 알림은 회색 배경 (디자이너 전언) */}
                <button
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  className={`flex w-full cursor-pointer items-start justify-between px-l py-m text-left ${
                    notification.read ? 'bg-gray-100' : 'bg-white'
                  }`}
                >
                  <div>
                    <p className="text-body2 text-black-500">{notification.title}</p>
                    <p className="mt-2xs text-body3 whitespace-pre-line text-black-300">
                      {notification.body}
                    </p>
                    <p className="mt-2xs text-caption font-normal text-gray-500">
                      {notification.timeLabel}
                    </p>
                  </div>
                  {!notification.read && (
                    <span
                      aria-label="안 읽음"
                      className="mt-xs size-2 shrink-0 rounded-full bg-primary-500"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// 종 아이콘 (시안 components/notification.svg). 안 읽은 알림이 있으면 오른쪽 위에 빨간 점.
function BellIcon({ hasUnread }: { hasUnread: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
      aria-hidden="true"
    >
      {/* 시안 원본 좌표가 (21, 21)만큼 밀려 있어서 되돌린다 */}
      <g transform="translate(-21 -21)">
        <path d="M36.25 40.5834C36.25 41.4454 35.9076 42.272 35.2981 42.8815C34.6886 43.491 33.862 43.8334 33 43.8334C32.138 43.8334 31.3114 43.491 30.7019 42.8815C30.0924 42.272 29.75 41.4454 29.75 40.5834M33.7811 25.42L32.1929 25.4168C28.5702 25.4081 25.4253 28.3515 25.4004 31.9168V36.0226C25.4004 36.8784 25.2921 37.7137 24.8252 38.4254L24.5142 38.8999C24.0408 39.6193 24.55 40.5834 25.4004 40.5834H40.5996C41.45 40.5834 41.9581 39.6193 41.4857 38.8999L41.1748 38.4254C40.709 37.7137 40.5996 36.8773 40.5996 36.0215V31.9179C40.5562 28.3515 37.4037 25.4287 33.7811 25.42Z" />
        <path d="M33 22.1667C33.5746 22.1667 34.1257 22.395 34.532 22.8013C34.9384 23.2077 35.1666 23.7588 35.1666 24.3334V25.4167H30.8333V24.3334C30.8333 23.7588 31.0616 23.2077 31.4679 22.8013C31.8742 22.395 32.4253 22.1667 33 22.1667Z" />
      </g>
      {hasUnread && <circle cx="18.5" cy="6.5" r="2.5" stroke="none" className="fill-red-500" />}
    </svg>
  )
}
