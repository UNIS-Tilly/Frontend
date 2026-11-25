# TILLY 프론트엔드 공유 노트 (FRONT_NOTICE)

이 문서는 **프론트엔드 개발자에게 비공개 채널로 전달할 내용**을 기록한다. 프론트 관점에서 쓰고, 비밀값·내부 구현 설명은 쓰지 않는다. 최신 항목이 **맨 위**에 오도록 추가한다 (`START_PROMPT.md` 5장, `RULES.md` 10.4).

## 기록 대상

엔드포인트 추가·변경·삭제 / 요청·응답 필드와 타입 / 에러 코드와 상태 코드 / 상태 enum 값(`NOT_STARTED`/`DRAFT`/`COMPLETED` 등) / 기록 잠금(`RECORD_LOCKED`) 같은 동작 규칙 / 날짜·시간 형식 / 인증·토큰·CORS 관련 사항 / 폴링이 필요한 흐름 / 프론트가 결정·확인해야 할 항목 / 호환이 깨지는 변경.

## 항목 형식

```
날짜 / 관련 단위(PR) / 유형(신규·변경·삭제·호환 깨짐) / 내용 / 프론트 조치
```

- 호환이 깨지는 변경은 **"⚠️ 호환 깨짐"**으로 눈에 띄게 표시한다.
- 이미 적은 항목의 내용이 이후 작업에서 바뀌면 기존 항목을 지우지 않고 `변경됨(→ 날짜/단위)`로 표시한 뒤, 이전 값과 바뀐 값을 함께 적은 새 항목을 맨 위에 추가한다.

---

### 2026-11-24 / `feature/cors` / 신규 / CORS 설정 (로컬 `http://localhost:5173` 허용)

백엔드가 프론트 로컬 개발 서버(`http://localhost:5173`)에서 오는 요청을 허용합니다. 서버를 `local` 프로파일로 띄운 상태에서 쓰는 설정입니다.

- 허용 출처: `http://localhost:5173` 하나 (`127.0.0.1:5173`은 다른 출처라 **허용되지 않습니다** — `localhost`로 접속하세요). 개발 서버·운영 도메인은 정해지면 알려 주세요.
- 허용 메서드: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- 허용 요청 헤더: `Authorization`, `Content-Type`, `X-Tilly-Client` (이 외의 커스텀 헤더를 보내면 preflight가 403으로 거절됩니다)
- 쿠키: 허용(`Access-Control-Allow-Credentials: true`). Refresh Token이 HttpOnly 쿠키이므로 `reissue`·`logout`·`login`·`register`를 포함해 **쿠키가 오가는 호출은 `credentials: 'include'`(axios는 `withCredentials: true`)가 필요**합니다.
- preflight(OPTIONS)는 인증 없이 통과하고 1시간 캐시됩니다. 응답 헤더 중 `Authorization` 외에 JS에서 읽어야 하는 헤더는 노출하지 않습니다.

프론트 조치: API 호출 클라이언트에 `credentials: 'include'`를 설정하고, 로컬은 `http://localhost:5173`으로 접속합니다. 개발 서버·운영 도메인이 정해지면 백엔드 개발자에게 전달합니다.

---

### 2026-11-24 / `develop` 머지 기준(PR #16~#18) / 안내 / 지금 프론트에서 호출할 수 있는 API 전체 목록

`develop`에 머지된 기준입니다. 요청·응답 세부는 각 항목과 `API_SPEC.md` v0.5를 보세요. 모든 경로는 `/api` 아래이고, 로그인 이후 호출은 `Authorization: Bearer <accessToken>`이 필요합니다.

- **인증**: `POST /auth/register`(선택 `gender`, `age`), `POST /auth/login/google`, `POST /auth/reissue`, `POST /auth/logout`, `POST /auth/dev-login`(local 전용)
- **내 정보**: `GET /users/me`, `PUT /users/me/profile`(`birthYear` 대신 **`age` 14~100**), `PUT /users/me/work-end-time`, `POST /users/me/withdrawal`(탈퇴), `GET /meta/profile-options`(직군·역량 목록과 `selectionRules`: 공통 1~3개, 직군 2~5개)
- **할 일**: `POST /tasks`, `GET /tasks`, `PATCH /tasks/{id}`, `DELETE /tasks/{id}` (단일일 모델, 마감은 날짜+시간)
- **기록**: `GET /records/{date}/summary`, `PUT /records/{date}/draft`, `POST /records/{date}/complete`, `GET /records/{date}/reflection`(저장된 회고 조회, 저장은 `draft`·`complete` 본문의 `reflection`), `GET·POST /records/{date}/questions`(질문 받기, 퇴근 10분 전 자동 질문 포함)
- **아카이브**: `GET /archive/calendar`
- **인사이트**: `GET /insights/weekly?date=`, `POST /insights/weekly`(202), `GET /insights/weekly/latest`, `GET /insights/weekly/list`
- **잠금**: 인사이트가 `GENERATING`/`PUBLISHED`인 주의 기록·할 일을 고치면 `409 RECORD_LOCKED`
- **없는 것**: 추천 행동 반영 API(`/reflect`)와 `reflected`, 인사이트의 `weekEnded`, 프로필의 `birthYear`

프론트 조치: 위 목록에 없는 경로는 아직 백엔드에 없습니다.

### 2026-11-24 / `feature/insight` / ⚠️ 호환 깨짐 / 주간 인사이트 구현 (조회·분석 요청·홈 카드·목록, 인사이트 P-04, 홈 HM-12)

- **`GET /api/insights/weekly?date=YYYY-MM-DD`** (신규, `date`는 그 주 아무 날짜, 생략하면 오늘): 응답 `data` = `{ weekStart, weekEnd, weekLabel, status, eligibility, report }`
  - `weekLabel`: 월요일이 속한 달 기준 N주차(예: `"10월 3주차"`). `status`: `NOT_PUBLISHED`(인사이트 없음) / `GENERATING` / `PUBLISHED` / `FAILED`
  - **`NOT_PUBLISHED`·`FAILED`**: `eligibility`가 채워지고 `report: null`. **`GENERATING`**: `eligibility`·`report` 모두 `null`(프론트가 "분석 중" 안내 후 폴링). **`PUBLISHED`**: `report`가 채워지고 `eligibility: null`
  - **`eligibility` = `{ eligible, requestable, completedDays, requiredDays }`** ⚠️ 이전 설계의 `weekEnded`는 **없습니다**
    - `eligible`: 기록 조건 충족(퇴근 완료 3일 이상 + 분석할 내용 있음). `requestable`: 지금이 요청 가능한 시점인지(이번 주의 금요일 퇴근 완료 뒤·토·일). **"분석 요청하기" 버튼은 둘 다 `true`일 때 활성화**하세요. `requiredDays`는 항상 3
    - 기록 부족 안내는 `eligible: false`, 시점 안내는 `requestable: false`로 구분합니다
  - **`report`** = `{ insightId, generatedAt, warnings, title, subtitle, summary, weeklyAchievement, weeklyFlow, strengths, improvements, actions }`
    - `warnings`: `["INSUFFICIENT_CONTENT"]`이면 메모·회고·답변이 하나도 없어 할 일 제목만으로 분석한 주, 아니면 `[]`
    - `summary`: `{ recordedDays, memoCount, reflectionCount, answerCount }` — **퇴근 완료한 날 기준**. `memoCount`는 그 날들에 배정된 할 일 중 메모가 있는 수, `answerCount`는 답변한 질문 수(건너뜀·빈 답변 제외)
    - `weeklyAchievement`: `{ totalCount, completedCount, days: [{ date, dayOfWeek, completedCount, totalCount }] }` — **월~일 7일 전체**(토·일 포함), 그날(배정일) 추가한 할 일 수 / 그 중 완료한 수. `dayOfWeek`: `MON`~`SUN`. 비율 계산은 프론트
    - `weeklyFlow`: `[{ weekLabel, weekStart, weekEnd, completedCount, totalCount }]` — **같은 달 1주차부터 해당 주차까지**(해당 주 포함), 정의는 `weeklyAchievement`와 같음
    - `strengths`(1~2개): `{ id, title, description, competencyCode, tags, evidences }` — **`competencyCode`는 사용자가 선택한 역량 코드 중 하나, 기록에 근거가 없으면 `null`**(null이면 역량 배지를 숨기세요). `tags`는 `#` 없이 텍스트만
    - `improvements`(1~2개): `{ id, title, description, starPart, evidences }` — **`starPart`**: `S`(상황) / `T`(핵심 과제 파악) / `A`(행동의 판단 기준·이유) / `R`(성과 수치)
    - `evidences[]`(강점·보완 모두): `{ date, type }`, `type` = `MEMO` / `REFLECTION` / `QUESTION_ANSWER` / `TASK`. 칩을 누르면 그 날짜 기록(`GET /api/tasks?date=`, `GET /api/records/{date}/reflection`, `.../questions`)으로 이동
    - `actions`: `[{ id, improvementId, text }]` — 보완 하나당 하나, **20자 이내**. 홈에 보여주기만 하고 **할 일로 반영하지 않습니다**(반영 API·`reflected`·행동 선택 없음)
