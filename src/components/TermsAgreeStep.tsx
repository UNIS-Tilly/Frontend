import { useState } from 'react'
import Checkbox from './Checkbox'

// 약관 목록. 2026-11-26 사용자 결정으로 시안(0-2) 문구를 그대로 쓴다.
// TODO(기획 확정 후): 시안의 4줄이 모두 같은 이름인 자리 채움이고, 본문도 다른 서비스 문구가 섞인 예시다.
//   실제 약관 이름·필수 여부·본문을 받으면 이 배열만 바꾸면 된다. (배포 전 반드시 교체)
const TERMS = [1, 2, 3, 4].map((id) => ({
  id,
  title: '[필수] 개인정보 수집·이용',
  required: true,
  content:
    '회원가입 및 서비스 제공을 위해 개인정보를 수집·이용합니다. 수집하는 개인정보 항목은 이메일 주소 및 비밀번호, 닉네임, 현재 직무 및 희망 직무, 역량입니다. 수집된 개인정보는 회원 식별 및 계정 관리, 아동의 학습 설정 및 학습 ',
}))

type Props = {
  onNext: () => void
}

// 가입 1단계: 약관 동의. 시안: docs/design/screens/0-signup/0-2-terms-agree.svg, 약관 한 줄은 components/terms-agree.svg
// 백엔드에는 약관 동의를 저장하는 곳이 없다(API_SPEC: 약관 화면은 백엔드 범위 밖). 그래서 필수 약관에 모두 동의해야
// "다음"으로 넘어가게만 하고, 동의 내용은 서버로 보내지 않는다.
export default function TermsAgreeStep({ onNext }: Props) {
  const [agreedIds, setAgreedIds] = useState<number[]>([]) // 동의한 약관 id
  const [openIds, setOpenIds] = useState<number[]>([]) // 본문을 펼친 약관 id

  const allAgreed = agreedIds.length === TERMS.length
  // 디자이너 원칙(할 일 추가 모달과 같게): 필수 항목을 다 채우기 전에는 버튼이 회색으로 막혀 있다.
  const canProceed = TERMS.every((term) => !term.required || agreedIds.includes(term.id))

  // 배열에 id 가 있으면 빼고, 없으면 넣는다.
  const toggleId = (ids: number[], id: number) =>
    ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]

  return (
    <div className="flex w-[500px] flex-col">
      {/* 제목·안내 문구는 시안 그대로다(0-3 화면과 같은 문구라 디자이너 확인 중) */}
      <h1 className="text-center text-h2 font-semibold text-black-500">
        기본 정보를 입력해 주세요.
      </h1>
      <p className="mt-xs text-center text-body2 text-black-300">*표시는 필수 입력 항목입니다.</p>

      <button
        type="button"
        role="checkbox"
        aria-checked={allAgreed}
        onClick={() => setAgreedIds(allAgreed ? [] : TERMS.map((term) => term.id))}
        className="mt-3xl flex h-[50px] cursor-pointer items-center gap-m rounded-m bg-white px-m text-body2 text-black-500"
      >
        <Checkbox checked={allAgreed} />
        전체 동의하기
      </button>

      <ul className="mt-xs">
        {TERMS.map((term) => {
          const agreed = agreedIds.includes(term.id)
          const open = openIds.includes(term.id)
          return (
            <li key={term.id}>
              {/* 펼친 약관은 줄 아래에 회색 구분선이 생긴다(시안 terms-agree) */}
              <div
                className={`flex h-[52px] items-center px-m ${open ? 'border-b border-gray-400' : ''}`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={agreed}
                  onClick={() => setAgreedIds((current) => toggleId(current, term.id))}
                  className="flex flex-1 cursor-pointer items-center gap-m text-left text-body2 text-black-500"
                >
                  <Checkbox checked={agreed} />
                  {term.title}
                </button>
                <button
                  type="button"
                  aria-expanded={open}
                  aria-label={`${term.title} ${open ? '접기' : '펼치기'}`}
                  onClick={() => setOpenIds((current) => toggleId(current, term.id))}
                  className="mr-[6.5px] grid size-6 cursor-pointer place-items-center text-black-500"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.54}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`size-6 ${open ? 'rotate-180' : ''}`}
                  >
                    <path d="M5.833 8.917L12 15.083L18.167 8.917" />
                  </svg>
                </button>
              </div>

              {/* 약관 본문 (시안: 흰 상자 높이 208, 길면 상자 안에서 스크롤) */}
              {open && (
                <div className="h-[208px] overflow-y-auto bg-white px-l py-m text-body3 text-black-300">
                  {term.content}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="mt-[30px] h-[42px] cursor-pointer rounded-m bg-primary-500 text-button font-semibold text-white disabled:cursor-default disabled:bg-gray-400"
      >
        다음
      </button>
    </div>
  )
}
