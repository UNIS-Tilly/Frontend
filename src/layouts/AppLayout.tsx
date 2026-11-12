import { NavLink, Outlet, useLocation } from 'react-router'
import logoUrl from '../assets/logo.svg'
import {
  ArchiveIcon,
  HomeIcon,
  InsightIcon,
  RecordIcon,
  SettingsIcon,
} from '../components/MenuIcons'

// 왼쪽 사이드바에 보여줄 메뉴. 기능명세서의 1depth 순서와 같다. (PC 1440px 기준 디자인이라 모바일 탭은 없다)
const MENUS = [
  { to: '/', label: '홈', end: true, Icon: HomeIcon },
  { to: '/record', label: '기록', end: false, Icon: RecordIcon },
  { to: '/archive', label: '아카이브', end: false, Icon: ArchiveIcon },
  { to: '/insights', label: '인사이트', end: false, Icon: InsightIcon },
  { to: '/settings', label: '환경 설정', end: false, Icon: SettingsIcon },
]

// 로그인 후 모든 화면에 공통으로 씌우는 틀. 실제 화면은 <Outlet /> 자리에 들어온다.
export default function AppLayout() {
  const { pathname } = useLocation()

  // 상단 바에 보여줄 화면 이름: 지금 주소와 맞는 메뉴의 이름을 쓴다.
  const currentMenu = MENUS.find((menu) =>
    menu.end ? pathname === menu.to : pathname.startsWith(menu.to),
  )

  return (
    <div className="flex min-h-screen">
      {/* 사이드바: 너비 256, 화면 높이만큼 고정(스크롤해도 따라온다) */}
      <aside className="sticky top-0 h-screen w-64 shrink-0 bg-white px-xl pt-xl">
        <img src={logoUrl} alt="TILLY" className="h-[19px] w-[85px]" />

        <nav className="mt-xl flex flex-col gap-xs">
          {MENUS.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-s rounded-s px-s py-xs text-body2 ${
                  isActive ? 'bg-primary-100 text-primary-600' : 'text-black-500'
                }`
              }
            >
              {/* 아이콘은 글자 색(currentColor)을 따라가서 선택된 메뉴만 파랗게 보인다 */}
              <Icon className="size-6" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        {/* 상단 바: 화면 이름. 시안의 알림(종) 아이콘은 역할이 확정되지 않아(CLAUDE.md 12장) 아직 만들지 않았다 */}
        <header className="flex h-[82px] items-center bg-white px-2xl">
          <h1 className="text-h3 font-semibold">{currentMenu?.label}</h1>
        </header>

        <main className="p-2xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