- **`POST /api/insights/weekly`** (신규): 요청 `{ "date": "2026-10-24" }`(분석할 주 안의 날짜, 보통 오늘) → **`202`**, `data` = `{ insightId, weekStart, weekEnd, weekLabel, status: "GENERATING" }`. 분석은 서버에서 비동기로 진행되므로 **`GET /api/insights/weekly`를 폴링**하세요(AI 응답 대기 최대 수 분)
  - 요청 가능: **이번 주의 금요일(그날 기록을 퇴근 완료한 뒤)·토요일·일요일**. 월~목, 지난 주·다음 주는 불가(놓친 주는 요청할 수 없음)
  - 이미 `GENERATING`이면 새로 시작하지 않고 같은 `insightId`를 `202`로 돌려줍니다(중복 AI 호출 없음). `FAILED` 뒤에는 다시 요청할 수 있습니다
  - **오류**: `422 INSIGHT_NOT_REQUESTABLE`(요청 가능한 시점이 아님) / `422 INSUFFICIENT_RECORDS`(퇴근 완료 3일 미만, 또는 할 일·회고·메모·답변이 모두 없음) / `409 INSIGHT_ALREADY_PUBLISHED`(이미 발행된 주) / `400 BAD_REQUEST`(날짜 형식·누락). `INSIGHT_WEEK_NOT_ENDED`는 **없어졌습니다**
  - 생성 실패(AI 오류 등)는 응답이 아니라 **조회에서 `status: "FAILED"`** 로 알려 줍니다. 프론트가 실패 안내 후 "분석 요청하기"를 다시 보여 주세요. 생성이 **10분을 넘게 끝나지 않으면** 서버가 `FAILED`로 처리합니다
- **잠금 (⚠️ 동작 변경)**: 인사이트가 **`GENERATING`(생성 중)이거나 `PUBLISHED`면 그 주(월~일) 전체가 잠깁니다** → 할 일(추가·수정·삭제·완료 토글·그 주로/에서 배정일 이동), 임시저장·기록 완료·질문 받기·**하루 회고**가 `409 RECORD_LOCKED`. 금요일에 요청하면 토·일도 잠깁니다. `FAILED`가 되면 풀립니다. 조회는 잠겨도 됩니다. `GET /api/records/{date}/summary`의 `locked`가 이 상태를 알려 줍니다. 다른 주는 영향이 없습니다
- **`GET /api/insights/weekly/latest`** (홈 카드, 신규): **가장 최근에 발행된 인사이트** `{ insightId, weekStart, weekEnd, weekLabel, status: "PUBLISHED", title, subtitle, actions: [{ text }] }`. 발행본이 없으면 `status: "NOT_PUBLISHED"`, `insightId`·`title`·`subtitle`은 `null`, `actions: []`. 기존 `/last-week`는 없습니다. 이번 주 `GENERATING`·`FAILED`는 홈 카드에 나오지 않습니다(인사이트 화면에서 확인)
- **`GET /api/insights/weekly/list?sort=latest|oldest&page=0&size=20`** (목록, 신규): **발행된 주만**, `data` = `{ items: [{ insightId, weekStart, weekEnd, weekLabel, title, subtitle }], page, size, totalElements, hasNext }`. `sort` 기본 `latest`(`weekStart` 기준), `page`는 0부터, `size`는 1~100(기본 20). 범위를 벗어나면 `400`. 항목 클릭 시 `GET /api/insights/weekly?date=<weekStart>`로 상세 조회
- 질문·할 일 등 기존 API의 응답 형식은 바뀌지 않았습니다(잠금 때문에 `409 RECORD_LOCKED`가 실제로 나올 수 있게 됨)

**프론트 조치**: 인사이트 탭을 `eligibility.eligible && requestable` 기준의 요청 버튼 + 상태별 화면(`NOT_PUBLISHED`/`GENERATING` 폴링/`PUBLISHED`/`FAILED`)으로 구성, 홈 카드를 `/latest`로 교체(경로 `/last-week` 삭제), 목록 화면 연결, 근거 칩 4종·`competencyCode`(null 허용)·`starPart` 표시, 잠긴 주(`409 RECORD_LOCKED`·`summary.locked`) 읽기 전용 처리, 추천 행동 반영 UI 제거.

---

### 2026-11-24 / 구현됨(PR #18, develop 머지) / 변경 / 추천 행동은 홈 표시만 (반영 기능 삭제)

> **구현됨(→ 2026-11-24 `feature/insight`)**: 추천 행동은 홈 카드(`GET /api/insights/weekly/latest`)로만 내려가며 반영 API는 만들지 않았습니다.

- **변경됨(→ 이 항목)**: 추천 행동을 할 일에 **반영하지 않습니다.** `POST /api/insights/weekly/{insightId}/reflect`, `actions[].reflected`, 반영 토스트, 행동 선택(IN-08)은 **없어집니다.** 아래 항목들의 "추천 행동 반영 보류"는 이 결정으로 대체됩니다.
- 홈의 "이번 주 추천 행동" 카드는 `GET /api/insights/weekly/latest`의 `actions`(문구 목록, 최대 2개, 20자 이내)로 그립니다. 발행본이 없으면 `status: "NOT_PUBLISHED"`와 빈 `actions`입니다. (구현 완료, 위 `feature/insight` 항목의 응답과 같습니다)
- 확인 필요: 홈에 추천 행동을 몇 개 보일지, 완료한 할 일에도 D-DAY를 보일지(현재 `dueInDays`는 완료 시 값 없음), 레벨 카드 진행 막대의 의미.
- 프론트 조치: 반영 UI를 만들지 마세요.

### 2026-11-24 / `feature/record-questions` / 신규 / 질문 받기(`POST /api/records/{date}/questions`)와 자동 질문 구현

- **`POST /api/records/{date}/questions`** (인증 필요) — "질문 받기" 버튼 (RC-06)
  - **요청 본문**: 임시저장(`PUT draft`)과 같은 **현재 입력 전체**, 단 `manual` 없음: `{ "taskMemos": [...], "answers": [...], "reflection": "…" }` (모두 선택, 비우면 "없음"). 서버가 **먼저 저장**(자동저장과 같은 규칙, 기록 상태는 `NOT_STARTED`→`DRAFT`로 올리지 않음)한 뒤 질문을 만듭니다
  - **응답 `data`**: `{ "questions": [ { "id", "order", "text", "answer", "skipped" } ] }` — 항목 형식은 `GET /records/{date}/questions`와 같습니다. 질문은 **항상 1~3개**
  - **이미 질문이 있으면 새로 만들지 않고 기존 질문을 그대로** 돌려줍니다(본문 저장은 수행, 답변을 같이 보내면 반영). 질문 재생성은 없습니다
  - **생성 조건**: 그날 할 일이 1개 이상이거나 회고가 있으면 됩니다(메모가 없어도 됨). 둘 다 없으면 **`422 RECORD_EMPTY`**
  - 퇴근 완료(`COMPLETED`) 뒤에도 질문이 없으면 만들 수 있습니다
  - **오류**: `422 RECORD_EMPTY` / `502 AI_GENERATION_FAILED` / `504 AI_TIMEOUT` / `400 BAD_REQUEST`(날짜·길이 오류) / `404 TASK_NOT_FOUND`·`QUESTION_NOT_FOUND`(그날 것이 아닌 ID). AI가 실패해도 **입력은 저장되어 있으므로** 질문 카드에 "다시 시도"를 보이고 퇴근은 그대로 가능합니다
  - 응답이 AI 호출 때문에 **수 초~최대 15초** 걸릴 수 있습니다(동기 응답). 응답 대기 중 스켈레톤을 보여 주세요
- **자동 질문**(서버 내부): 퇴근 시간(`workEndTime`)의 **10분 전**에 오늘 기록으로 질문을 자동 생성합니다. 퇴근 시간이 없는 사용자, 이미 질문이 있는 날, 이미 퇴근 완료한 날, 그날 할 일도 회고도 없는 날은 만들지 않습니다
  - 별도 알림은 없습니다. 기록 화면이 열려 있는 동안 **`GET /api/records/{date}/questions`를 주기적으로 조회(폴링)**하고 화면 진입 때도 조회하세요
  - 서버가 그 시각에 꺼져 있었거나 AI 호출이 실패하면 **자동 질문은 건너뜁니다**(다시 만들지 않음). 이때도 사용자가 "질문 받기"로 직접 받을 수 있습니다
- 퇴근 5분 전 인앱 안내는 이전과 같이 프론트가 `workEndTime`으로 판단합니다(서버 동작 없음)

**프론트 조치**: "질문 받기" 버튼에 `POST /api/records/{date}/questions` 연결(현재 입력 전체 전송, 로딩 스켈레톤, 오류별 안내: `RECORD_EMPTY`는 "기록을 작성하면 질문이 생겨요" 류 문구 — 문구는 기획 확인), 기록 화면 열려 있는 동안 질문 조회 폴링.

---

### 2026-11-24 / `feature/user-keywords` / ⚠️ 호환 깨짐 / 성장 레벨 순환 + 역량 최대 선택 개수

