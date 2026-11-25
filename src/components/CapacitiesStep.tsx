import type { ReactNode } from 'react'
import { useProfileOptions } from '../hooks/useProfileOptions'
import type { CompetencyOption } from '../types/meta'
import SelectChip from './SelectChip'

type Props = {
  targetJobGroup: string | null // 0-3에서 고른 희망 직군 code
  selected: string[] // 고른 역량 code (공통 + 직군)
  onChange: (selected: string[]) => void
  onSubmit: () => void // "다음" = 가입 마무리(서버 저장)
  submitting: boolean
  errorMessage: string | null
}

// 가입 3단계: 얻고 싶은 역량. 시안: docs/design/screens/0-signup/0-4-capacities.svg
// 칩 이름은 시안 예시 대신 서버 선택지(GET /meta/profile-options, 지금은 mock)를 쓴다.
// 서버 규칙: 공통 역량 1~3개, 희망 직군 역량 2~5개. 최소 개수를 채우기 전에는 "다음"이 회색으로 막혀 있고,
// 최대 개수를 채운 뒤에는 그 묶음의 다른 칩을 눌러도 선택되지 않는다(시안에 안내가 없어 조용히 막는다).
export default function CapacitiesStep({
  targetJobGroup,
  selected,
  onChange,
  onSubmit,
  submitting,
  errorMessage,
}: Props) {
  const options = useProfileOptions()

  if (options.isPending) {
    return <p className="text-body2 text-black-300">역량 목록을 불러오는 중이에요…</p>
  }
  if (options.isError) {
    return (
      <div className="flex flex-col items-center gap-xs">
        <p className="text-body2 text-black-300">{options.error.message}</p>
        <button
          type="button"
          onClick={() => void options.refetch()}
          className="cursor-pointer text-body3 text-primary-600 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const { competencies, selectionRules } = options.data
  const jobCompetencies = competencies.filter(
    (competency) => competency.type === 'JOB' && competency.jobGroup === targetJobGroup,
  )
  const commonCompetencies = competencies.filter((competency) => competency.type === 'COMMON')

  // 지금 화면에 보이는 칩 중에서 고른 개수 (희망 직군을 바꾸고 돌아온 경우 예전 직군 역량은 세지 않는다)
  const countSelected = (list: CompetencyOption[]) =>
    list.filter((competency) => selected.includes(competency.code)).length
  const jobCount = countSelected(jobCompetencies)
  const commonCount = countSelected(commonCompetencies)

  const canSubmit =
    !submitting &&
    jobCount >= selectionRules.jobMin &&
    jobCount <= selectionRules.jobMax &&
    commonCount >= selectionRules.commonMin &&
    commonCount <= selectionRules.commonMax

  // 칩을 누르면 선택/해제. 그 묶음이 이미 최대 개수면 새로 고르지 않는다.
  const toggle = (code: string, groupCount: number, groupMax: number) => {
    if (selected.includes(code)) onChange(selected.filter((item) => item !== code))
    else if (groupCount < groupMax) onChange([...selected, code])
  }

  return (
    <div className="flex w-[500px] flex-col">
      <h1 className="text-center text-h2 font-semibold text-black-500">
        현재 인턴 경험을 통해 얻고 싶은 역량
      </h1>
      <p className="mt-xs text-center text-body2 text-black-300">
        현재 인턴 경험을 통해 얻고 싶은 역량을 선택해 주세요. 중복 선택이 가능합니다.
      </p>

      <SectionLabel className="mt-3xl">희망 직군의 주요 역량</SectionLabel>
      <ChipGroup>
        {jobCompetencies.map((competency) => (
          <SelectChip
            key={competency.code}
            label={competency.label}
            selected={selected.includes(competency.code)}
            onClick={() => toggle(competency.code, jobCount, selectionRules.jobMax)}
          />
        ))}
      </ChipGroup>

      <SectionLabel className="mt-2xl">공통 역량 (직군 무관)</SectionLabel>
      <ChipGroup>
        {commonCompetencies.map((competency) => (
          <SelectChip
            key={competency.code}
            label={competency.label}
            selected={selected.includes(competency.code)}
            onClick={() => toggle(competency.code, commonCount, selectionRules.commonMax)}
          />
        ))}
      </ChipGroup>

      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-3xl h-[42px] cursor-pointer rounded-m bg-primary-500 text-button font-semibold text-white disabled:cursor-default disabled:bg-gray-400"
      >
        다음
      </button>
      {/* 가입 저장 실패 문구 (시안에 없는 상태라 버튼 아래 한 줄로 둔다) */}
      {errorMessage && (
        <p role="alert" className="mt-m text-center text-body3 text-danger">
          {errorMessage}
        </p>
      )}
    </div>
  )
}

// 묶음 이름 (16px, 시안은 칩 묶음보다 12.5px 안쪽에서 시작) + 필수 표시 *
function SectionLabel({ children, className }: { children: string; className: string }) {
  return (
    <p className={`pl-[12.5px] text-body2 text-black-500 ${className}`}>
      {children}
      <span className="text-red-500"> *</span>
    </p>
  )
}

// 칩 묶음: 줄마다 가운데 정렬. 시안의 한 줄(공통 역량 5개)이 560px 가까이 돼서 양옆을 30px 씩 넓혔다.
function ChipGroup({ children }: { children: ReactNode }) {
  return <div className="-mx-[30px] mt-m flex flex-wrap justify-center gap-m">{children}</div>
}
