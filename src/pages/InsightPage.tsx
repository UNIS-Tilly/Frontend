import PagePlaceholder from '../components/PagePlaceholder'

export default function InsightPage() {
  return (
    <PagePlaceholder
      title="인사이트"
      description="주간 분석 결과를 확인하는 화면"
      todos={[
        '인사이트 목록 (주 단위)',
        '이번 주 업무 달성률 (꺾은선 그래프)',
        '이번 주 강점 키워드 · 개선 키워드',
        '다음 주 추천 행동 + 다음 주 체크리스트에 추가',
      ]}
    />
  )
}