- **성장 레벨 계산이 바뀌었습니다** ⚠️ (D-143): 퇴근 완료(`COMPLETED`)한 **서로 다른 날이 하루 늘 때마다 레벨이 1씩 오르고, 9 다음은 다시 1**입니다(순환)
  - 가입 직후 1, 1일 → 2, … 8일 → 9, **9일 → 1**, 10일 → 2 …
  - 이전 방식(구간 0/1/3/7/14/30/60/100/150일, "내려가지 않음")은 **폐기**되었습니다. **레벨이 내려갈 수 있습니다**(9 → 1)
  - 응답 위치는 그대로: `GET /api/users/me`의 `level`, `POST /api/records/{date}/complete` 응답의 `level`
  - 새 날짜가 처음 `COMPLETED`가 될 때만 갱신됩니다(이미 완료한 날을 다시 완료·수정해도 변하지 않음)
  - 이미 저장된 사용자의 `level`은 **그대로 두고** 다음 퇴근 완료 때 새 규칙으로 다시 계산됩니다(개발 데이터)
- **역량 최대 선택 개수** (D-144): 공통 역량 **최대 3개**, 희망 직군 역량 **최대 5개**(최소 1개·2개는 그대로)
  - 초과하면 `PUT /api/users/me/profile`이 `400 INVALID_COMPETENCY_SELECTION`(메시지에 사유)
  - `GET /api/meta/profile-options`의 `selectionRules`가 `{ commonMin, commonMax, jobMin, jobMax }`로 **`commonMax`·`jobMax` 필드가 추가**되었습니다(기존 필드 변경 없음). 선택 UI의 개수 제한은 이 값을 쓰세요

**프론트 조치**: 레벨 이미지 매핑을 순환(9 다음 1)에 맞게 확인, 역량 선택 화면에 최대 개수 제한을 `selectionRules.commonMax`/`jobMax`로 적용.

---

### 2026-11-24 / 구현됨(PR #17·#18, develop 머지) / ⚠️ 호환 깨짐 / 인사이트 요청 시점·목록·홈 카드, 레벨·역량 규칙

> **구현됨(→ 2026-11-24 `feature/insight`, user 쪽은 `feature/user-keywords`에서 이미 반영)**: 인사이트 부분의 실제 요청·응답은 위 `feature/insight` 항목을 보세요. 달라진 점: `eligibility`는 `{eligible, requestable, completedDays, requiredDays}`(`weekEnded` 없음), 강점 `competencyCode`는 근거가 없으면 `null`.

**구현 완료(develop 머지).** 설계 당시 설명이며, 실제 응답은 `API_SPEC.md` v0.5(4.6, 9장)와 위 `feature/insight` 항목을 기준으로 하세요.

- **인사이트 분석 요청 시점이 바뀝니다** ⚠️: **금요일(퇴근 완료 후)·토요일·일요일에만** 요청할 수 있고, 요청한 **이번 주(월~일)를 분석**합니다. 월~목에는 요청할 수 없습니다(에러 `422 INSIGHT_NOT_REQUESTABLE`, 이름 잠정). "금요일 퇴근 후"는 **금요일 기록이 퇴근 완료(`COMPLETED`)된 뒤**입니다. 기존 `INSIGHT_WEEK_NOT_ENDED`는 없어집니다
- 인사이트가 `GENERATING`이거나 `PUBLISHED`면 **그 주 전체(월~일)가 잠깁니다**(`409 RECORD_LOCKED`). 금요일에 요청하면 토·일 기록도 잠깁니다. `FAILED`면 풀립니다
- 퇴근 완료 3일 이상 조건과 "할 일 0개인 주도 회고·메모·답변이 있으면 분석, 모두 없으면 `INSUFFICIENT_RECORDS`"는 그대로 적용합니다
- **인사이트 목록** `GET /api/insights/weekly/list?sort=latest|oldest&page=0&size=20` 신규: `PUBLISHED`인 주만, 항목 `{insightId, weekStart, weekEnd, weekLabel, title, subtitle}`, 페이지 응답 `{items, page, size, totalElements, hasNext}`(필드 구성은 잠정). 항목 클릭은 `GET /api/insights/weekly?date=<weekStart>`
- **홈 인사이트 카드**: 지난주 기준이 아니라 **가장 최근에 발행된 인사이트**입니다. 경로 `/api/insights/weekly/last-week` → `/api/insights/weekly/latest`(잠정), 응답에 `insightId`·`title`·`subtitle` 추가, 발행본이 없으면 `status: "NOT_PUBLISHED"`
- 인사이트 상세의 강점 항목에 **`competencyCode`**(역량 코드), 개선 항목에 **`starPart`**(`S`/`T`/`A`/`R`)가 추가됩니다(필드명 잠정). 역량 정의는 `GET /api/meta/profile-options`의 `description`으로 이미 내려갑니다
- **성장 레벨**: 퇴근 완료한 날이 하루 늘 때마다 +1, **9 다음은 1로 순환**합니다. 레벨이 내려갈 수 있습니다(9 → 1) ⚠️. 이미지 매핑은 그대로 `level` 숫자로
- **역량 선택 개수 제한**: 공통 역량 **1~3개**, 희망 직군 역량 **2~5개**. 초과·미달은 `400 INVALID_COMPETENCY_SELECTION`. `profile-options`의 `selectionRules`에 `commonMax`(3), `jobMax`(5)가 추가됩니다
- 성별 선택지(남성/여성/기타), 재직 직군에 "기타" 없음, 아카이브 "기록 있음" = 임시저장 버튼을 누른 날 + 퇴근 완료한 날은 현재와 같습니다
- **추천 행동 반영은 보류**(위 항목 참고): 추천 행동 조회 화면이 정해지면 다시 공지합니다

**프론트 조치**: 분석 요청 버튼을 금~일에만 활성화(금요일은 퇴근 완료 후), 홈 카드·목록·상세 호출 경로 갱신, 역량 선택 UI에 최대 개수, 레벨 순환 처리. 인사이트 API는 구현 PR이 머지되면 다시 공지합니다.

---

### 2026-11-24 / 구현됨(PR #17·#18, develop 머지) / ⚠️ 호환 깨짐 / 회고 복원과 할 일 단일일 모델이 인사이트 API에 미치는 영향

> **구현됨(→ 2026-11-24 `feature/insight`)**: `reflectionCount`·`REFLECTION` 근거·배정일 기준 집계·배정일/날짜 기준 잠금이 반영되었습니다. 실제 응답은 위 `feature/insight` 항목을 보세요.

**구현 완료(develop 머지).** 위 두 항목(할 일 단일일, 하루 회고)의 후속 설계였고, 세부는 `API_SPEC.md` v0.5(6~9장, 11장 "v0.4 호환 깨짐 요약")입니다.

- `GET /api/records/{date}/summary`: **`reflectionWritten`(boolean) 복원 — 구현 완료**(2026-11-24, 아래 "하루 회고 복원" 항목 참고)
- 주간 인사이트 `summary`: **`reflectionCount`가 복원**되고 근거(`evidence`) `type`에 **`REFLECTION`**이 다시 들어갑니다 (`MEMO`/`REFLECTION`/`QUESTION_ANSWER`/`TASK`)
- `weeklyAchievement`: 이월이 없으므로 **그 주(월~일)에 배정된 할 일**을 기준으로 `totalCount`/`completedCount`를 계산합니다 (요일별 `days[]`도 그날 배정분)
- **`POST /api/insights/weekly/{insightId}/reflect`(추천 행동 반영)는 보류입니다 → 변경됨: 반영 기능 자체를 하지 않습니다(맨 위 2026-11-24 "추천 행동은 홈 표시만")**: 분석 요청이 금~일이 되어(아래 2026-11-24 항목) 발행된 주가 잠기므로 "오늘 할 일로 추가"가 어렵습니다. 추천 행동을 따로 조회하는 화면이 생길 예정이며 반영 날짜·API는 그때 다시 공지합니다. (변경됨 → 2026-11-24 확정 항목)
- 질문 받기(`POST /api/records/{date}/questions`): 생성 조건이 **"그날 할 일이 1개 이상이거나 회고가 있음"**으로 바뀝니다. 둘 다 없으면 `422 RECORD_EMPTY`
- 잠금: 인사이트가 발행된 주의 **배정일 할 일과 회고**는 수정할 수 없습니다 (`409 RECORD_LOCKED`)

**프론트 조치**: 반영 응답 처리 변경, 근거 칩에 회고 종류 복원, 홈 회고 작성 문구 복원, 달성률 그래프는 그날 추가한 할 일 기준 값으로 그리기. 인사이트 API는 구현 PR이 머지되면 다시 공지합니다.

---

### 2026-11-24 / `feature/user-keywords` / ⚠️ 호환 깨짐 / 할 일은 "그날 추가한 일"만 노출 + 마감은 남은 일수(`dueInDays`)

