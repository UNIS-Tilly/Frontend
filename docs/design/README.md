# 디자인 시안 (피그마 내보내기)

피그마: https://www.figma.com/design/vBVlWxoyNSkaw2aNBv96vV/TiLLy

- **마지막 전체 내보내기: 2026-11-24** (이전 내보내기는 모두 지우고 새로 저장함)
- 모든 화면이 디자인 시스템 색을 쓰는 **하이파이**다. (피그마 페이지 이름은 "와이어프레임"이지만 내용은 하이파이)
- 시안과 다른 자료(기획서·백엔드 명세)가 충돌하면 **시안이 우선**이다. 다른 점은 `docs/PROJECT_STATUS.md`에 기록한다.

## 내보내기 규칙

피그마 Export에서 **SVG**, 아래 설정으로 내보낸다.

| 옵션 | 값 | 이유 |
| --- | --- | --- |
| Outline text | **해제** | 글자가 그림이 아니라 텍스트로 남아 문구를 읽을 수 있다 |
| Include "id" attribute | **체크** | 피그마 레이어 이름이 남아 요소를 알아보기 쉽다 |
| Ignore overlapping layers | 체크 | |
| Include bounding box | 해제 | |

새로 내보낸 파일은 `_inbox/`에 넣고, 정리할 때 아래 폴더와 영어 이름(소문자·하이픈)으로 옮긴다. 같은 파일을 갱신할 때는 **같은 이름으로 덮어쓰고** 아래 "변경 이력"에 한 줄 적는다.

## 폴더 구조

```
system/       디자인 시스템 (색·글자·라운드·간격)
components/   컴포넌트 (하나당 파일 하나), icons/ 사이드바 아이콘
screens/      화면 (번호는 피그마 프레임 번호)
_inbox/       새로 내보낸 파일 임시 보관
```

## 파일 목록

### system
| 파일 | 내용 |
| --- | --- |
| design-system.svg | 서체(Headline 1~3, Body 1~3, Button, Caption), 색(Primary·Secondary·Black/Gray), 라운드, 간격 |

