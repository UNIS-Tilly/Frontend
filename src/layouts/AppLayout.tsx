import { NavLink, Outlet } from 'react-router'

// 하단 탭(모바일) / 왼쪽 사이드바(PC)에 보여줄 메뉴. 기능명세서의 1depth 순서와 같다.
const MENUS = [
  { to: '/', label: '홈', end: true },
  { to: '/record', label: '기록', end: false },
  { to: '/archive', label: '아카이브', end: false },
  { to: '/insights', label: '인사이트', end: false },
  { to: '/settings', label: '설정', end: false },
]

// 로그인 후 모든 화면에 공통으로 씌우는 틀. 실제 화면은 <Outlet /> 자리에 들어온다.
export default function AppLayout() {
  return (
    <div className="min-h-screen md:flex">
      <nav
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface md:static
          md:w-52 md:flex-col md:gap-1 md:border-t-0 md:border-r md:p-4"
      >
        <div className="hidden px-3 pb-4 text-xl font-bold text-brand-600 md:block">TILLY</div>
        {MENUS.map((menu) => (
          <NavLink
            key={menu.to}
            to={menu.to}
            end={menu.end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm md:flex-none md:rounded-lg md:px-3 md:text-left ${
                isActive ? 'font-semibold text-brand-700 md:bg-brand-100' : 'text-muted'
              }`
            }
          >
            {menu.label}
          </NavLink>
        ))}
      </nav>

      {/* 모바일에서는 하단 탭에 가리지 않도록 아래 여백(pb-24)을 둔다 */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-8">
        <Outlet />
      </main>
    </div>
  )
}
