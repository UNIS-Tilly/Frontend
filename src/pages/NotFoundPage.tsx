import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 text-center">
      <div>
        <p className="text-body1 font-semibold">페이지를 찾을 수 없어요</p>
        <Link to="/" className="mt-s inline-block text-body3 text-primary-600 underline">
          홈으로 가기
        </Link>
      </div>
    </div>
  )
}
