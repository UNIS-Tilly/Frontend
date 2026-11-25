import type { ReactNode } from 'react'
import { useProfileOptions } from '../hooks/useProfileOptions'
import { AM_PM_OPTIONS, HOUR_OPTIONS, MINUTE_OPTIONS } from '../lib/time'
import type { SignupBasicInfo } from '../types/auth'
import Dropdown from './Dropdown'
import SelectChip from './SelectChip'

type Props = {
  value: SignupBasicInfo
  onChange: (changed: Partial<SignupBasicInfo>) => void // 바뀐 칸만 넘긴다
  onNext: () => void
}

const NICKNAME_MAX_LENGTH = 10 // 백엔드: 2~10자
const AGE_MIN = 14 // 백엔드: 14~100 [임시]
const AGE_MAX = 100

// 시안 입력창 컴포넌트(inputbox.svg)의 오류 문구
const INVALID_INPUT_MESSAGE = '입력값이 정확하지 않습니다.'

// 가입 2단계: 기본 정보. 시안: docs/design/screens/0-signup/0-3-basic-information.svg
// 2026-11-26 사용자 결정으로 시안과 다르게 한 것:
//  - 성별은 시안대로 남성/여성 2개만 (서버는 기타까지 3개)
//  - 직군은 서버 목록만 보여 주고 시안의 "기타 (직접 입력)"은 뺀다 (서버에 기타·직접 입력 필드가 없음)
//  - 희망 직군은 1개만 고른다 (시안은 중복 선택, 서버는 1개만 저장) → 안내 문구의 "중복 선택이 가능합니다."도 뺐다
export default function BasicInfoStep({ value, onChange, onNext }: Props) {
  const options = useProfileOptions()

  const nicknameLength = value.nickname.trim().length
  const nicknameValid = nicknameLength >= 2 && nicknameLength <= NICKNAME_MAX_LENGTH
  const age = Number(value.ageText)
  const ageValid = value.ageText === '' || (age >= AGE_MIN && age <= AGE_MAX) // 나이는 선택 항목

  // * 표시(필수) 항목을 다 채우기 전에는 "다음" 버튼이 회색으로 막혀 있다.
  const canProceed =
    nicknameValid &&
    ageValid &&
    value.amPm !== null &&
    value.hour !== null &&
    value.minute !== null &&
    value.currentJobGroup !== null &&
    value.targetJobGroup !== null

  // 시안대로 남성/여성만 보여 준다. 이름(label)은 서버 값을 쓴다.
  const genderOptions =
    options.data?.genders.filter((gender) => gender.code === 'MALE' || gender.code === 'FEMALE') ??
    []

  return (
    <div className="flex w-[500px] flex-col">
      <h1 className="text-center text-h2 font-semibold text-black-500">
        기본 정보를 입력해 주세요.
      </h1>
      <p className="mt-xs text-center text-body2 text-black-300">*표시는 필수 입력 항목입니다.</p>

      <FieldLabel required className="mt-3xl" htmlFor="nickname">
        닉네임
      </FieldLabel>
      <TextInput
        id="nickname"
        value={value.nickname}
        onChange={(nickname) => onChange({ nickname })}
        maxLength={NICKNAME_MAX_LENGTH}
        placeholder="어떻게 불러드릴까요?"
        // 1글자만 입력했을 때만 오류를 보여 준다 (비어 있을 때는 아직 입력 전이라 보여 주지 않는다)
        error={nicknameLength === 1 ? INVALID_INPUT_MESSAGE : null}
      />

      <FieldLabel className="mt-2xl">성별</FieldLabel>
      <div className="mt-s flex gap-m">
        {genderOptions.map((gender) => {
          const selected = value.gender === gender.code
          return (
            <button
              key={gender.code}
              type="button"
              aria-pressed={selected}
              // 선택 항목이라 같은 버튼을 다시 누르면 선택이 풀린다.
              onClick={() => onChange({ gender: selected ? null : gender.code })}
              className={`h-11 flex-1 cursor-pointer rounded-m border text-body2 ${
                selected
                  ? 'border-primary-600 bg-primary-100 text-primary-600'
                  : 'border-gray-300 bg-white text-black-500 hover:border-primary-300 hover:bg-primary-100 hover:text-primary-600'
              }`}
            >
              {gender.label}
            </button>
          )
        })}
      </div>

      <FieldLabel className="mt-2xl" htmlFor="age">
        나이
      </FieldLabel>
      <TextInput
        id="age"
        value={value.ageText}
        // 숫자만 남긴다 (만 나이를 정수로 받는다)
        onChange={(text) => onChange({ ageText: text.replace(/\D/g, '') })}
        maxLength={3}
        inputMode="numeric"
        placeholder="만 나이를 입력해 주세요."
        error={ageValid ? null : INVALID_INPUT_MESSAGE}
      />

      <FieldLabel required className="mt-2xl">
        퇴근 시간
      </FieldLabel>
      <p className="mt-2xs pl-[11.5px] text-body3 text-black-300">
        퇴근 시간 30분 전부터 오늘의 업무 기록을 할 수 있어요.
      </p>
      <div className="mt-m flex gap-m">
        <Dropdown
          placeholder="오전/오후"
          options={AM_PM_OPTIONS}
          value={value.amPm}
          onChange={(amPm) => onChange({ amPm })}
          className="flex-1"
        />
        <Dropdown
          placeholder="시간"
          options={HOUR_OPTIONS}
          value={value.hour}
          onChange={(hour) => onChange({ hour })}
          scrollable
          className="flex-1"
        />
        <Dropdown
          placeholder="분"
          options={MINUTE_OPTIONS}
          value={value.minute}
          onChange={(minute) => onChange({ minute })}
          scrollable
          className="flex-1"
        />
      </div>

      <FieldLabel required className="mt-2xl">
        현재 근무 중인 직군
      </FieldLabel>
      <JobGroupChips
        query={options}
        selected={value.currentJobGroup}
        onSelect={(currentJobGroup) => onChange({ currentJobGroup })}
      />

      <FieldLabel required className="mt-2xl">
        희망 직군
      </FieldLabel>
      <p className="mt-2xs pl-[11.5px] text-body3 text-black-300">
        근무를 희망하는 직군을 선택해 주세요.
      </p>
      <JobGroupChips
        query={options}
        selected={value.targetJobGroup}
        onSelect={(targetJobGroup) => onChange({ targetJobGroup })}
      />

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="mt-3xl h-[42px] cursor-pointer rounded-m bg-primary-500 text-button font-semibold text-white disabled:cursor-default disabled:bg-gray-400"
      >
        다음
      </button>
    </div>
  )
}

