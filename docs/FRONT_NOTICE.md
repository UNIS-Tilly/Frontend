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

### 2026-11-12 / (설계 확정, 구현 전 — 각 도메인 PR에서 순서대로 적용) / ⚠️ 호환 깨짐 / 기획 변경 반영: 할 일·기록·아카이브·회원 프로필·인사이트

**⚠️ 아직 구현되지 않았습니다.** 기획 변경에 따라 설계가 바뀌어서 먼저 공유합니다. 자세한 요청·응답은 `API_SPEC.md` v0.3(5~9장)을 보세요. 구현 PR이 머지될 때마다 이 문서에 다시 공지합니다. 아래 `변경됨` 표시가 붙은 이전 항목은 이 항목으로 대체됩니다.

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
- 인사이트 목록 `GET /api/insights/weekly/list`는 세부가 **미확정**이라 아직 구현하지 않습니다.

**프론트 조치**
- 위 변경에 맞춰 화면(홈 체크리스트 분리·"2/5"·D+n, 기록 화면 상/하단 분리, 회고 영역 제거, 회원수정 1·2, 가입 시 성별·출생연도, 인사이트 그래프·흐름)을 준비해 주세요.
- 키워드·레벨 구간 등 `[임시]` 값은 서버가 내려주는 값만 사용해 주세요.

---

### 2026-11-08 / (아직 구현 전 — 설계만 확정, record 도메인 PR에서 실제로 추가될 예정) / 신규 / 기록 자동저장 (D-95)

> **변경됨(→ 2026-11-12 기획 변경)**: `reflection` 필드가 삭제되고(D-107), `GET /api/records/{date}`는 폐지되어 아래 설명의 "GET /api/records/{date}는 자동저장된 내용도 돌려줍니다"는 `GET /api/tasks`(메모)와 `GET /api/records/{date}/questions`(답변)로 대체됩니다. `manual` 규칙(D-95)은 그대로입니다.

**⚠️ 이 엔드포인트는 아직 존재하지 않습니다.** record 도메인을 구현할 때 아래 설계대로 만들 예정이라, 프론트에서 자동저장을 미리 설계할 때 참고하시라고 먼저 공유합니다.

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
