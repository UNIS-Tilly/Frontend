import PagePlaceholder from '../components/PagePlaceholder'
import { useAuth } from '../hooks/useAuth'

export default function SettingsPage() {
  const { signOut } = useAuth()

  return (
    <div>
      <PagePlaceholder
        title="설정"
        description="계정과 환경을 관리하는 화면"
        todos={[
          '가입 이메일 확인 · 닉네임 수정',
          '퇴근 시간 수정 (다이얼)',
          '탈퇴 (이메일 재입력 → 경고 → 사유 입력)',
        ]}
      />

      {/* 로그아웃: 서버에 알린 뒤 이 기기의 로그인 상태를 지우고 로그인 화면으로 돌아간다 (RequireAuth 가 처리) */}
      <button
        type="button"
        onClick={() => void signOut()}
        className="mt-6 w-full rounded-xl border border-line bg-surface py-3 text-sm font-medium"
      >
        로그아웃
      </button>
    </div>
  )
}
