import { Route, Routes } from 'react-router'
import AppLayout from './layouts/AppLayout'
import RequireAuth from './layouts/RequireAuth'
import ArchivePage from './pages/ArchivePage'
import GoogleCallbackPage from './pages/GoogleCallbackPage'
import HomePage from './pages/HomePage'
import InsightPage from './pages/InsightPage'
import LoginPage from './pages/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import RecordPage from './pages/RecordPage'
import SettingsPage from './pages/SettingsPage'
import SignupPage from './pages/SignupPage'

// 주소(URL)와 화면(page)을 연결하는 지도. (Spring 의 @RequestMapping 목록과 비슷한 역할)
export default function App() {
  return (
    <Routes>
      {/* 로그인 없이 볼 수 있는 화면 */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback/google" element={<GoogleCallbackPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* 로그인해야 볼 수 있는 화면: RequireAuth 가 검사하고, AppLayout 이 공통 틀(메뉴)을 씌운다 */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/insights" element={<InsightPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