### components
| 파일 | 내용 |
| --- | --- |
| menu.svg | 사이드바 메뉴: 기본 / hover(Gray 200 배경) / 선택(Primary 100 배경, Primary 600 글자) |
| icons/*.svg | 사이드바 아이콘 5개 (home, record, archive, insight, setting) |
| top-bar.svg | 상단 바 (화면 이름 + 종 아이콘, 뒤로 가기형) |
| notification.svg | 종 아이콘 (빨간 점 있음/없음) |
| button-record-complete.svg | "기록 완료하기" 버튼 6종 (기본·비활성·눌림·연한 파랑·흰 배경 외곽선·빨강) |
| button-select.svg | 선택 버튼 ("남성" 예시, 상태 3종) |
| chip-select.svg | 선택 칩 ("서비스 기획" 예시, 상태 3종) |
| chip-dday.svg | D-DAY 칩 2종 |
| checkbox.svg | 체크박스 (체크/해제) |
| inputbox.svg | 입력창 5종 (기본·오류 문구·포커스·입력됨 등) |
| dropdown-time.svg | 시간 선택 드롭다운 (오전/오후, 1시~). 목록을 스크롤하면 오른쪽 바가 따라 내려간다 |
| calendar-day.svg | 달력 날짜 칸 상태 8종 |
| todo-item.svg | 할 일 한 줄 (완료/미완료 × 마감 있음/없음) |
| terms-agree.svg | 약관 동의 항목 (접힘/펼침, 약관 문구 포함) |
| insight-list-item.svg | 인사이트 목록 한 줄 (제목·요약·기간) |
| insight-sort-dropdown.svg | 인사이트 목록 정렬 (최신순/오래된순) |
| insight-strength.svg | 인사이트 강점 카드 |
| insight-recommendation.svg | 추천 행동 선택 항목 (선택/해제) |
| plan-box.svg | 요금제 상태 카드 (프리미엄 이용 중 / 무료 이용 중) |
| level-card.svg | 홈 성장 단계 카드 3종 (1단계 흙 / 새싹 / 흙+새싹 그림). 그림은 `level-stages.svg`와 같은 PNG를 잘라 쓴다. 2·3번째는 문구가 맞지 않아 자리 채움으로 보임. 코드는 첫 번째만 사용(흙 그림 → `src/assets/level-soil.png`) |

### screens
| 파일 | 화면 |
| --- | --- |
| 0-signup/0-1-login.svg | 로그인 (Google로 계속하기) |
| 0-signup/0-2-terms-agree.svg | 가입: 약관 동의 |
| 0-signup/0-3-basic-information.svg | 가입: 기본 정보 (닉네임·성별·나이·퇴근 시간·현재/희망 직군) |
| 0-signup/0-4-capacities.svg | 가입: 얻고 싶은 역량 |
| 1-home/1-1-home.svg | 홈 (캘린더, 흙 단계 카드, 이번 주 추천 행동, 할 일 체크리스트) |
| 1-home/1-2-home-popover.svg | 홈: 할 일 ⋮ 메뉴가 열린 상태 (메뉴 자체는 이 파일에 없고 `popover-task-menu.svg`. 위치는 피그마 캡처 기준 ⋮ 아래 12px·오른쪽 4px 안쪽) |
| 1-home/1-3-modal-todo-empty.svg | 할 일 추가 모달: 빈 상태 |
| 1-home/1-4-modal-todo-typed.svg | 할 일 추가 모달: 할 일 입력됨 |
| 1-home/1-5-modal-todo-ampm-open.svg | 할 일 추가 모달: 오전/오후 목록 펼침 |
| 1-home/1-6-modal-todo-filled.svg | 할 일 추가 모달: 마감 기한까지 입력됨 |
| 1-home/1-7-home-notification.svg | 홈: 종 아이콘을 눌러 연 알림 패널 ("알림" + 안 읽은 개수, "모두 읽음", 알림 4종 예시: 마감 임박 · 주간 인사이트 도착 · 오늘 기록 안 함 · 단계 성장). 읽은 알림은 회색 배경, 안 읽은 알림은 흰 배경(디자이너 전언). **백엔드에 알림 기능 없음 → 보류** |
| 1-home/date-picker.svg | 날짜 선택 달력 |
| 1-home/popover-task-menu.svg | 할 일 ⋮ 메뉴 팝오버 (수정 / 내일 하기 / 삭제) |
| 1-home/level-stages.svg | 성장 단계 그림 9종 한 장 (흙→새싹→…→커피 받기). 안에 PNG가 들어 있음 |
| 1-home/guide/*.svg | 홈 기능 안내 팝업 ("출근 후 5분 체크리스트를 작성해요"), 진행 점, 버튼 |
| 2-record/2-1-record.svg | 기록 (업무별 짧은 메모, 하루 회고, Tilly 확장 질문 1/3, 기록 완료하기) |
| 2-record/2-2-modal-stop-recording.svg | 기록 중단 확인 모달 |
| 3-archive/3-1-archive-view.svg | 아카이브 (기록 있음) |
| 3-archive/3-2-archive-no-record.svg | 아카이브 (기록 없음) |
| 4-insight/4-1-insight-home.svg | 인사이트 홈 (분석 요청, 인사이트 목록) |
| 4-insight/4-1-1-modal-before-friday.svg | 모달: 이번 주 리포트는 금요일에 도착 |
| 4-insight/4-1-2-modal-no-report.svg | 모달: 저번 주 리포트 미발행 (주 3회 이상 기록 필요) |
| 4-insight/4-2-insight-report.svg | 인사이트 리포트 |
| 5-settings/5-1-settings.svg | 환경 설정 (계정 정보, 요금제) |
| 5-settings/5-2-settings-edit-information.svg | 정보 수정 |
| 5-settings/modal-delete-account.svg | 탈퇴 확인 모달 |
| 5-settings/modal-logout.svg | 로그아웃 확인 모달 |

## 이번 내보내기에 없는 것 (2026-11-12 내보내기에는 있었음)

- 로고 단독 파일 (코드에는 `src/assets/logo.svg`로 복사돼 있음)
- "명세 P-01~05" 프레임 (화면별 로딩·빈 상태·오류 문구)
- 퇴근 연출 ①~④
- 홈 기능 안내 팝업 2~5번째 장 (이번엔 1장만)
- 로그인 실패 화면

## 변경 이력

- **2026-11-24** 전체 재내보내기(텍스트 유지 설정). 디자이너 댓글로 알려 준 컴포넌트 변경:
  - 버튼: "기록 완료하기" 흰 배경 외곽선 배리언트, 빨강 배리언트(배경 red/200 `#FFCECE`) 추가
  - 입력창: 3·4번째 배리언트 테두리색 변경, 마지막 배리언트 글자색 변경
  - 드롭다운(시간 선택) 추가
- **2026-11-24 (추가)** 팝업은 화면과 따로 내보내야 해서 추가로 받음: 할 일 ⋮ 메뉴 팝오버, 성장 단계 그림 9종
- **2026-11-26** 레벨 카드 컴포넌트(`level-card.svg`) 추가. 진행 막대 채움색은 시안의 `#C5EA54`에서 Primary/500으로 바뀜(디자이너 알림, 파일은 아직 옛 색)
- **2026-11-26** 홈 알림 패널 `1-7-home-notification.svg` 추가. 디자이너 전언: ① 할 일 추가 모달은 할 일을 입력하기 전에는 버튼이 회색으로 막혀 있어야 함 ② 드롭다운: 오전/오후는 스크롤 없는 버전, 시·분은 스크롤 있는 버전. 시는 1~12시, 분은 0·5·10…55분(5분 단위) ③ 알림은 읽은 것 회색 배경, 안 읽은 것 흰 배경
