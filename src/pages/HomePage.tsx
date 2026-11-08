import PagePlaceholder from '../components/PagePlaceholder'

export default function HomePage() {
  return (
    <PagePlaceholder
      title="홈"
      description="오늘의 업무 체크리스트를 관리하는 진입 화면"
      todos={[
        '날짜 선택',
        '업무 추가 · 수정 · 삭제',
        '업무 완료 체크 / 해제 (자동 저장)',
        '업무 기록하기 (기록 탭으로 이동)',
        '세부 기록하러 가기 / 최근 인사이트 보기 버튼',
      ]}
    />
  )
}