- **이월이 없어졌습니다** ⚠️: `GET /api/tasks?date=D`는 **배정일(`date`)이 D인 할 일만** 돌려줍니다. 어제 못 끝낸 일이 오늘 목록으로 넘어오지 않고, 어제 날짜 목록에만 남습니다
  - `completed` / `incomplete`는 **같은 날 목록을 완료 여부(`completed`)로 나눈 것**입니다. 이전처럼 "완료한 날" 기준으로 완료 목록을 만들지 않습니다. 배정일 목록에서 완료해도 그 날짜의 `completed`에 계속 있습니다
  - 과거 날짜를 조회해도 **그날 시점으로 재구성하지 않습니다**: 그날 배정된 할 일의 **현재** 완료 여부가 그대로 내려갑니다
  - `completedDate`는 응답에 계속 있지만(완료 토글한 날) **목록 노출에는 쓰이지 않습니다**
- **`overdueDays` → `dueInDays`** ⚠️ (`GET /api/tasks` 목록 항목)
  - `dueInDays` = **마감 날짜 − 오늘(서버 기준)**. 양수=남음("D-3"), `0`=오늘 마감("D-Day"), 음수=지남("D+2"), 마감이 없거나 **완료한 할 일은 `null`**
  - **조회한 날짜가 아니라 항상 서버의 "오늘" 기준**입니다. 마감 시각은 표시용이고 날짜로만 셉니다
  - `overdueDays` 필드는 **없어졌습니다**. "D+n"은 `dueInDays`가 음수일 때 `-dueInDays`로 표기하세요
  - 마감은 **노출·이동에 아무 영향이 없습니다**(표시 전용)
- **배정일(`date`)이 필수**입니다 ⚠️
  - `POST /api/tasks`에서 `date`를 생략하거나 `null`로 보내면 **오늘**로 저장됩니다. 응답의 `date`는 항상 값이 있습니다
  - `PATCH /api/tasks/{id}`에서 `date`를 `null`로 보내면 이제 **`400 BAD_REQUEST`** 입니다(이전: 배정일 해제). `date`를 생략하면 유지, 날짜를 보내면 이동은 이전과 같습니다. `dueDate`는 이전처럼 `null`로 해제할 수 있습니다
  - 배정일 없는 할 일(매일 노출)은 **더 이상 없습니다**. 기존에 배정일이 없던 할 일은 만든 날짜로 바뀌었습니다(개발 데이터)
- **개수 제한**은 **배정일별 20개(완료 포함)** 하나뿐입니다. 이월·"배정일 없는 20개 별도" 개념이 없어졌습니다. 다른 날짜 목록이 가득 차 있어도 영향이 없습니다. 초과하면 `400 TASK_LIMIT_EXCEEDED`, 완료된 할 일도 날짜를 옮기면 옮긴 날 개수에 포함됩니다
- 기록의 메모 저장 범위도 같이 바뀝니다: 임시저장·완료의 `taskMemos`는 **그 날짜(배정일)의 할 일**만 대상입니다. 다른 날짜의 할 일 ID를 보내면 `404 TASK_NOT_FOUND`

**프론트 조치**: 홈·기록·아카이브에서 날짜별로 그날의 할 일만 보여주도록 이월 가정 제거, 마감 표시를 `dueInDays`(D-n / D-Day / D+n)로 교체하고 `overdueDays` 사용 제거, 할 일 추가에서 날짜를 비우면 오늘로 들어간다는 점 반영, 수정에서 배정일 해제(`date: null`) UI가 있었다면 제거.

---

### 2026-11-24 / `feature/user-keywords` / 신규 / 하루 회고 복원 (별도 저장, 인사이트 근거로 사용)

- 하루 회고가 **다시 생겼습니다**(2026-11-12에 삭제됐던 `reflection`). 하루 1건, **2,000자 이하**, 별도 테이블에 저장됩니다
- **저장**: `PUT /api/records/{date}/draft`, `POST /api/records/{date}/complete` 요청 본문에 **`reflection`**(string, 선택)이 다시 들어갑니다
  - 요청 예: `{ "manual": true, "taskMemos": [...], "answers": [...], "reflection": "오늘 배운 점…" }`
  - **전체 교체**입니다(D-20): `reflection`을 비우거나(`""`·공백) 생략하거나 `null`이면 **저장된 회고가 지워집니다**. 화면에 입력된 회고를 매번 함께 보내세요
  - 자동저장(`manual: false`)·수동 저장(`manual: true`)·상태(`NOT_STARTED`/`DRAFT`/`COMPLETED`)·`RECORD_LOCKED` 규칙은 **메모·답변과 완전히 같습니다**. 회고만 있어도 "저장할 내용이 있는 것"으로 보아 수동 저장 시 `DRAFT`가 되고 아카이브 `hasRecord`가 `true`가 됩니다
  - 2,000자 초과는 `400 BAD_REQUEST`(이때 저장은 하나도 되지 않음)
- **조회**: **`GET /api/records/{date}/reflection`** (신규, 인증 필요)
  - 응답 `data`: `{ "date": "2026-10-21", "reflection": "…" }`, 저장된 회고가 없으면 `reflection`이 `null`
  - 기록 화면을 다시 열 때 `GET /api/tasks`(메모) + `GET /api/records/{date}/questions`(답변)와 함께 호출해 복원하세요 (자동저장된 회고도 돌려줍니다)
- **`GET /api/records/{date}/summary`에 `reflectionWritten`(boolean)이 복원되었습니다**(구현됨). 그날 회고가 저장되어 있으면 `true`. 응답: `{ date, status, locked, memoCount, reflectionWritten, completedAt }`
- 인사이트의 근거 칩 종류 **`REFLECTION`**(하루 회고)이 추가되었습니다(구현됨). 근거 `type`: `MEMO` / `QUESTION_ANSWER` / `REFLECTION` / `TASK`. 화면에서 `REFLECTION` 칩을 누르면 해당 날짜 기록으로 이동하면 됩니다
- 탈퇴하면 회고도 함께 영구 삭제됩니다

**프론트 조치**: 기록 화면에 회고 입력 영역 복원, 임시저장·완료 요청에 `reflection` 포함, 진입 시 `GET /api/records/{date}/reflection`으로 복원, 인사이트 근거 칩에 `REFLECTION` 종류 추가 준비.

---

### 2026-11-12 / `feature/user-keywords` / ⚠️ 호환 깨짐 / 출생연도(`birthYear`) → 나이(`age`)

- 회원 프로필의 `birthYear` 필드가 **없어지고 `age`(number | null)로 바뀌었습니다** ⚠️
  - 요청: `POST /api/auth/register`, `PUT /api/users/me/profile`의 `birthYear` → `age` (예: `"age": 25`). 선택 항목(생략·`null` 허용)인 것은 같습니다
  - 응답: `GET /api/users/me`, `PUT /api/users/me/profile` 응답의 `birthYear` → `age`
  - 범위 **14~100**(임시), 벗어나면 `400 BAD_REQUEST`
  - 입력한 나이를 그대로 저장합니다(해가 바뀌어도 자동으로 늘지 않음). 나이를 따로 계산할 필요 없이 그대로 표시하면 됩니다
- 이전에 `birthYear`를 보내던 요청은 그 값이 무시됩니다(에러는 아님)
- 기존에 저장된 출생연도는 `2026 − 출생연도`로 바뀌었습니다(개발 데이터)

**프론트 조치**: 가입·프로필 입력 화면의 출생연도 입력을 나이 입력으로 바꾸고, 요청·응답 필드를 `age`로 교체.

---

### 2026-11-12 / `feature/user-keywords` / ⚠️ 호환 깨짐 / 할 일 마감일 → 마감 일시(날짜 + 시간)

> **변경됨(→ 2026-11-24 `feature/user-keywords`)**: 아래의 `overdueDays`(조회일 − 마감 날짜, 지난 일수만)는 **`dueInDays`(마감 날짜 − 오늘, 남은 일수·음수=지남)로 교체**되었습니다. 마감 일시 형식(`YYYY-MM-DDTHH:mm`)은 그대로입니다.

- 할 일의 `dueDate`가 **날짜에서 일시로** 바뀌었습니다 ⚠️ (필드 이름은 그대로)
  - **요청**(`POST /api/tasks`, `PATCH /api/tasks/{taskId}`): `"2026-10-23T18:00"` 형식, **시간 필수**. 초를 붙여 보내도(`"2026-10-23T18:00:45"`) 되지만 **분 단위로 버려** 저장합니다. 오프셋 없이 서울 시간
  - 날짜만 보내면(`"2026-10-23"`) **`400 BAD_REQUEST`** ⚠️. 생략·`null`이면 "마감 없음"(이전과 같음), PATCH에서 `null`은 해제(이전과 같음)
  - **응답**(`GET /api/tasks` 목록 항목, POST/PATCH 응답): `"2026-10-23T18:00:00"`(초까지, 오프셋 없음 — 기록 API 시각 형식과 같음). 마감이 없으면 `null`
- `overdueDays`(D+n)는 **이전과 같이 날짜 기준**입니다: `조회일 − 마감 날짜`. 마감 당일에는 시각이 지나도 지연이 아닙니다(시각은 표시용)
- 기존에 날짜만 저장된 마감은 그날 `23:59:00`으로 바뀌었습니다(개발 데이터)

