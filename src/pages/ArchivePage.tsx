import PagePlaceholder from '../components/PagePlaceholder'

export default function ArchivePage() {
  return (
    <PagePlaceholder
      title="아카이브"
      description="지난 기록을 날짜별로 돌아보는 화면"
      todos={[
        '월별 달력에서 날짜 선택',
        '선택한 날짜의 업무 기록 · 회고 확인',
        '기록 없는 날: 안내 문구 + 기록하러 가기',
      ]}
    />
  )
}
