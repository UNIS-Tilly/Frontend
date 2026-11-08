import PagePlaceholder from '../components/PagePlaceholder'

export default function RecordPage() {
  return (
    <PagePlaceholder
      title="기록"
      description="업무별 한 줄 메모와 하루 회고를 쓰는 화면"
      todos={[
        '업무별 완료 체크 + 한 줄 메모 (자동 저장)',
        '하루 회고 자유 서술',
        'TILLY 확장 질문 확인 · 답변',
        '임시저장',
        '기록 완료하고 퇴근하기',
      ]}
    />
  )
}