**프론트 조치**: 마감 입력 UI에 시간 선택 추가, 요청에 `YYYY-MM-DDTHH:mm` 전송, 응답의 `dueDate`를 일시로 파싱·표시.

---

### 2026-11-12 / `feature/user-keywords` / 변경 / 직군·역량 키워드 확정 목록 적용 (+ 역량 정의 필드 추가)

- 직군·역량 선택지가 **기획 확정 목록**으로 바뀌었습니다: 직군 13개, 역량 77개(공통 9개 + 직군별). 이전 임시 코드(`DEVELOPMENT`, `DATA`, `COMMUNICATION`, `DSN_UX` 등)는 더 이상 없습니다 ⚠️
  - 코드는 항상 `GET /api/meta/profile-options`에서 받아 쓰고 하드코딩하지 마세요(표시명 `label`도 이 응답 값 사용)
  - 여러 직군에 같은 표시명(예: "분석력")이 있어 코드는 직군 접두어로 구분됩니다(예: `MKT_ANALYSIS`, `HR_ANALYSIS`)
- `GET /api/meta/profile-options`의 `competencies[]`에 **`description`(역량 정의 문장)** 필드가 추가되었습니다. 선택 화면에서 설명으로 쓸 수 있습니다 (필드 추가, 기존 필드 변경 없음)
- 선택 규칙은 그대로입니다: 공통 역량 1개 이상, 희망 직군을 고르면 그 직군 역량 2개 이상
- 예전 임시 코드로 저장된 직군은 비워지고 역량은 삭제됩니다(개발 데이터만 해당). 해당 회원은 `competencies`가 `[]`가 되어 프로필 입력 화면으로 안내하면 됩니다
- 성별 목록은 아직 임시(남성/여성/기타)입니다

**프론트 조치**: 직군·역량을 하드코딩했다면 선택지 API 값으로 교체, 필요하면 역량 설명(`description`) 표시.

---

### 2026-11-12 / `feature/record` / ⚠️ 호환 깨짐 / 기록·아카이브 구현 (기록 P-02, 아카이브 P-03, 홈 기록 카드)

> **변경됨(→ 2026-11-24 `feature/user-keywords`)**: 아래의 "`reflection` 없음"·"회고 입력 제거"는 **번복**되었습니다. 임시저장·완료 본문에 `reflection`이 다시 들어가고 `GET /api/records/{date}/reflection`이 신규 추가되었습니다. 또한 "이월된 할 일의 메모" 설명은 이월 폐지로 해당 없습니다(메모는 그 날짜의 할 일만 대상).

아래 "기획 변경 반영" 항목 2)·3)이 **구현되었습니다**(PR 머지 후 사용 가능). 전부 인증 필요. `{date}`는 `YYYY-MM-DD`, 시각은 `2026-10-21T18:05:00`(초 단위, 오프셋 없음, 서울 시간).

- **`GET /api/records/{date}`는 없습니다** ⚠️ (회고 삭제, 기록 API 분해). 기록 화면 = 상단 `GET /api/tasks?date=`(할 일+메모) + 하단 `GET /api/records/{date}/questions`(질문·답변)
- `GET /api/records/{date}/summary` — `{ date, status: "NOT_STARTED"|"DRAFT"|"COMPLETED", locked, memoCount, completedAt }`
  - `memoCount`: 그날 보이는 할 일 중 메모가 있는 개수. `locked`: 지금은 항상 `false`(인사이트 PR에서 발행된 주면 `true`, 그때 읽기 전용 화면으로)
- `GET /api/records/{date}/questions` — `{ date, questions: [{ id, order(1~3), text, answer, skipped }] }`. 질문이 없으면 `[]`. **질문 생성(질문 받기·퇴근 10분 전 자동 생성)은 아직 없습니다**(AI 연동 PR). 생성되면 기록 화면에서 이 API를 주기적으로 조회(폴링)해 주세요
- `PUT /api/records/{date}/draft` — 임시저장(버튼) / 자동저장
  - 요청: `{ "manual": true|false, "taskMemos": [{ "taskId", "memo" }], "answers": [{ "questionId", "answer", "skipped" }] }` (`manual` 필수, ⚠️ `reflection` 없음)
  - 응답: `{ date, status, savedAt }`
  - **현재 화면의 입력 전체를 보내 주세요(전체 교체)**:
    - 메모: 그날 보이는 할 일 중 `taskMemos`에 없는 할 일의 메모는 **삭제**됩니다. 그날 보이지 않는 할 일(예: 다른 날 완료한 할 일)의 메모는 그대로입니다. 빈 문자열은 "메모 없음"
    - 답변: 그날 질문 중 `answers`에 없는 질문은 **답 없음·건너뜀 아님으로 초기화**됩니다
  - 상태: `manual: true` → `DRAFT`(완료된 날은 `COMPLETED` 유지). `manual: false`(자동저장)는 내용만 저장하고 상태를 바꾸지 않습니다 → 자동저장만 한 날은 `NOT_STARTED`. 저장된 적 없는 날에 내용이 전부 비어 있으면 기록을 만들지 않습니다
  - 메모는 할 일에 붙어 있어서, 이월된 할 일의 메모는 어느 날 화면에서 고쳐도 같은 메모가 바뀝니다
  - 요청은 겹치지 않게 순서대로 보내 주세요(버전 필드 없음)
- `POST /api/records/{date}/complete` — 퇴근. 요청 본문은 임시저장과 같고 `manual`만 없음(`{}`도 가능, 빈 기록도 완료됨)
  - 응답: `{ date, status: "COMPLETED", completedAt, level }` — `level`은 갱신된 성장 레벨(퇴근 완료한 날 수 기준, 구간은 임시). 이미 완료된 날을 다시 완료하면 저장만 하고 `completedAt`·레벨은 그대로
- `GET /api/archive/calendar?year=2026&month=10` ⚠️ — `{ year, month, days: [{ date, hasRecord }] }`, **그 달의 모든 날짜**. `hasRecord`는 임시저장 버튼을 누른 날 또는 퇴근 완료한 날(자동저장만 한 날은 `false`). 상태별 구분이 필요하면 `summary`를 사용
- **에러**: `400 BAD_REQUEST`(날짜 형식, 메모 500자·답변 1,000자 초과, `manual` 누락, 같은 `taskId`/`questionId` 중복, `month` 범위 밖·누락), `404 TASK_NOT_FOUND`(그날 보이지 않거나 다른 사람의 할 일), `404 QUESTION_NOT_FOUND`(그날 기록에 없는 질문), `401`. `409 RECORD_LOCKED`는 인사이트 PR 이후

**프론트 조치**: 기록 화면을 할 일 목록 + 질문 조회로 나눠 불러오기, 회고 입력 제거, 저장할 때 화면의 메모·답변을 항상 전부 보내기, 퇴근 응답의 `level`로 레벨 이미지 갱신, 아카이브 달력을 `hasRecord`로 표시.

---

### 2026-11-12 / `feature/user-profile` / ⚠️ 호환 깨짐 / 회원 프로필 구현 (가입, 회원수정 페이지 1, 환경 설정)

아래 "기획 변경 반영" 항목 4)가 **구현되었습니다**(PR 머지 후 사용 가능).

- **`PATCH /api/users/me/nickname` 삭제** ⚠️ → 닉네임은 아래 `PUT /api/users/me/profile`로 수정합니다
- `GET /api/users/me` (인증) — 응답에 필드 추가:
  `{ nickname, email, workEndTime, gender, birthYear, currentJobGroup, targetJobGroup, competencies: ["COMMUNICATION", ...], level }`
  - 값이 없는 선택 항목은 `null`, `competencies`는 비어 있으면 `[]` → **`[]`이면 가입 직후 프로필 입력(직군·역량) 전**으로 판단해 주세요
  - `level`: 성장 레벨 1~9 (가입 직후 1). 지금은 항상 1이고, 기록 완료 기능(record PR)이 들어가면 오릅니다. 이미지는 프론트가 레벨 숫자로 매핑
  - `competencies` 순서: 선택지 API의 순서(공통 → 직군별)
- `PUT /api/users/me/profile` (인증, 신규) — 회원수정 페이지 1과 가입 직후 프로필 입력에서 같이 사용. **전체 교체**: 안 보낸 선택 항목은 해제됩니다
  - 요청: `{ "nickname": "2~10자", "gender": "FEMALE"|null, "birthYear": 2001|null, "currentJobGroup": "DEVELOPMENT"|null, "targetJobGroup": "DESIGN"|null, "competencies": ["COMMUNICATION", "DSN_UX", "DSN_PROTOTYPING"] }`
  - 응답: `GET /api/users/me`와 같은 형식(수정 후 전체)
  - 역량 규칙: 공통 역량 1개 이상 필수 / 희망 직군을 고르면 **그 직군 역량** 2개 이상 필수 / 희망 직군이 없으면 직군 역량 선택 불가 / 중복 불가. 위반 시 `400 INVALID_COMPETENCY_SELECTION`(실패 시 아무것도 저장되지 않음). 최대 개수 제한은 아직 없음(기획 확정 대기)
  - `400 BAD_REQUEST`: 닉네임 길이, 출생연도 범위(1950~올해, 임시), 없는 코드 값(성별·직군·역량)
  - 희망 직군을 바꾸면 역량도 새 직군 기준으로 함께 보내야 합니다