// 항목 이름 (18px). 시안은 이름이 입력칸보다 11.5px 안쪽에서 시작한다. 필수 항목은 빨간 * 를 붙인다.
function FieldLabel({
  children,
  required = false,
  className = '',
  htmlFor,
}: {
  children: ReactNode
  required?: boolean
  className?: string
  htmlFor?: string
}) {
  return (
    <label htmlFor={htmlFor} className={`block pl-[11.5px] text-body1 text-black-500 ${className}`}>
      {children}
      {required && <span className="text-red-500"> *</span>}
    </label>
  )
}

// 한 줄 입력칸 (시안 inputbox: 높이 48, 테두리 Gray 400, 누르면 파란 테두리, 오류면 아래에 12px 빨간 글씨)
function TextInput({
  id,
  value,
  onChange,
  maxLength,
  placeholder,
  inputMode,
  error,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  placeholder: string
  inputMode?: 'numeric'
  error: string | null
}) {
  return (
    <>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        placeholder={placeholder}
        inputMode={inputMode}
        aria-invalid={error !== null}
        className="mt-xs h-12 w-full rounded-m border border-gray-400 bg-white px-m text-body2 text-black-500 outline-none placeholder:text-gray-500 focus:border-primary-500"
      />
      {error && (
        <p role="alert" className="mt-2xs pl-s text-caption font-normal text-red-500">
          {error}
        </p>
      )}
    </>
  )
}

// 직군 선택 칩 목록. 한 개만 고른다.
function JobGroupChips({
  query,
  selected,
  onSelect,
}: {
  query: ReturnType<typeof useProfileOptions>
  selected: string | null
  onSelect: (code: string) => void
}) {
  if (query.isPending) {
    return (
      <p className="mt-m text-center text-body3 text-black-300">직군 목록을 불러오는 중이에요…</p>
    )
  }
  if (query.isError) {
    return (
      <div className="mt-m flex flex-col items-center gap-xs">
        <p className="text-body3 text-black-300">{query.error.message}</p>
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="cursor-pointer text-body3 text-primary-600 underline"
        >
          다시 시도
        </button>
      </div>
    )
  }

  return (
    // 시안은 줄마다 가운데 정렬이고, 한 줄이 입력칸(500px)보다 조금 넓은 경우가 있어 양옆을 10px 씩 넓혔다.
    <div className="-mx-[10px] mt-m flex flex-wrap justify-center gap-m">
      {query.data.jobGroups.map((jobGroup) => (
        <SelectChip
          key={jobGroup.code}
          label={jobGroup.label}
          selected={selected === jobGroup.code}
          onClick={() => onSelect(jobGroup.code)}
        />
      ))}
    </div>
  )
}