- `GET /api/meta/profile-options` (인증, 신규) — 선택지
  `{ genders: [{code, label}], jobGroups: [{code, label}], competencies: [{code, label, type: "COMMON"|"JOB", jobGroup: null|"DESIGN"…}], selectionRules: { commonMin: 1, jobMin: 2 } }`
  - **키워드·표시 문구는 임시**입니다. 화면에 하드코딩하지 말고 이 API 값을 써 주세요
- `POST /api/auth/register` — 선택 필드 `gender`, `birthYear` 추가. 안 보내면 기존과 동일하게 동작(토큰·쿠키 흐름 변경 없음). 없는 성별 값이나 범위 밖 출생연도는 `400`
- 변경 없음: `PUT /api/users/me/work-end-time`(회원수정 페이지 2), `POST /api/users/me/withdrawal`(이메일 입력 후 탈퇴, 역량도 함께 삭제)

**프론트 조치**: 닉네임 수정 화면을 `PUT /users/me/profile`로 교체, 가입 화면에 성별·출생연도(선택), 가입 직후 직군·역량 입력 화면(선택지 API 사용), `competencies`가 `[]`면 프로필 입력 화면으로 안내.

---

### 2026-11-12 / `feature/task` / ⚠️ 호환 깨짐 / 할 일 새 모델 구현 (홈 체크리스트 P-01, 기록 화면 상단 P-02, 아카이브 날짜 상세)

> **변경됨(→ 2026-11-24 `feature/user-keywords`)**: 아래의 `overdueDays`, 이월(배정일 ≤ 조회일 노출), 완료 목록의 완료일 기준, 과거 날짜 재구성, 배정일 없는(null) 할 일, "배정일 없는 20개 별도" 제한, `date: null`로 배정일 해제는 **모두 폐지/변경**되었습니다. 자세한 이전·이후 값은 위 2026-11-24 "그날 추가한 일만 노출" 항목을 보세요.

아래 "기획 변경 반영" 항목 1)의 할 일 부분이 **구현되었습니다**(PR 머지 후 사용 가능). 전부 인증 필요(`Authorization: Bearer {accessToken}`). 날짜는 `YYYY-MM-DD`.

**할 일 필드**: `id`, `title`(1~20자), `date`(배정일, null 가능), `dueDate`(마감일, null 가능), `completed`, `completedDate`(완료한 날, 서버가 기록), `memo`(null 가능, 아직 저장 API 없음 — record PR의 임시저장/완료로 저장 예정)

- `GET /api/tasks?date=2026-10-21` — `date` 생략 시 오늘
  - 응답: `{ date, completedCount, totalCount, completed: [...], incomplete: [...] }` — 각 항목은 위 필드 + **`overdueDays`**
  - `completed`: 그날 **완료한** 할 일만. `incomplete`: 그날 아직 안 끝난 할 일 중 배정일 ≤ 그날(이월 포함), 또는 배정일이 없고 그날 이전에 만든 것. 배정일이 미래인 할 일은 안 보입니다
  - `overdueDays`: 마감일이 지났는데 안 끝났으면 지난 일수(예: 4 → "D+4"), 아니면 `null`. 마감 전 "D-n"이 필요하면 `dueDate`로 계산해 주세요
  - **과거 날짜는 그날 기준으로 보여줍니다**: 10/20에 배정하고 10/21에 완료한 할 일은 10/20 조회 시 `incomplete`에 `completed:false`, `completedDate:null`로, 10/21 조회 시 `completed`에 나옵니다
  - 정렬: 각 목록 안에서 만든 순서. 빈 목록은 `[]`
- `POST /api/tasks` — `{ "title": "…", "date": "2026-10-21", "dueDate": "2026-10-23" }` (`date`·`dueDate`는 생략/`null` = 없음) → `201`, 할 일 1개(`overdueDays` 없음)
  - 마감일이 배정일보다 앞서도 서버는 거절하지 않습니다(필요하면 화면에서 막아 주세요)
- `PATCH /api/tasks/{taskId}` — 바꿀 필드만: `title`, `completed`, `date`, `dueDate`
  - **필드를 안 보내면 그대로, `date`/`dueDate`에 `null`을 보내면 해제**됩니다 (`{"dueDate": null}` ≠ `{}`)
  - `completed:true` → `completedDate`가 오늘. 이미 완료된 걸 다시 `true`로 보내도 완료일은 그대로. `completed:false` → `completedDate: null`
  - 메모는 이 API로 바꾸지 않습니다
- `DELETE /api/tasks/{taskId}` → `200`, `data: null` (메모도 같이 삭제)

**⚠️ 개수 제한 (변경)**: **그날 화면에 보이는 할 일(완료+미완료)이 20개면 그날에 새 할 일을 추가할 수 없습니다** → `400 TASK_LIMIT_EXCEEDED`.
- 배정일을 넣으면 그 날짜 기준, 배정일이 없으면 오늘 기준으로 셉니다
- 완료해도 그날 목록에 남으므로 개수에서 빠지지 않습니다
- 이월된 미완료도 셉니다. 예) 10/22에 미완료 20개가 있으면, 10/25에도 이월되어 20개가 보이므로 10/25에도 추가할 수 없습니다
- 배정일을 다른 날로 옮기는 `PATCH`에도 같은 제한이 적용됩니다
- (이전 공지의 "배정일별 20 + 배정일 없는 미완료 20"은 이 규칙으로 바뀌었습니다)

**에러**: `400 BAD_REQUEST`(제목 공백·21자 이상, 날짜 형식 오류), `400 TASK_LIMIT_EXCEEDED`, `404 TASK_NOT_FOUND`(없는 할 일·다른 사람의 할 일), `401`(토큰 없음/만료). `409 RECORD_LOCKED`는 인사이트 PR 이후 적용됩니다.

**프론트 조치**: 체크리스트를 `completed`/`incomplete` 두 목록으로 그리고 "2/5"는 `completedCount`/`totalCount`로 표시, 지연 표시는 `overdueDays`, 할 일 추가·수정 화면에 배정일·마감일 입력(선택), PATCH에서 해제할 때는 `null`을 명시적으로 보내기.

---

### 2026-11-12 / 구현됨(각 도메인 PR, develop 머지) / ⚠️ 호환 깨짐 / 기획 변경 반영: 할 일·기록·아카이브·회원 프로필·인사이트

**구현 완료(develop 머지).** 설계 당시 설명이며, 이후 번복·변경된 부분은 아래 `변경됨` 표시와 더 위의 항목을 따르세요. 실제 요청·응답은 `API_SPEC.md` v0.5(5~9장)입니다. 아래 `변경됨` 표시가 붙은 이전 항목은 이 항목으로 대체됩니다.

> **변경됨(→ 2026-11-24 설계 항목, 맨 위)**: 이 항목의 ① 할 일 이월·배정일 null·`overdueDays`, ② `reflection` 삭제·`reflectionWritten`/`reflectionCount`/`REFLECTION` 삭제, ③ 인사이트 반영의 "배정일·마감일 null" 응답은 모두 번복되었습니다. 최신 규칙은 `API_SPEC.md` v0.4를 보세요.

**1) 할 일 (`/api/tasks`) — ⚠️ 호환 깨짐** (D-102~D-106)
- 할 일에 **배정일 `date`(null 가능)**, **마감일 `dueDate`(null 가능)**, `completed`, `completedDate`, 메모 `memo`가 생깁니다.
- `GET /api/tasks?date=D`(생략하면 오늘) 응답이 `items` 하나에서 **`{ date, completedCount, totalCount, completed[], incomplete[] }`**로 바뀝니다. 개수는 별도 필드로 줍니다("2/5" 표기는 프론트).
  - `completed`: 그 날 **완료한** 할 일만(완료일 기준). `incomplete`: 배정일이 D 이전이거나 배정일이 없는 미완료. 배정일이 지난 미완료도 계속 보이고 **`overdueDays`**(프론트가 "D+n" 표기)를 줍니다.
- ~~개수 제한: 배정일별 20개(완료 포함) + 배정일 없는 미완료 20개~~ **변경됨(→ 2026-11-12 `feature/task`)**: 그날 보이는 할 일(완료+미완료)이 20개면 추가 불가. 맨 위 항목 참고. 초과 시 `400 TASK_LIMIT_EXCEEDED`.
- 메모는 `PATCH`로 저장하지 않고 임시저장/완료의 `taskMemos`로 저장합니다. 메모는 **할 일당 1개**.

**2) 기록 (`/api/records`) — ⚠️ 호환 깨짐** (D-107~D-109)
- **`GET /api/records/{date}`가 사라집니다.** 대신 `GET /api/tasks`(할 일+메모), `GET /api/records/{date}/questions`(하루 질문·답변), `GET /api/records/{date}/summary`(`status`, `locked`, `memoCount`, `completedAt`).
- **하루 회고가 삭제**되어 `reflection` 필드가 draft/complete 요청과 응답에서 모두 빠집니다. (위 자동저장 항목의 예시 JSON에서도 `reflection` 제거)
- `complete` 응답에 성장 **`level`**이 포함될 예정입니다.
- 질문 받기: 그 날 노출되는 할 일이 1개 이상이면 메모가 없어도 생성. 없으면 `422 RECORD_EMPTY`.

**3) 아카이브 달력 — ⚠️ 호환 깨짐** (D-110): 월의 모든 날짜가 `hasRecord`(true/false)로 내려갑니다. 상태 구분은 없습니다.

**4) 회원 프로필 — ⚠️ 호환 깨짐** (D-96~D-101, D-117)
- `GET /api/users/me`에 `gender`, `birthYear`, `currentJobGroup`, `targetJobGroup`, `competencies`, `level`이 추가됩니다. 기존 필드는 그대로.
- **`PATCH /api/users/me/nickname`이 삭제**되고 **`PUT /api/users/me/profile`(전체 교체)**로 통합됩니다. `PUT /api/users/me/work-end-time`은 그대로.
- 직군·역량·성별 선택지는 **`GET /api/meta/profile-options`**로 받습니다. 키워드 값은 **임시**이며 기획 확정 후 바뀔 수 있으니 하드코딩하지 마세요.
- 필수 규칙: 공통 역량 1개 이상, 희망 직군을 고르면 그 직군 역량 2개 이상(안 고르면 직무 역량 선택 불가). 위반 시 `400 INVALID_COMPETENCY_SELECTION`.
- **가입(`register`) 요청에 선택 필드 `gender`, `birthYear`가 추가**됩니다(안 보내도 동작, 인증 흐름·토큰·쿠키는 그대로). 나머지 프로필은 가입 직후 `PUT /users/me/profile`로.
- 소셜 로그인은 **구글만**(카카오 제외).

**5) 인사이트 — ⚠️ 호환 깨짐 일부** (D-111~D-114)
- 리포트에 `title`, `subtitle`, `weeklyAchievement`(월~일 7일 일별 달성), `weeklyFlow`(그 달 1주차~현재 주)가 추가됩니다.
- **행동 반영(`reflect`)**: 만들어지는 할 일은 배정일·마감일이 없는 할 일(항상 보임)이며, 응답이 `{ createdTasks }`로 바뀌고 `targetDate`가 사라집니다. 토스트 문구는 기획 변경이 필요합니다.
- 인사이트 목록 `GET /api/insights/weekly/list`는 구현되었습니다(위 `feature/insight` 항목 참고).

**프론트 조치**
- 위 변경에 맞춰 화면(홈 체크리스트 분리·"2/5"·D+n, 기록 화면 상/하단 분리, 회고 영역 제거, 회원수정 1·2, 가입 시 성별·출생연도, 인사이트 그래프·흐름)을 준비해 주세요.
- 키워드·레벨 구간 등 `[임시]` 값은 서버가 내려주는 값만 사용해 주세요.

---

### 2026-11-08 / 구현됨(record 도메인 PR, develop 머지) / 신규 / 기록 자동저장 (D-95)

> **변경됨(→ 2026-11-12 기획 변경)**: `reflection` 필드가 삭제되고(D-107), `GET /api/records/{date}`는 폐지되어 아래 설명의 "GET /api/records/{date}는 자동저장된 내용도 돌려줍니다"는 `GET /api/tasks`(메모)와 `GET /api/records/{date}/questions`(답변)로 대체됩니다. `manual` 규칙(D-95)은 그대로입니다.

**이 엔드포인트(`PUT /api/records/{date}/draft`)는 구현되어 있습니다.** 아래는 설계 당시 설명이며, 현재 요청 본문은 `API_SPEC.md` v0.5 6.3을 기준으로 하세요(`manual` 규칙 D-95는 그대로).

- `PUT /api/records/{date}/draft` 요청에 **`manual`(boolean) 필드가 추가됩니다.**
  ```json
  { "manual": true, "taskMemos": [...], "reflection": "...", "answers": [...] }
  ```
  - `manual: true` — **"임시저장" 버튼을 눌렀을 때**만 보냅니다. 이때만 그 날이 아카이브/홈 칩에 "기록한 날"(`DRAFT`)로 표시됩니다. 토스트는 기존 그대로 "임시저장되었습니다."
  - `manual: false` — **자동저장**(내용이 바뀌었을 때만, 1~5분 주기 + 페이지 이탈 시 1회)에 보냅니다. 내용은 저장되지만 **그 날의 상태(`DRAFT`)는 바뀌지 않습니다** — 한 글자만 써도 "기록한 날"이 되는 걸 막기 위함입니다. 자동저장 토스트/인디케이터 문구는 프론트가 정해도 됩니다(조용한 문구 권장, 매번 뜨는 "임시저장되었습니다"는 자동저장에는 쓰지 않음)
  - **한 번 `manual: true`로 `DRAFT`가 되면, 이후 자동저장(`manual: false`)이 그 상태를 다시 `NOT_STARTED`로 되돌리지 않습니다.**
  - **`GET /api/records/{date}`는 자동저장된 내용도 그대로 돌려줍니다** — 상태가 `NOT_STARTED`로 보여도 `reflection`/`tasks[].memo`/`answers`에 마지막으로 자동저장된 내용이 들어있을 수 있습니다. 페이지를 다시 열었을 때 이 내용으로 복원하면 됩니다.
  - 전체 내용이 비어 있고 **아직 한 번도 저장된 적이 없는 날**이면 `manual` 값과 무관하게 저장되지 않습니다(행 자체가 생기지 않음). 이미 저장된 내용이 있는 날에 전부 지우고 저장하면(수동/자동 모두) 비어있는 내용으로 덮어써집니다(상태는 내려가지 않음)
  - 발행된 주(인사이트 `PUBLISHED`)는 `manual` 값과 무관하게 `409 RECORD_LOCKED`입니다 — **자동저장이 409를 받으면 그 날에 대해 더 이상 자동저장을 보내지 마세요**(계속 보내도 서버는 계속 거절하지만 불필요한 요청입니다)
  - "질문 받기" 버튼을 눌렀을 때 서버가 내부적으로 하는 사전 저장은 `manual: false`로 처리됩니다(즉, "질문 받기"만 눌러서는 그 날이 `DRAFT`가 되지 않습니다 — `임시저장` 버튼을 눌러야 `DRAFT`가 됩니다)
  - 자동저장 요청이 네트워크에서 순서가 뒤바뀌는 문제는 **프론트가 요청을 겹치지 않게 순차적으로 보내는 방식으로 책임집니다**(백엔드에 버전 필드를 두지 않기로 함) — 즉, 이전 자동저장 요청의 응답을 받기 전에 다음 자동저장을 보내지 말아주세요

**프론트 조치**
- 자동저장 타이머/디바운스, 페이지 이탈 시 저장, 요청 순차 전송(겹치지 않게)은 프론트에서 구현
- "질문 받기"를 누르면 서버가 알아서 사전 저장하므로, 프론트가 "질문 받기" 전에 별도로 `manual: false` 저장을 먼저 보낼 필요는 없음(다만 보내도 문제는 없음)
- 실제 엔드포인트가 열리면(record 도메인 PR) 다시 공지하겠습니다

---

### 2026-11-08 / `feature/task` / 신규 / 할 일 목록·추가·수정·삭제 (홈 체크리스트, P-01 / 기록 화면 완료 체크, P-02와 공유)

> **변경됨(→ 2026-11-12 / `feature/task` 재구현)**: 이 버전은 머지되지 않고 새 모델로 대체되었습니다. 맨 위의 "2026-11-12 / `feature/task` / 할 일 새 모델 구현" 항목을 보세요.

전부 **인증 필요**(`Authorization: Bearer {accessToken}`) 엔드포인트입니다. 홈 체크리스트와 기록 화면의 완료 체크는 같은 데이터입니다(HM-04 = RC-03).

- `GET /api/tasks?date=2026-10-21`
  - 응답: `{ "date": "2026-10-21", "items": [{ "id": 101, "title": "주간 보고서 작성", "completed": true }] }`
  - 정렬은 생성 순서. 빈 목록이면 `items: []`
- `POST /api/tasks`
  - 요청: `{ "date": "2026-10-21", "title": "고객 문의 정리" }` → 응답 **201**: `{ "id": 103, "date": "2026-10-21", "title": "고객 문의 정리", "completed": false }`
  - `title`은 서버가 앞뒤 공백을 제거하고 1~20자인지 검사합니다. 비어있으면(공백만 입력해도) `400 BAD_REQUEST`
  - 하루에 20개를 넘으면 `400 TASK_LIMIT_EXCEEDED`
  - 날짜 제한 없음(과거·미래·주말 모두 추가 가능)
- `PATCH /api/tasks/{taskId}` — 변경할 필드만 보내면 됩니다
  - 완료 토글: `{ "completed": true }` / 제목 수정: `{ "title": "새 제목" }`
  - 응답은 변경된 할 일 전체(`POST` 응답과 같은 형식)
  - 존재하지 않거나 **다른 사용자의 할 일**이면 `404 TASK_NOT_FOUND`(소유자가 아니면 403이 아니라 404로 응답합니다 — 존재 여부를 알려주지 않기 위함)
- `DELETE /api/tasks/{taskId}`
  - 응답: `data: null`. 존재하지 않으면 `404 TASK_NOT_FOUND`

**⚠️ 아직 적용 안 된 부분**: 주의 인사이트가 발행되면 그 주 전체의 할 일이 잠겨야 하는데(`409 RECORD_LOCKED`), insight 도메인이 아직 없어서 이번 PR에는 이 잠금이 **적용되어 있지 않습니다**. insight 도메인이 나오기 전까지는 할 일이 항상 수정 가능한 상태입니다 — 나중에 이 동작이 추가되면 다시 공지하겠습니다.

**프론트 조치**
- 홈(P-01)과 기록 화면(P-02)의 완료 체크박스는 같은 `PATCH /api/tasks/{taskId}` 호출로 처리하면 됩니다
- 할 일 추가 입력창에서 Enter로 확정하는 동작, 빈 값이면 행 자동 삭제하는 동작은 프론트 쪽에서 처리(서버는 빈 제목을 거절만 함)

---

### 2026-11-08 / `feature/user` / 신규 / 내 정보 조회·닉네임 수정·퇴근 시간 설정·탈퇴 (환경 설정 화면, P-05)

> **변경됨(→ 2026-11-12 기획 변경)**: `GET /users/me` 필드 확장, `PATCH /users/me/nickname` 삭제 → `PUT /users/me/profile`. 탈퇴 화면(이메일 입력)은 확정됨(D-117). 아래는 **현재 구현된 이전 버전** 기준입니다.

전부 **인증 필요**(`Authorization: Bearer {accessToken}`) 엔드포인트입니다.

- `GET /api/users/me`
  - 응답: `{ "nickname": "틸리", "email": "user@example.com", "workEndTime": "18:00" }` (`workEndTime`은 미설정이면 `null`)
- `PATCH /api/users/me/nickname`
  - 요청: `{ "nickname": "새닉네임" }` (2~10자) → 응답: `{ "nickname": "새닉네임" }`
  - 에러: 형식 오류 400
- `PUT /api/users/me/work-end-time`
  - 요청: `{ "workEndTime": "18:00" }`, 해제하려면 `{ "workEndTime": null }` → 응답: `{ "workEndTime": "18:00" }` 또는 `{ "workEndTime": null }`
  - `HH:mm` 외 형식(예: `"25:00"`, `"1800"`)은 400
- `POST /api/users/me/withdrawal`
  - 요청: `{ "confirmEmail": "user@example.com" }` (가입 시 이메일과 정확히 일치해야 함) → 성공 시 `data: null`
  - 이메일이 다르면 `400 EMAIL_MISMATCH`
  - 성공하면 **그 즉시** 데이터가 영구 삭제되고 Refresh 쿠키도 삭제되며 지금 쓰던 Access 토큰도 즉시 무효화됩니다 — 확인 모달에서 한 번 더 확인 후 호출하도록 구현해 주세요. 구글 계정 쪽 앱 연결은 해제되지 않으니(이번 결정) 안내 문구에 참고
  - **⚠️ 화면이 아직 와이어프레임에 없음** — 기획 쪽 확정 전까지는 API만 준비된 상태입니다

**프론트 조치**
- 환경 설정(P-05) 화면에서 위 4개를 붙이면 됩니다. 닉네임/퇴근 시간은 저장 시 각각의 PATCH/PUT 호출, 탈퇴는 확인 모달 확정 시에만 호출

---

### 2026-11-08 / `feature/auth-core` + `feature/auth-google` / 신규 / 인증 전체 흐름(로그인·가입·재발급·로그아웃)

로그인부터 재발급까지 인증 관련 API가 전부 추가됐습니다. 아래는 지금까지 합쳐서 한 번에 정리한 내용입니다.

**엔드포인트**
- `POST /api/auth/login/google` — 구글 인가 코드로 로그인/가입 판별. 인증 불필요(permitAll)
  - 요청: `{ "code": "구글이 돌려준 인가 코드" }`
  - 응답(`ApiResponse.data`): `{ "status": "LOGGED_IN" | "SIGNUP_REQUIRED", "accessToken": "...", "userId": 1, "signupToken": "...", "email": "..." }`
    - `LOGGED_IN`(기존 회원): `accessToken`/`userId`만 채워짐, `signupToken`/`email`은 `null`
    - `SIGNUP_REQUIRED`(미가입): `signupToken`/`email`만 채워짐, `accessToken`/`userId`는 `null` → 프론트는 닉네임 입력 화면으로 보내고 `signupToken`을 보관
    - `LOGGED_IN`일 때만 Refresh 토큰 쿠키가 내려옵니다(아래 쿠키 항목 참고)
  - 실패: `GOOGLE_AUTH_FAILED`(502) — 구글 인증 실패 또는 구글 계정에 이메일이 없는 경우. 요청 본문에 `code`가 없으면 400
- `POST /api/auth/register` — 가입 토큰 + 닉네임으로 가입 완료. 인증 불필요(permitAll)
  - 요청: `{ "signupToken": "...", "nickname": "2~10자" }`
  - 응답: `{ "accessToken": "...", "userId": 1 }` + Refresh 쿠키
  - 실패: `SIGNUP_TOKEN_REQUIRED`/`INVALID_SIGNUP_TOKEN`/`EXPIRED_SIGNUP_TOKEN`(401), 닉네임 형식 오류는 400
  - 가입 토큰 유효시간 **30분** — 로그인(`SIGNUP_REQUIRED`) 후 오래 방치하면 만료되어 `/register`가 401로 실패하니, 프론트에서 만료 시 재로그인 유도 필요
- `POST /api/auth/reissue` — Access 토큰 재발급. 인증 불필요하지만 **쿠키 + 커스텀 헤더 둘 다 필요**
  - Refresh 토큰은 쿠키로 자동 전송(아래 참고), 요청에 **`X-Tilly-Client: web`** 헤더 필수 — 없으면 400(단순 cross-site form/img로는 못 흉내내게 하는 CSRF 방어 장치)
  - 응답: `{ "accessToken": "..." }` + Refresh 쿠키 재설정(회전)
  - 이미 사용된(회전된) Refresh로 다시 호출하면 `INVALID_REFRESH_TOKEN`(401) — 탈취 의심 시나리오로 취급되어 재로그인 필요
- `POST /api/auth/logout` — 인증 필요(Access 토큰 Authorization 헤더). Refresh 쿠키 삭제 + 해당 Access 토큰 즉시 무효화
- `POST /api/auth/dev-login` — **`local` 프로파일(로컬 개발 서버)에서만 존재**. 배포 환경에는 이 경로 자체가 없음(404). 구글 없이 고정 테스트 유저로 토큰을 받는 용도라 실제 서비스 화면에서는 호출하지 마세요

**토큰 전달 방식 (D-89)**
- Access 토큰: 매번 응답 바디로 내려줌 → 프론트가 보관하고 각 요청 `Authorization: Bearer {accessToken}` 헤더로 전송. 유효기간 30분
- Refresh 토큰: **HttpOnly 쿠키**(`refreshToken`, `Path=/api/auth`)로만 전달 — JS에서 값 직접 읽기 불가. 유효기간 14일
  - 쿠키를 보내려면 프론트의 모든 `/api/auth/*` 요청(fetch/axios)에 **`credentials: 'include'`**(또는 `withCredentials: true`) 설정 필요
  - 로컬(`local` 프로파일) 서버는 `Secure=false; SameSite=Lax`로 완화되어 있어 http로도 테스트 가능하지만, 배포 서버는 `Secure=true; SameSite=None`이라 **반드시 https** 환경에서만 쿠키가 전달됨

**⚠️ 아직 확정 안 된 부분**
- **CORS 허용 도메인이 아직 설정되지 않았습니다(NOTICE-018 대기).** 프론트 배포 도메인(및 로컬 개발 포트)을 알려주셔야 실제로 cross-origin 요청이 통과합니다 — 그 전까지는 같은 origin이 아니면 브라우저에서 차단됩니다
- 구글 OAuth `redirect_uri`(프론트가 구글 로그인 후 리다이렉트되는 주소)도 프론트 주소가 확정되어야 백엔드 `.env`/구글 콘솔에 맞춰 등록됩니다

**프론트 조치**
- 구글 로그인 버튼 클릭 → 구글 인증 화면 → 리다이렉트로 받은 `code`를 `POST /api/auth/login/google`로 전달
- 로그인 응답의 `status`로 분기(`LOGGED_IN` → 바로 서비스 진입, `SIGNUP_REQUIRED` → 닉네임 입력 후 `signupToken`과 함께 `/register`)
- 이후 모든 `/api/auth/*` 호출에 `credentials: 'include'` 설정
- Access 토큰 만료 시(401) `POST /api/auth/reissue`를 `X-Tilly-Client: web` 헤더와 함께 호출해 재발급
- 실제 배포 도메인 확정되면 백엔드 쪽에 CORS/redirect_uri 등록 요청해 주세요 (NOTICE-018)
