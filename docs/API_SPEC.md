# TILLY API 명세서 (v0.5)

> 기준 문서: `TILLY_기능명세서.xlsx` v0.1 (2026.11.03) + 확인필요 시트 답변 + 2026.11.07~08 사용자 확정 사항 (`DECISIONS.md` D-01~D-95) + **2026.11.12 기획 변경 반영 (`DECISIONS.md` D-96~D-117)** + **2026.11.24 기획 변경 반영 (D-119~D-130: 할 일 이월 없음·마감 D-day 표시, 하루 회고 복원)**
> 스택: Spring Boot 4.x + Java 21 / Gradle(Groovy) / MySQL + Flyway / Redis
> 작성 원칙: **명세서에 없는 기능은 추가하지 않는다. 근거가 없는 값은 임의로 채우지 않고 `[미확정]`으로 남긴다.**
> 변경 이력: v0.1 초안 → v0.2 (2026.11.08, 사용자 확정 사항 일괄 반영. Base path `/api/v1` → `/api`) → **v0.3 (2026.11.12, 기획 변경 반영: 회원 프로필 확장, 할 일 마감일·배정일 모델, 회고 삭제, 기록 API 분해, 아카이브 달력 단순화, 인사이트 확장, AI 제공자 변경, 인증 구현 내용 반영)** → **v0.4 (2026.11.24, 할 일 모델 단순화(그날 추가한 일만 노출, 마감은 D-day 표시용), 하루 회고 복원(별도 테이블 `daily_reflections`)과 회고 기반 AI 인사이트)**
> v0.3에서 ⚠️ 호환이 깨지는 변경: `POST /tasks`·`GET /tasks`·`PATCH /tasks/{id}` 형식, `GET /records/{date}` 폐지, `reflection` 삭제(`PUT /records/{date}/draft` 본문·summary 응답), `PATCH /users/me/nickname` 삭제, `GET /archive/calendar` 응답, `POST /insights/weekly/{id}/reflect` 응답. 목록은 문서 끝 11장.
> v0.4에서 ⚠️ 호환이 깨지는 변경: `GET /tasks`의 이월 폐지와 `overdueDays`(→ `dueInDays`), 배정일 `null` 폐지, 할 일 개수 제한 규칙, `reflection` 복원(`PUT draft`·`POST complete` 본문, `summary.reflectionWritten`, 인사이트 `reflectionCount`·근거 `REFLECTION`), `POST /insights/weekly/{id}/reflect` 응답(`targetDate` 복원). 목록은 11장의 "v0.4 호환 깨짐 요약". **v0.4에서 새로 정한 세부(`NOTICE-047`, `NOTICE-048`)는 2026-11-24에 일괄 승인되어 `[확정]`이다. 같은 날 추가 확정은 D-135~D-146.**
> v0.5 (2026.11.24, `develop` 머지 기준 정리): 질문 생성(6.x)·주간 인사이트(9.1·9.2·9.4·9.5)·주간 기록 잠금이 PR #17·#18로 **구현·머지**되었다. 인사이트 `eligibility`는 `{ eligible, requestable, completedDays, requiredDays }`(`weekEnded` 없음), 프로필의 `birthYear`는 `age`(14~100 `[임시]`)로 바뀌었다(D-148). 이 아래 본문 중 `[제안]` 표기가 남은 곳은 구현은 됐지만 사용자 확정을 받지 않은 항목이다.

---

## 0. 표기 규칙

| 표기 | 의미 | 구현 시 행동 |
|---|---|---|
| `[확정]` | 기능명세서, 확인필요 답변, 사용자 확정 사항(`DECISIONS.md`)에 근거 | 그대로 구현 |
| `[확인 필요]` | 자료 간 충돌 또는 사용자 확인이 필요 | **구현 전 사용자에게 질문** |
| `[미확정]` | 명세에 세부가 없음 | **구현 전 사용자에게 질문** |
| `[제안]` | 확정 사항을 구현하기 위해 필요해서 정한 세부 (필드 이름 등). 사용자 승인 전에는 잠정 | 구현 전 한 번 확인 |
| `[임시]` | 사용자가 "일단 이 값으로 진행"을 승인한 값. 기획 확정 시 교체됨 (`PLANNING_NOTICE.md`, `NOTICE.md` C) | 그대로 구현하되 값은 한곳(ENUM·설정)에서만 관리 |

기능 ID(예: `HM-05`)는 기능명세서 `기능명세` 시트의 ID이며, 각 API가 어떤 기능을 지원하는지 추적하는 용도입니다.

---

## 1. 공통 규약

### 1.1 기본 규칙

| 항목 | 값 | 상태 |
|---|---|---|
| Base path | **`/api`** (이 문서의 경로는 모두 `/api` 아래. 예: `GET /api/tasks`) | `[확정]` |
| Content-Type | `application/json; charset=UTF-8` | `[제안]` |
| 날짜 형식 | `YYYY-MM-DD` (예: `2026-10-21`) | `[제안]` |
| 시각 형식 | 시/분 `HH:mm`. 일시는 오프셋 없는 `LocalDateTime`(예: `2026-10-21T18:05:00`). `BaseEntity`가 `LocalDateTime`을 쓰기 때문 | `[제안]` |
| 타임존 | `Asia/Seoul` 고정 (날짜 경계, 주 계산, 퇴근 시간 스케줄, "오늘" 판정 모두) | `[확정]` |
| 주(週) 정의 | 월요일 시작 ~ 일요일 종료 | `[확정]` |
| ID 타입 | Long (MySQL BIGINT AUTO_INCREMENT) | `[확정]` |
| 응답 형식 | 모든 응답을 공통 `ApiResponse`로 감쌈. 1.2 참조. 목록은 `data` 안에 객체로 감싼다 (예: `{ "items": [...] }`) | `[확정]` |
| 사용자 식별 | 인증 컨텍스트(JWT)에서 추출. **URL/요청 본문에 userId를 넣지 않음** | `[확정]` |
| 인증 | JWT(Access 30분 / Refresh 14일) + Redis. 3장 참조. 인증이 필요 없는 API는 3장의 로그인·가입·재발급뿐 | `[확정]` |

### 1.2 공통 응답 형식 `[확정]`

모든 API는 `global/common/response`의 `ApiResponse<T>`로 응답한다. 필드 순서는 `success`, `errorCode`, `message`, `data`이다.
**이 문서의 각 API 응답 예시(Response)는 `data` 안의 값만 보여 준다.**

**성공 (데이터 있음)** — `ApiResponse.success(message, data)`
```json
{
  "success": true,
  "message": "할 일이 추가되었습니다.",
  "data": { "id": 103, "title": "고객 문의 정리", "date": "2026-10-21", "dueDate": null, "completed": false }
}
```

**성공 (데이터 없음)** — `ApiResponse.success(message)`
```json
{ "success": true, "message": "로그아웃되었습니다.", "data": null }
```

**실패** — `ApiResponse.fail(ErrorCode)` / `fail(ErrorCode, message)` / `fail(String errorCode, String message)`
```json
{
  "success": false,
  "errorCode": "TASK_NOT_FOUND",
  "message": "존재하지 않는 할 일입니다.",
  "data": null
}
```

| 규칙 | 내용 |
|---|---|
| `errorCode` | 성공 응답에서는 생략된다(`NON_NULL`). 실패 시 `ErrorCode` enum의 `name()` 값 |
| HTTP 상태 | `ErrorCode`의 `status`(int)를 사용한다 |
| 기본 메시지 | `ErrorCode.getMessage()` |
| 검증 실패(`@Valid`) | `fail(ErrorCode.BAD_REQUEST, message)`로 메시지를 직접 채운다. `fieldErrors` 필드는 없다 |
| 스프링 표준 예외 | `ErrorCode`에 없으면 `fail(String errorCode, String message)` |
| 데이터 없는 성공 | `data`는 `null`. **삭제·로그아웃·탈퇴도 `204`가 아니라 `200` + `success(message)`** |
| 성공 메시지 문구 | `SuccessMessage` 상수 클래스/enum 한 곳에서 관리 `[확정]`. 문구는 잠정이며 자유롭게 수정 가능 (위 예시 문구는 예시) |
| 화면 문구 | "저장하지 못했어요" 등은 프론트가 `errorCode`로 결정한다. 서버 `message`는 개발·디버깅용 |

### 1.3 공통 에러 코드

`ErrorCode`는 `(int status, String message)` 구조이며 도메인별 주석으로 구분한다 (`RULES.md` 7.6). 아래 목록은 이 문서에서 쓰는 코드이며, 구현할 때 해당 도메인 구역에 추가한다. 이름은 `[제안]`, 상태 코드는 아래 표를 따른다.

| 구분 | HTTP | errorCode | 설명 |
|---|---|---|---|
| 기본 | 500 | `INTERNAL_SERVER_ERROR` | 서버 오류 |
| 기본 | 400 | `BAD_REQUEST` | 요청 값 검증 실패 (길이, 형식, 필수값, 개수 제한 초과 등) |
| 기본 | 403 | `FORBIDDEN` | 접근 거부 (구현됨) |
| 인증 | 401 | `ACCESS_TOKEN_REQUIRED` / `INVALID_ACCESS_TOKEN` / `EXPIRED_ACCESS_TOKEN` | Access Token 없음/유효하지 않음/만료 |
| 인증 | 401 | `REFRESH_TOKEN_REQUIRED` / `INVALID_REFRESH_TOKEN` / `EXPIRED_REFRESH_TOKEN` | Refresh Token 관련 |
| 인증 | 401 | `SIGNUP_TOKEN_REQUIRED` / `INVALID_SIGNUP_TOKEN` / `EXPIRED_SIGNUP_TOKEN` | 가입 토큰 관련 (구현됨) |
| 인증 | 502 | `GOOGLE_AUTH_FAILED` | 구글 인증 실패 또는 구글 계정에 이메일 없음 (구현됨) |
| 사용자 | 404 | `USER_NOT_FOUND` | |
| 사용자 | 400 | `EMAIL_MISMATCH` | 탈퇴 확인 이메일 불일치 |
| 사용자 | 400 | `INVALID_COMPETENCY_SELECTION` | 역량 선택 규칙 위반(공통 역량 1개 미만·3개 초과, 희망 직군 역량 2개 미만·5개 초과, 희망 직군 소속이 아닌 역량 등). 메시지에 사유 `[제안]` |
| 할 일 | 404 | `TASK_NOT_FOUND` | 타 사용자 리소스 접근도 404 (존재 여부 노출 방지) |
| 할 일 | 400 | `TASK_LIMIT_EXCEEDED` | 그날(배정일)의 할 일이 완료 포함 20개를 넘음 (5.3) |
| 기록 | 404 | `QUESTION_NOT_FOUND` | |
| 기록 | 409 | `RECORD_LOCKED` | 해당 주 인사이트가 발행되어 수정 불가 (1.5) |
| 기록 | 422 | `RECORD_EMPTY` | 그날 할 일도 회고도 없어 질문 생성 불가 (6.5) `[제안]` |
| AI | 502 | `AI_GENERATION_FAILED` | 외부 AI 호출 실패 (호출 한도 초과 포함 `[제안]`) |
| AI | 504 | `AI_TIMEOUT` | 외부 AI 응답 시간 초과 |
| 인사이트 | 404 | `INSIGHT_NOT_FOUND` | (`ACTION_NOT_FOUND`는 반영 기능 폐기로 삭제, D-147) |
| 인사이트 | 422 | `INSIGHT_NOT_REQUESTABLE` | 분석 요청 가능 시점(금요일 퇴근 완료 후~일요일)이 아님 `[제안: 이름]` |
| 인사이트 | 422 | `INSUFFICIENT_RECORDS` | `COMPLETED` 기록이 3일 미만 |
| 인사이트 | 409 | `INSIGHT_ALREADY_PUBLISHED` | 이미 발행된 주에 재요청 |
| 인사이트 | 400 | ~~`NO_ACTION_SELECTED`~~ | 반영 기능 폐기로 삭제 (D-147) |

### 1.4 공통 Enum

| Enum | 값 | 비고 |
|---|---|---|
| `RecordStatus` | `NOT_STARTED`(작성 전) / `DRAFT`(임시저장) / `COMPLETED`(퇴근 완료) | `NOT_STARTED`는 **수동 저장(`manual: true`)이 아직 없었던 상태**를 응답에서 표현한 값(D-95). `DRAFT`는 아카이브에 보이고 인사이트에 **반영하지 않음** |
| `InsightStatus` | `NOT_PUBLISHED` / `GENERATING` / `PUBLISHED` / `FAILED` | `FAILED`: 프론트가 실패 안내 후 분석 요청하기를 다시 노출 `[확정]` |
| `EvidenceType` | `MEMO`(업무별 메모) / `REFLECTION`(하루 회고) / `QUESTION_ANSWER`(AI 질문 답변) / `TASK`(할 일 제목) | `REFLECTION`은 회고 복원(D-124, D-126)으로 되돌아옴 `[확정]`. `TASK`는 내용 없는 주(D-54) 때문에 추가 `[확정]` |
| `Gender` | `MALE` / `FEMALE` / `OTHER` | `[확정]` D-142. 성별은 선택(null 허용) |
| `JobGroup` | `MARKETING` / `IT_DEVELOPMENT` / `HR` / `MANUFACTURING` / `SALES` / `STRATEGY_PLANNING` / `FINANCE_ACCOUNTING` / `PR_ADVERTISING` / `PURCHASING` / `QUALITY_CONTROL` / `PRODUCTION_MGMT` / `RND` / `DESIGN` (13개) | `[확정]` D-131 (`KEYWORD_DEFINITIONS.md`). 재직 직군·희망 직군 공용 |
| `CompetencyType` | `COMMON`(공통 역량) / `JOB`(직군별 역량) | |
| `Competency` | 공통 9개 + 직군별 68개 = 77개 | `[확정]` 목록과 정의 (D-131, `KEYWORD_DEFINITIONS.md`). 각 상수가 `type`, 소속 `jobGroup`(공통이면 null), 표시명 `label`, 정의 `description`을 가진다 (D-99). 같은 표시명이 여러 직군에 있어 코드는 직군 접두어(`MKT_`, `DEV_` 등) |

### 1.5 기록 잠금 규칙 `[확정: 원칙] / [제안: 적용 범위]` (D-44, D-130)

- 어떤 날짜가 속한 **주의 인사이트가 `PUBLISHED`이면** 그 주(월~일)의 기록과 할 일은 **수정할 수 없다** → `409 RECORD_LOCKED`. `[확정]`
- 할 일은 **배정일 하나만** 가지고 이월되지 않으므로(D-119) 잠금 판단이 단순하다 `[확정]` (D-130):
  - **배정일이 잠긴 주에 속하는 할 일**은 잠긴다. 완료일은 보지 않는다 (D-123)
  - **하루 회고**(D-124)도 그 **날짜**가 잠긴 주에 속하면 잠긴다
- 잠금 대상 동작: 잠긴 할 일의 수정(제목·메모·배정일·마감일)·삭제·완료 토글, **배정일을 잠긴 주 날짜로 두는 추가·수정**, 잠긴 주 날짜의 임시저장(회고 포함)·기록 완료·질문 받기.
- 완료 토글도 그 할 일의 **배정일** 기준으로 잠금을 판단한다. 오늘이 속한 주는 아직 발행될 수 없으므로 오늘 할 일에는 영향이 없다.
- 인사이트 발행 **전**에는 `COMPLETED` 기록과 그날의 할 일·회고도 자유롭게 수정할 수 있다. 수정해도 상태는 `COMPLETED`로 유지되고 최초 완료 시각은 바뀌지 않는다. `[확정]`
- **`GENERATING` 중에도 잠근다** `[확정]` D-137 (입력이 바뀌면 분석 입력과 발행 결과가 어긋남). `FAILED`가 되면 잠금이 풀린다.
- 인사이트 분석은 금요일(퇴근 후)~일요일에 **그 주를 분석**하므로(9.2) 요청하면 그 주의 남은 날(토·일)도 함께 잠긴다 `[확정]` D-139.
- 인사이트 반영(9.3)으로 만들어지는 할 일은 **반영한 날(오늘) 배정**이므로(D-129) 배정일이 속한 주의 인사이트가 발행되면 다른 할 일처럼 잠긴다(보통 아직 발행 전인 이번 주).

---

## 2. 기능 ID ↔ API 매핑

| 기능 ID | 기능 | API | 비고 |
|---|---|---|---|
| CM-01, CM-02 | 메뉴 이동, 헤더 | (없음, 프론트 전용) | |
| CM-03 | 프로필 아이콘 | (없음) | 확인필요 #6. 회원 정보 수정은 환경 설정(P-05)의 회원수정 페이지에서 (D-100) |
| HM-01 | 주간 캘린더 표시 | (없음, 프론트 전용) | `[확인 필요]` 표시 기준 주/이동 방식 (프론트 결정 대기) |
| HM-02, HM-03 | 날짜 선택, 체크리스트 | `GET /tasks` | 5.1. 그날 추가한 할 일만, 완료/미완료 분리, 개수 필드, 마감 D-day(`dueInDays`) |
| HM-04, RC-03 | 완료 체크 | `PATCH /tasks/{taskId}` | 같은 데이터 |
| HM-05 | 할 일 추가 | `POST /tasks` | 배정일·마감일 선택 입력 |
| HM-06, HM-09 | 액션 팝업, 기록하기 | (없음, 프론트 전용) | 팝업 버튼 3개(수정/삭제/기록하기) |
| HM-07 | 수정하기 | `PATCH /tasks/{taskId}` | |
| HM-08 | 삭제하기 | `DELETE /tasks/{taskId}` | |
| HM-10, HM-11 | 기록 상태 표시 | `GET /records/{date}/summary` | 상태·잠금·완료 시각·메모 수·회고 작성 여부 포함 |
| HM-12 | 최근 인사이트 카드 | `GET /insights/weekly/latest` | 가장 최근 발행된 인사이트 `[확정]` D-140 (경로 `[제안]`) |
| RC-01 | 기록 날짜 제목 | (없음, 프론트 전용) | |
| RC-02, RC-05, RC-09 | 업무/메모/회고/답변 조회 | 상단: `GET /tasks` (메모 포함) / 중간: `GET /records/{date}/reflection` / 하단: `GET /records/{date}/questions` | 회고 복원(D-124, D-125). 기존 `GET /records/{date}`는 폐지(D-108) |
| RC-04 | 회고 가이드 선택 | (없음, 프론트 전용) | 회고 복원으로 삭제 제안 철회. 가이드 3개 선택·문구 삽입은 프론트 동작이며 선택 방식은 기획 확인 (`PLANNING_NOTICE.md`) |
| RC-06 | 확장 질문 생성 | `POST /records/{date}/questions` + 내부 스케줄러 | |
| RC-07 | 질문 넘기기 | (없음, 프론트 전용) | 서버는 `questions[].order`(1~3) 제공 |
| RC-08 | 진행 표시 | (없음) | 확인필요 #9로 **제거 확정** |
| RC-10 | 질문 건너뛰기 | 저장 API의 `skipped` 필드 | |
| RC-11, RC-14 | 하단 안내/고정 바 | (없음, 프론트 전용) | |
| RC-12 | 임시저장 | `PUT /records/{date}/draft` | `manual` 필드 (D-95), 회고 포함 |
| RC-13 | 기록 완료 | `POST /records/{date}/complete` | 레벨 갱신 (D-101) |
| AR-01, AR-02 | 월별 캘린더 | `GET /archive/calendar` | 기록 유무만 (D-110) |
| AR-03~05, AR-07 | 날짜별 기록 | `GET /tasks?date=` + `GET /records/{date}/questions` + `GET /records/{date}/summary` | |
| IN-01~02, IN-04~08 | 주간 인사이트 조회 | `GET /insights/weekly` | 제목·소제목·그래프·주차별 흐름·회고 개수 포함 (9.1) |
| IN-03 | 분석 요청 | `POST /insights/weekly` | |
| IN-09 | ~~업무에 반영~~ → 홈에 추천 행동 표시만 | `GET /insights/weekly/latest`의 `actions` (9.4) | 할 일로 반영하지 않음 `[확정(방향)]` (D-147, 9.3) |
| (신규) | 인사이트 목록 조회 | `GET /insights/weekly/list` | `[확정]` D-141 (9.5) |
| IN-10 | 분석 근거 원칙 | (API 아님, AI 프롬프트/검증 규칙) | 8장 |
| IN-11 | 리포트 생성 방식 | `POST /insights/weekly` | #16: 분석 요청하기 방식 확정, 자동 생성 없음 |
| ST-01 | 이메일 표시 | `GET /users/me` | 프로필·레벨 포함 |
| ST-02 | 로그아웃 | `POST /auth/logout` | |
| ST-03 | 탈퇴 | `POST /users/me/withdrawal` | 화면 확정: 이메일 입력 후 탈퇴 (D-117) |
| (신규) | 회원 프로필 수정(회원수정 페이지 1) | `PUT /users/me/profile` | 닉네임·성별·나이·직군·역량 일괄 (D-100, 나이는 D-148) |
| (신규) | 프로필 선택지 | `GET /meta/profile-options` | 직군·역량·성별 목록 (D-99) |
| (신규) | 퇴근 시간 설정(회원수정 페이지 2) | `PUT /users/me/work-end-time` | |
| (신규) | 로그인/가입/재발급 | `POST /auth/...` | 3장 |
| EX-01~07 | 퇴근 연출 | (없음, 프론트 전용) | |

---

## 3. 인증 · 가입 `[확정]` (구현 완료: auth-core, auth-google)

### 3.1 확정된 사항

| 항목 | 내용 |
|---|---|
| 소셜 로그인 제공자 | **구글만** (D-94. 카카오 연동은 만들지 않음) |
| 흐름 | 제공자가 **인가 코드를 프론트로 돌려주고, 프론트가 그 코드를 백엔드로 전송** (D-88). 이미 가입했으면 로그인, **미가입이면 가입 토큰 발급 → 닉네임(+성별·나이) 입력으로 가입** → Access/Refresh 발급 |
| Access Token | JWT, 30분. 응답 body로 전달, 프론트는 `Authorization: Bearer`로 전송 |
| Refresh Token | JWT, 14일. **HttpOnly 쿠키**(`refreshToken`, `Path=/api/auth`)로만 전달 (D-89). `local`은 `Secure=false; SameSite=Lax`, 그 외 `Secure=true; SameSite=None` |
| 가입 토큰 | stateless JWT, **30분** |
| Redis | `refresh:{userId}`(Refresh 저장, 재발급 시 **회전**), `blacklist:{jti}`(로그아웃·탈퇴 시 Access 무효화, TTL=남은 유효시간). 기기당 Refresh 1개 |
| CSRF | 쿠키로 인증하는 `reissue`는 **`X-Tilly-Client: web` 헤더 필수** (없으면 400) |
| 기존 프로젝트 | 코드를 재사용하지 않고 TILLY용으로 새로 설계 (D-90) |
| 개발용 토큰 | `POST /auth/dev-login` — `local` 프로파일에서만 존재, 그 외 404 (D-91) |
| 닉네임 | 가입 시 입력, 2~10자, 중복 허용 |

### 3.2 엔드포인트

| 용도 | 경로 | 인증 | 요청 → 응답(`data`) |
|---|---|---|---|
| 구글 로그인 | `POST /auth/login/google` | 불필요 | `{ "code": "…" }` → `{ "status": "LOGGED_IN"\|"SIGNUP_REQUIRED", "accessToken", "userId", "signupToken", "email" }`. `LOGGED_IN`이면 `accessToken`/`userId`만 채워지고 Refresh 쿠키가 내려옴. `SIGNUP_REQUIRED`이면 `signupToken`/`email`만 채워짐. 실패 `GOOGLE_AUTH_FAILED`(502), `code` 누락 400 |
| 가입 | `POST /auth/register` | 불필요 | **`{ "signupToken": "…", "nickname": "2~10자", "gender": "MALE"\|"FEMALE"\|"OTHER"\|null, "age": 25\|null }`** → `{ "accessToken", "userId" }` + Refresh 쿠키. `gender`·`age`는 **선택(생략·null 허용)이라 닉네임만 보내는 기존 요청도 그대로 동작** (D-97). 실패 `SIGNUP_TOKEN_REQUIRED`/`INVALID_SIGNUP_TOKEN`/`EXPIRED_SIGNUP_TOKEN`(401), 형식 오류 400 |
| 재발급 | `POST /auth/reissue` | 불필요(쿠키+헤더) | (본문 없음, Refresh 쿠키 + `X-Tilly-Client: web`) → `{ "accessToken" }` + Refresh 쿠키 재설정. 사용된 Refresh 재사용 시 `INVALID_REFRESH_TOKEN` |
| 로그아웃 | `POST /auth/logout` | 필요 | `data: null`. Refresh 쿠키 삭제 + Access 무효화 (4.5) |
| 개발용 | `POST /auth/dev-login` | 불필요 | `local` 전용 |

`gender`·`age` 검증: 4.2의 프로필 규칙과 같다. `age`는 정수, 범위 `[임시]` 14~100, 벗어나면 400 `BAD_REQUEST`. 입력한 나이를 그대로 저장하며 해가 바뀌어도 늘지 않는다(D-148).

| 남은 미확정 사항 | 비고 |
|---|---|
| CORS 허용 도메인, 구글 `redirect_uri` | 프론트 주소 확정 후 NOTICE-018, NOTICE-015 |
| 약관 동의·온보딩 화면의 백엔드 범위 | 기능명세서 제외 범위. 가입 직후 프로필 입력(2단계)은 4.2 사용 |

---

## 4. 계정 / 환경 설정 (P-05)

### 4.1 내 정보 조회 `GET /users/me` — ST-01 `[확정]`

**Response 200**
```json
{
  "nickname": "틸리",
  "email": "user@example.com",
  "workEndTime": "18:00",
  "gender": "FEMALE",
  "age": 25,
  "currentJobGroup": "DEVELOPMENT",
  "targetJobGroup": "DESIGN",
  "competencies": ["COMMUNICATION", "DSN_UX", "DSN_PROTOTYPING"],
  "level": 3
}
```

| 필드 | 타입 | 설명 |
|---|---|---|
| `nickname` | string | 2~10자 |
| `email` | string | 읽기 전용. 탈퇴 확인 입력의 비교 기준 |
| `workEndTime` | string \| null | `HH:mm`. 미설정이면 `null` |
| `gender` | enum \| null | 선택 항목 |
| `age` | number \| null | 선택 항목. 나이를 숫자로 직접 저장(14~100 `[임시]`) |
| `currentJobGroup` | enum \| null | 재직(현재 인턴) 직군. 선택 항목 |
| `targetJobGroup` | enum \| null | 희망 직군. 선택 항목 |
| `competencies` | enum[] | 얻고 싶은 역량(공통+희망 직군). **비어 있으면 프로필 입력(2단계) 전**으로 프론트가 판단 `[제안]` |
| `level` | number | 성장 레벨 1~9, 하루 기록할 때마다 +1 하고 9 다음은 1 (4.6). 레벨별 이미지(흙, 새싹…)는 프론트가 매핑 |

### 4.2 프로필 수정 `PUT /users/me/profile` `[확정: 동작] / [제안: 경로·필드명]` (D-100)

회원수정 페이지 1과 **가입 직후 프로필 입력(2단계)**에서 같은 API를 쓴다. **전체 교체** 방식이며 선택 항목은 `null`/생략이 "해제"다. 기존 `PATCH /users/me/nickname`은 **삭제**되었다 ⚠️.

**Request**
```json
{
  "nickname": "새닉네임",
  "gender": "FEMALE",
  "age": 25,
  "currentJobGroup": "DEVELOPMENT",
  "targetJobGroup": "DESIGN",
  "competencies": ["COMMUNICATION", "DSN_UX", "DSN_PROTOTYPING"]
}
```

**Response 200**: 4.1과 같은 형식(수정 후 전체 프로필)

| 규칙 | 상태 |
|---|---|
| `nickname` 필수, 2~10자, 중복 허용 | `[확정]` D-35 |
| `gender`, `age`, `currentJobGroup`, `targetJobGroup` 선택(null 허용). 직군은 `JobGroup` 값 | `[확정]` |
| **공통 역량(`type=COMMON`) 1개 이상 필수** | `[확정]` |
| **`targetJobGroup`을 선택한 경우, 그 직군 소속 역량(`type=JOB`, `jobGroup=targetJobGroup`) 2개 이상 필수** | `[확정]` D-98 |
| `targetJobGroup`이 null이면 직군 소속 역량은 선택할 수 없다(0개) | `[제안]` |
| 직군 역량은 반드시 `targetJobGroup` 소속이어야 한다. 희망 직군을 바꾸면 새 직군 기준으로 다시 보내야 한다 | `[제안]` |
| 중복 역량 불가, 존재하지 않는 값은 400 | `[제안]` |
| **공통 역량 최대 3개, 희망 직군 역량 최대 5개** | `[확정]` D-144 |
| `age` 범위 14~100 | `[임시]` |

**Errors**: `400 BAD_REQUEST`(형식), `400 INVALID_COMPETENCY_SELECTION`(역량 규칙 위반)

### 4.3 프로필 선택지 `GET /meta/profile-options` `[확정: 존재] / [제안: 경로·응답]` (D-99)

직군·역량·성별 키워드는 코드의 ENUM으로 관리하고(`JobGroup`, `Competency`, `Gender`), 프론트에는 이 API로 선택지를 내려준다. 인증 필요. 표시 문구(`label`)와 정의(`description`)는 서버 ENUM이 가진다 `[확정]` (성별 포함 모두 확정, D-142).

**Response 200**
```json
{
  "genders": [ { "code": "MALE", "label": "남성" } ],
  "jobGroups": [ { "code": "MARKETING", "label": "마케팅" }, { "code": "DESIGN", "label": "디자인" } ],
  "competencies": [
    { "code": "PARTNERSHIP", "label": "파트너십", "type": "COMMON", "jobGroup": null, "description": "공통의 목표를 달성하기 위해 다른 사람의 목표달성을 지원함으로써 협력적 분위기 조성" },
    { "code": "DSN_TOOL", "label": "디자인 툴 사용 역량", "type": "JOB", "jobGroup": "DESIGN", "description": "Figma 등 디자인 도구를 활용해 와이어프레임, 프로토타입 및 UI 시안을 제작하고, 컴포넌트와 디자인 시스템을 활용해 일관성 있는 디자인을 구현하는 능력" }
  ],
  "selectionRules": { "commonMin": 1, "commonMax": 3, "jobMin": 2, "jobMax": 5 }
}
```

- 전체 목록과 정의는 `KEYWORD_DEFINITIONS.md`를 따른다(코드 ENUM과 같음). 정의 문구가 바뀌면 ENUM만 고치면 된다.

### 4.4 퇴근 시간 설정 `PUT /users/me/work-end-time` — 회원수정 페이지 2 `[확정]`

**Request** `{ "workEndTime": "18:00" }` — 해제하려면 `{ "workEndTime": null }`

**Response 200** `{ "workEndTime": "18:00" }`

| 규칙 | 상태 |
|---|---|
| `HH:mm` 분 단위 자유 입력 | `[확정]` |
| 미설정(null)이면 자동 질문 생성을 하지 않는다. 수동 "질문 받기"는 가능 | `[확정]` |
| 해제(null) 허용 | `[확정]` |
| 요일 구분 없이 매일 적용 | `[확정]` |

- 별도 경로인 이유: 회원수정 페이지 2가 퇴근 시간만 수정하고, "필드 생략"과 "null(해제)"을 구분하기 위함
- Errors: `400 BAD_REQUEST` (형식이 `HH:mm`가 아님)
- 가입 시 퇴근 시간 입력 여부(온보딩 2단계에 포함할지)는 기획 확인 `[확인 필요]`. 포함되면 이 API를 그대로 호출한다.

### 4.5 로그아웃 `POST /auth/logout` — ST-02 `[확정]`

- 확인 없이 즉시 처리한다. Redis의 Refresh Token을 삭제하고 Access Token을 무효화한다 (D-32).
- **Response 200** (`data: null`)
- 실패 시 프론트가 "처리하지 못했어요 · 다시 시도"를 표시한다 (상태예외 시트).

### 4.6 성장 레벨 `[확정]` (D-101 → D-143, 2026-11-24)

| 규칙 | 상태 |
|---|---|
| `users.level` 컬럼에 1~9로 저장. 가입 직후 1 | `[확정]` |
| **퇴근 완료(`COMPLETED`)한 서로 다른 날이 하루 늘 때마다 레벨이 1 오르고, 9 다음은 다시 1로 돌아간다**(순환). 예: 1 → 2 → … → 9 → 1 → 2 | `[확정]` D-143 |
| **기록 완료(`POST /records/{date}/complete`)로 날짜가 처음 `COMPLETED`가 될 때만** 1 올린다. 이미 `COMPLETED`인 날을 수정·재완료해도 올리지 않는다 | `[확정]` |
| 계산: 레벨 = (퇴근 완료한 서로 다른 날 수 mod 9) + 1. 임시 구간표(0/1/3/7/…/150일)와 "레벨은 내려가지 않는다"는 폐기 (순환할 때 9에서 1로 내려감) | `[확정]` D-143 |
| "기록 하루"를 퇴근 완료한 날로 해석(임시저장만 한 날은 제외) | `[제안]` |
| 순환 횟수(몇 바퀴째)를 응답에 둘지 | `[미확정]` (필요하면 기획 요청) |

- 레벨별 이미지(흙→새싹…)는 프론트가 `level`로 매핑한다. 순환하므로 `level` 숫자만 내려가며, 기록이 지워져서 내려가는 일은 없다.

### 4.7 탈퇴 `POST /users/me/withdrawal` — ST-03 `[확정]` (D-36, D-117)

화면: **버튼을 누르면 바로 탈퇴하지 않고, 가입한 이메일을 입력해서 보내야 탈퇴된다** (기획 확정). 와이어프레임 반영은 기획 작업(`NOTICE-020`).

**Request** `{ "confirmEmail": "user@example.com" }` **Response 200** (`data: null`)

| 규칙 | 상태 |
|---|---|
| 입력 이메일이 가입 이메일과 정확히 일치해야 한다. 판정은 **서버**가 수행 (불일치 `400 EMAIL_MISMATCH`) | `[확정]` |
| 데이터는 **즉시 영구 삭제**(사용자, 프로필·역량, 할 일, 기록, 질문, 인사이트 전부). DB `ON DELETE CASCADE` | `[확정]` D-36 |
| Redis의 Refresh 삭제·Access 블랙리스트, Refresh 쿠키 삭제 | `[확정]` |
| 소셜 제공자 쪽 연결 해제(unlink)는 **하지 않는다** (사용자가 구글 계정에서 직접) | `[확정]` |
| 외부 AI에 이미 전송된 데이터 | 제공자 정책에 따름. 사용자 확인 필요 (`NOTICE.md`) |

---

## 5. 할 일 (Task) — 홈 P-01

할 일은 **홈 체크리스트와 기록 화면(P-02)이 공유하는 단일 데이터**다 (HM-04 = RC-03). **업무별 메모는 할 일에 1:1로 붙는다**(`memo`, 할 일당 1개, D-106). 할 일 추가는 홈에서만 가능하다 (확인필요 #7).

**할 일은 그날 추가한 일만 그날 보인다.** 못 끝낸 할 일이 다음 날로 넘어오지 않으며(이월 없음), 마감 기한은 "오늘 기준으로 며칠 남았는지"를 보여 주는 용도일 뿐 노출 기준이 아니다 (D-119, D-121, 2026-11-24).

### 5.0 할 일 모델 `[확정]` (D-102, D-106, D-119~D-123)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | |
| `title` | string | 앞뒤 공백 제거 후 1~20자 |
| `date` | string | **배정일(필수).** 이 할 일이 속한 날이며 **이 날에만 노출**된다. 추가할 때 생략하면 오늘 `[확정]` (D-120) |
| `dueDate` | string \| null | **마감 일시.** 요청은 `YYYY-MM-DDTHH:mm`(시간 필수, 초는 버림), 응답은 `YYYY-MM-DDTHH:mm:ss`. 노출 여부와 무관하고 `dueInDays` 계산과 표시에만 쓰인다. `null` 허용 |
| `completed` | boolean | |
| `completedDate` | string \| null | 완료 토글 시점의 "오늘"(서버 기록). **참고용이며 노출·집계 기준이 아니다** (D-123). 미완료로 되돌리면 `null` |
| `memo` | string \| null | 업무별 메모, 최대 500자. 없으면 `null` |
| `dueInDays` | number \| null | **조회 응답에서만** 계산: 마감 **날짜** − **서버 오늘**(조회일이 아님). 양수 = 남은 일수("D-3"), 0 = 오늘 마감("D-Day"), 음수 = 지난 일수("D+2"). `dueDate`가 없거나 완료한 할 일은 `null`. 프론트가 표기 `[제안: 필드명]` (D-121) |

- 마감 시각은 표시용이고 `dueInDays`는 **날짜 기준**이다.
- 마감 일시가 배정일보다 앞서도 거절하지 않는다 (NOTICE-041 ③).

### 5.1 할 일 목록 `GET /tasks?date=YYYY-MM-DD` — HM-02, HM-03, RC-02 `[확정]` (D-105, D-119)

`date`를 생략하면 오늘(`Asia/Seoul`). 홈 체크리스트와 기록 화면 상단(할 일+메모), 아카이브 날짜 상세가 모두 이 API를 쓴다.

**Response 200** (예시는 서버 오늘이 2026-10-21일 때)
```json
{
  "date": "2026-10-21",
  "completedCount": 1,
  "totalCount": 3,
  "completed": [
    { "id": 101, "title": "주간 보고서 작성", "date": "2026-10-21", "dueDate": "2026-10-21T18:00:00", "completed": true, "completedDate": "2026-10-21", "memo": "초안 구조를 바꿔서 시간이 줄었다.", "dueInDays": null }
  ],
  "incomplete": [
    { "id": 102, "title": "고객 문의 정리", "date": "2026-10-21", "dueDate": "2026-10-24T18:00:00", "completed": false, "completedDate": null, "memo": null, "dueInDays": 3 },
    { "id": 120, "title": "회의 후 결정사항 한 줄 메모", "date": "2026-10-21", "dueDate": null, "completed": false, "completedDate": null, "memo": null, "dueInDays": null }
  ]
}
```

**노출 규칙** (조회일 = D)

| 목록 | 조건 |
|---|---|
| `completed` | `date = D` 이고 `completed = true` |
| `incomplete` | `date = D` 이고 `completed = false` |

- **그날(배정일) 추가한 할 일만** 보인다. 다른 날 배정된 할 일은 완료·미완료와 관계없이 보이지 않는다. 어제 못 끝낸 할 일이 오늘 목록에 나타나지 않는다 (D-119).
- 과거·미래 날짜를 조회해도 그날 배정된 할 일을 **현재 상태 그대로** 보여 준다(그날 시점 재구성 없음).
- `dueInDays`는 **서버 오늘 기준**이라 어느 날짜를 조회해도 오늘로 계산한다 (D-121).
- `completedCount` = `completed` 개수, `totalCount` = `completed` + `incomplete` 개수. **각각 필드로 내려주고 "2/5" 표기는 프론트가 처리** `[확정]` D-105.
- 정렬: 각 목록 내 생성 순서(`id` 오름차순) `[확정]`. 빈 목록이면 `[]`.
- 메모: 그 할 일에 붙은 메모(할 일당 1개).

### 5.2 주간 캘린더 `[확인 필요]` (HM-01)

표시 기준 주, 선택 날짜 강조, 주 이동 방식은 프론트 결정 대기(#2)다. 서버는 `date`를 받는 `GET /tasks`만 제공한다. 확정 후 필요하면 주 단위 조회를 추가한다.

### 5.3 할 일 추가 `POST /tasks` — HM-05 `[확정]` (D-120, D-122)

**Request** `{ "title": "고객 문의 정리", "date": "2026-10-21", "dueDate": "2026-10-23T18:00" }` — `date`를 생략하거나 `null`이면 **오늘**, `dueDate`를 생략하거나 `null`이면 마감 없음

**Response 201** `{ "id": 103, "title": "고객 문의 정리", "date": "2026-10-21", "dueDate": "2026-10-23T18:00:00", "completed": false, "completedDate": null, "memo": null }`

| 규칙 | 상태 |
|---|---|
| `title`: 앞뒤 공백 제거 후 **1~20자** | `[확정]` |
| 입력은 Enter로 확정, 빈 값이면 해당 행 자동 삭제 | `[확정]` 프론트 동작. 서버는 빈 값을 `400 BAD_REQUEST`로 거절 |
| **개수 제한: 그 배정일의 할 일이 완료 포함 20개면 추가 불가** → `400 TASK_LIMIT_EXCEEDED`. 배정일이 없는 할 일은 없으므로 별도 한도도 없다 | `[확정]` D-41 / `[확정]` D-122 |
| 배정일·마감일 입력 가능 날짜 | `[확정]` 제한 없음 (과거·미래·주말 모두) |
| `dueDate`는 시간까지 필수(`YYYY-MM-DDTHH:mm`). 날짜만 보내면 `400 BAD_REQUEST`. 마감이 배정일보다 앞서도 거절하지 않음 | `[확정]` |
| 배정일이 발행된 주에 속함 | `409 RECORD_LOCKED` (1.5) |

### 5.4 할 일 수정 / 완료 토글 `PATCH /tasks/{taskId}` — HM-04, HM-07, RC-03 `[확정]`

**Request** (변경할 필드만 전송) 예: `{ "title": "고객 문의 정리 및 회신" }`, `{ "completed": true }`, `{ "date": "2026-10-22", "dueDate": null }`

**Response 200**: 변경된 할 일 (5.3 응답 형식)

- 수정 가능 필드: `title`, `completed`, `date`, `dueDate`. **필드를 생략하면 유지, `dueDate`를 명시적 `null`로 보내면 마감 해제.** **`date`는 필수라 `null`을 보내면 `400 BAD_REQUEST`** (D-120)
- 배정일(`date`)을 바꾸면 그 할 일은 옮긴 날로 이동하고 원래 날짜 목록에서는 사라진다. 옮긴 날의 할 일이 이미 20개(완료 포함)면 `400 TASK_LIMIT_EXCEEDED`
- `completed: true` → `completedDate` = 오늘(참고용, 노출 기준 아님). 이미 완료된 할 일에 `true`를 다시 보내도 완료일은 유지. `completed: false` → `completedDate` = null. **완료해도 그 할 일은 자기 배정일 목록에 완료로 남는다.**
- 메모 수정은 기록 저장(6.3, 6.4)의 `taskMemos`로 한다 `[제안]` (할 일 수정 API에는 `memo`를 두지 않음)
- 수정 시 `title`도 1~20자. 수정 중 빈 값은 `400 BAD_REQUEST`
- 수정 확정 방식(Enter/완료 버튼)은 프론트 사항
- 잠금 적용 (1.5)
- Errors: `404 TASK_NOT_FOUND`, `400 BAD_REQUEST`, `400 TASK_LIMIT_EXCEEDED`, `409 RECORD_LOCKED`

### 5.5 할 일 삭제 `DELETE /tasks/{taskId}` — HM-08 `[확정]`

- **Response 200** (`data: null`)
- 삭제 전 확인 여부는 프론트 사항
- 해당 할 일의 **메모도 함께 삭제**된다 (메모가 할 일의 컬럼) `[확정]`
- 잠금 적용 (1.5)
- Errors: `404 TASK_NOT_FOUND`, `409 RECORD_LOCKED`

---

## 6. 기록 (Record) — 기록 P-02 / 아카이브 P-03 / 홈 P-01

날짜 하나당 기록(Record)의 **상태**가 하나 있다. 기록 화면은 다음 세 부분으로 구성되며 **별도 API로 조회**한다 (D-108, D-125).

- **상단: 할 일 + 업무별 메모** — `GET /tasks` (5.1). **그날 추가한 할 일만**, 메모는 할 일당 1개 최대 500자
- **중간: 하루 회고** — 날마다 1건, 최대 2,000자. **별도 테이블 `daily_reflections`**(D-124)에 저장하고 `GET /records/{date}/reflection` (6.7)으로 조회 `[확정]`
- **하단: 하루 질문** — TILLY 확장 질문(AI가 만든 최대 3개)과 질문별 답변(최대 1,000자)/건너뜀. `GET /records/{date}/questions` (6.2)
- 하루 회고는 v0.3(D-107)에서 한 번 삭제했다가 **2026-11-24에 다시 추가**했다 (D-124). `reflection` 필드, 회고 글자 수(2,000자), 회고 근거 종류 `REFLECTION`이 모두 되돌아온다. 회고는 **AI 인사이트의 입력·근거**로 쓴다 (D-126)

기록 상태: `NOT_STARTED` → (임시저장) `DRAFT` → (퇴근) `COMPLETED`.
**모든 날짜의 기록을 작성할 수 있다 (과거·미래 포함)** (D-43). 단, 발행된 주의 기록은 잠긴다 (1.5).

### 6.1 기록 상태 요약 `GET /records/{date}/summary` — HM-10, HM-11 `[확정]` (⚠️ 필드 변경)

홈의 "오늘의 기록" 카드와 기록 화면·아카이브 상세의 상태 표시용. 기존 `GET /records/{date}`의 `status`·`locked`·`completedAt`을 흡수한다 (D-108).

**Response 200**
```json
{ "date": "2026-10-21", "status": "DRAFT", "locked": false, "memoCount": 2, "reflectionWritten": true, "completedAt": null }
```

- `memoCount`: **그날(배정일) 할 일** 중 비어 있지 않은 메모 개수.
- `reflectionWritten`: 그날 하루 회고를 썼는지(boolean). 홈 "오늘의 회고 미작성/작성" 문구용(HM-10) `[확정]` (D-125, v0.3에서 삭제했던 필드의 복원)
- `locked`: 해당 주 인사이트가 발행되어 수정 불가인지. 프론트가 읽기 전용 화면으로 전환 `[제안: 필드]`
- `completedAt`: `COMPLETED`일 때 최초 완료 시각, 아니면 `null`
- `COMPLETED`이면 프론트가 칩을 "퇴근 완료", 버튼을 "기록 보기"로 바꾼다.
- 홈 칩에서 `DRAFT`를 어떻게 표시할지는 프론트 결정 대기(HM-10)
- "기록이 없는 날"(`NOT_STARTED`)의 정의: **수동 저장이 없었던 날** `[확정]` D-95. 자동저장된 메모·회고·답변은 저장되어 있을 수 있으며(상태는 `NOT_STARTED`), 페이지를 다시 열 때 `GET /tasks`(메모)·`GET /records/{date}/reflection`(회고)·`GET /records/{date}/questions`(답변)가 그 내용을 돌려준다.

### 6.2 하루 질문 조회 `GET /records/{date}/questions` — RC-05, RC-09, AR-04 `[확정: 분리] / [제안: 경로·응답]` (D-108)

기록 화면 하단과 아카이브 상세에서 쓴다. **폴링 대상**이다 (D-49).

**Response 200**
```json
{
  "date": "2026-10-21",
  "questions": [
    { "id": 501, "order": 1, "text": "보고서 구조를 바꾸기로 한 판단 기준은 무엇이었나요?", "answer": "읽는 사람이 결론을 먼저 보도록 하려고 했다.", "skipped": false }
  ]
}
```

- `questions[].order`는 1~3. 질문이 없으면 빈 배열
- 자동 생성된 질문(6.6)은 이 API로 조회한다. 프론트는 기록 화면이 열려 있는 동안 이 API만 주기적으로 조회(폴링)한다 `[확정]` D-49

> ~~`GET /records/{date}`~~ **폐지** ⚠️ — 할 일+메모는 5.1, 질문·답변은 6.2, 상태·잠금·완료 시각은 6.1로 대체한다.

### 6.3 임시저장 `PUT /records/{date}/draft` — RC-12 `[확정]` (회고 복원 D-124 — v0.3에서 뺐던 `reflection`이 다시 들어감)

현재 입력(메모·회고·답변)을 저장한다. 기록 화면의 **현재 전체 입력 상태**를 보낸다 (전체 교체, D-20).

**Request**
```json
{
  "manual": true,
  "taskMemos": [
    { "taskId": 101, "memo": "초안 구조를 바꿔서 시간이 줄었다." },
    { "taskId": 102, "memo": "" }
  ],
  "reflection": "초안 구조를 바꾼 이유와 배운 점을 정리했다.",
  "answers": [
    { "questionId": 501, "answer": "읽는 사람이 결론을 먼저 보도록 하려고 했다.", "skipped": false },
    { "questionId": 502, "answer": null, "skipped": true }
  ]
}
```

| 규칙 | 상태 |
|---|---|
| 메모는 `tasks.memo`에 저장한다. 빈 문자열/`null` 메모는 "메모 없음"으로 저장 | `[확정]` |
| **`reflection`: 문자열 \| null, 최대 2,000자.** 하루 회고는 `daily_reflections`에 날짜당 1건 저장한다. 전체 교체라 생략·`null`·공백뿐이면 그날 회고를 **삭제**(행 없음) | `[확정]` D-124, D-125 |
| **전체 교체의 범위는 "그날(배정일) 할 일"이다.** `taskMemos`에 없는 그날 할 일의 메모는 **삭제**, 다른 날 할 일의 메모는 **건드리지 않는다** | `[확정]` D-20 보강 (NOTICE-041 ⑤) |
| 글자 수: 메모 500 / 회고 2,000 / 답변 1,000 | `[확정]` |
| 상태: `NOT_STARTED` → `DRAFT`, `DRAFT` 유지, **`COMPLETED`는 `COMPLETED` 유지**(수정 반영) | `[확정]` D-45 |
| `answers[].skipped`: 건너뛰기를 누른 질문은 `true`. 자동으로 다음 질문을 보여주는 것은 프론트 동작 | `[확정]` #10 |
| 마지막 질문에서 건너뛰기 동작, 건너뜀 표시 방식 | 프론트 사항 `[미확정]` |
| 발행된 주 | `409 RECORD_LOCKED` |
| `manual: true`(버튼) → 상태를 `DRAFT`로 전환(`COMPLETED`는 유지). 한 번 `DRAFT`가 되면 이후 `manual: false` 호출로 되돌리지 않음(sticky) | `[확정]` D-95 |
| `manual: false`(자동저장, 내용 변경 시 1~5분 주기 + 페이지 이탈 시 1회를 프론트가 호출) → 내용만 저장, 상태는 그대로 | `[확정]` D-95 |
| `manual` 값과 무관하게 **저장할 내용(메모·회고·답변)이 전부 비어 있고 저장된 적 없는 날**이면 저장하지 않음(기록 행 생성 안 함). 이미 저장된 내용이 있으면 비어 있는 내용으로도 전체 교체되며 상태는 내려가지 않음 | `[확정]` D-95 (회고 복원으로 회고 포함, D-124) |
| "질문 받기"(RC-06, 6.5) 사전 저장은 `manual: false`로 처리 | `[확정]` D-95, D-46 보강 |
| 요청 순서는 프론트가 겹치지 않게 순차 전송하는 방식으로 보장(버전 필드 없음) | `[확정]` D-95 |

**Response 200**
```json
{ "date": "2026-10-21", "status": "DRAFT", "savedAt": "2026-10-21T17:40:00" }
```

**Errors**: `400 BAD_REQUEST`(길이 초과), `404 TASK_NOT_FOUND`/`QUESTION_NOT_FOUND`(그날 할 일이 아니거나 다른 날짜·사용자의 ID), `409 RECORD_LOCKED`

프론트 토스트: "임시저장되었습니다." `[확정]` #12

### 6.4 기록 완료(퇴근) `POST /records/{date}/complete` — RC-13 `[확정]`

현재 입력을 저장하고 상태를 `COMPLETED`로 바꾼다. 요청 본문은 6.3과 동일(`manual` 제외 `[제안]`).

**Response 200**
```json
{ "date": "2026-10-21", "status": "COMPLETED", "completedAt": "2026-10-21T18:05:00", "level": 3 }
```

- 기록이 적거나 질문에 답하지 않아도, **빈 기록이어도** 완료할 수 있다
- 한 트랜잭션으로 처리. 실패하면 아무것도 저장하지 않는다 → 프론트는 연출 없이 오류 팝업 후 기록 화면 유지 (상태예외 시트)
- 이미 `COMPLETED`이면 저장만 갱신하고 **최초 `completedAt`은 유지**한다 (재호출 허용) `[확정]` D-45
- 인사이트 집계에서 **빈 기록도 `COMPLETED`이면 일수에 포함**된다 (D-52)
- **날짜가 처음 `COMPLETED`가 되는 순간 성장 레벨을 재계산**한다 (4.6). 응답의 `level`은 갱신된 값 `[제안: 필드]`
- 발행된 주 `409 RECORD_LOCKED`

### 6.5 확장 질문 받기 `POST /records/{date}/questions` — RC-06 `[확정]`

"질문 받기" 버튼 (**와이어프레임에 추가 필요**, #8). 현재 입력을 함께 받아 먼저 임시저장한 뒤, 저장된 기록을 바탕으로 AI가 질문을 최대 3개 만든다 (D-46).

**Request**: 6.3과 동일한 본문 (현재 입력 전체)

**Response 200**
```json
{
  "questions": [
    { "id": 501, "order": 1, "text": "…", "answer": null, "skipped": false },
    { "id": 502, "order": 2, "text": "…", "answer": null, "skipped": false }
  ]
}
```

| 규칙 | 상태 |
|---|---|
| 본문 입력을 먼저 저장(6.3과 같은 규칙, **`manual: false`로 처리**) | `[확정]` D-95 |
| 이미 질문이 있으면 **기존 질문을 그대로 반환**, 재생성하지 않음 (본문 저장은 수행) | `[확정]` D-47 |
| **질문 생성 조건: 그날 할 일(5.1)이 1개 이상이거나 하루 회고가 있으면 메모가 없어도 생성** | `[확정]` D-127 (D-109 변경) |
| 질문은 최대 3개. 몇 개를 만들지 기준은 AI 프롬프트 사항 | `[확정]` / 프롬프트 `[미확정]` |
| AI 입력: 그날 할 일 제목·완료 여부·메모, 하루 회고 | `[확정]` D-126 |
| 기록에 없는 성과·사실을 만들지 않는다 (8장) | `[확정]` |
| `COMPLETED` 이후에도 질문이 없으면 생성 가능 (인사이트 발행 전까지) | `[제안]` |
| 동기 응답 (프론트는 응답 대기 중 스켈레톤). 응답이 길면 비동기 전환 필요 | `[제안]` AI 연동 후 측정 |

**Errors**
| HTTP | errorCode | 설명 |
|---|---|---|
| 422 | `RECORD_EMPTY` | 그날 할 일도 회고도 없음 (화면: "기록을 작성하면 질문이 생겨요" 문구는 기획 확인). 퇴근은 가능 |
| 502 / 504 | `AI_GENERATION_FAILED` / `AI_TIMEOUT` | 프론트가 질문 카드 안에 "다시 시도" 표시, 퇴근은 그대로 가능 |
| 409 | `RECORD_LOCKED` | |

| 미확정 | 비고 |
|---|---|
| "기록 보완이 필요한가?" 판단 (유저 플로우) | 필요 없으면 질문 없이 완료로 이동. AI 프롬프트 범위 |

### 6.6 자동 질문 생성 (서버 내부 스케줄러) `[확정]`

내부 동작이며 외부 API는 아니다. `record/scheduler`에 둔다 (D-12).

| 규칙 | 상태 |
|---|---|
| 사용자의 퇴근 시간 **10분 전**에 **오늘** 기록을 바탕으로 질문을 자동 생성 | `[확정]` D-48 |
| 매일 실행 (요일 구분 없음) | `[확정]` |
| 퇴근 시간 미설정 사용자는 실행하지 않음 | `[확정]` |
| 생성된 질문은 `GET /records/{date}/questions`로 조회. 별도 알림 API 없음. 프론트 폴링 + 진입 시 조회 | `[확정]` D-49 |
| 퇴근 5분 전 안내는 **프론트의 인앱 안내**. 프론트가 `workEndTime`으로 판단하고 서버 동작은 없음 | `[확정]` D-49 |
| 이미 질문이 있는 날, **그날 할 일도 회고도 없는 날**은 건너뜀 | `[제안]` (D-109 → D-127로 조건 변경) |
| 이미 `COMPLETED`이거나 잠긴 날은 건너뜀 | `[제안]` |
| 서버에 저장된 내용만 사용 (저장 전 입력은 알 수 없음) | 자연스러운 제약 |
| 다중 서버 인스턴스에서 중복 실행 방지 (ShedLock 등) | 구현 사항, 방식은 구현 시 질문 |
| 실행 방식 (매분 배치로 해당 시각 사용자 조회 등) | 구현 시 설계 후 확인 |

### 6.7 하루 회고 조회 `GET /records/{date}/reflection` — RC-05, AR-04 `[확정]` (D-124, D-125)

기록 화면 중간과 아카이브 상세에서 쓴다. 인증 필요. 현재 사용자의 `(user_id, date)` 회고만 조회한다.

**Response 200**
```json
{ "date": "2026-10-21", "reflection": "초안 구조를 바꾼 이유와 배운 점을 정리했다." }
```
회고가 없으면 `"reflection": null`.

| 규칙 | 상태 |
|---|---|
| 하루 회고는 날마다 1건, 최대 2,000자. 테이블 `daily_reflections` (10장) | `[확정]` D-124 |
| 저장은 임시저장·기록 완료 요청의 `reflection`(6.3, 6.4)으로만 한다. 별도 쓰기 API는 두지 않는다 | `[확정]` D-125 |
| 회고만 자동저장(`manual: false`)한 날도 내용은 저장되고 상태는 `NOT_STARTED` 그대로. 아카이브 `hasRecord`는 `DRAFT`·`COMPLETED`일 때만 true (7.1) | `[확정]` D-145 |
| 발행된 주 날짜의 회고는 수정할 수 없다 (1.5) | `[확정]` D-130 |
| 인사이트 입력·근거로 쓰인다 (8장, 9.1) | `[확정: 방향]` D-126 |

---

## 7. 아카이브 P-03

### 7.1 월별 기록 여부 `GET /archive/calendar?year=2026&month=10` — AR-01, AR-02 `[확정]` (⚠️ 응답 변경, D-110)

**Response 200**
```json
{
  "year": 2026,
  "month": 10,
  "days": [
    { "date": "2026-10-01", "hasRecord": false },
    { "date": "2026-10-19", "hasRecord": true },
    { "date": "2026-10-21", "hasRecord": true }
  ]
}
```

- **그 달의 모든 날짜**를 내려주고 **기록 유무(`hasRecord`)만** 전달한다 (D-110). `status`(DRAFT/COMPLETED)는 더 이상 내려주지 않는다 ⚠️
- `hasRecord` = 해당 날짜의 기록 상태가 `DRAFT` 또는 `COMPLETED` `[제안]` (D-95: 수동 임시저장도 "기록한 날". 자동저장만 있는 날은 제외). 상태가 필요하면 6.1
- `month` 범위(1~12) 밖이면 `400 BAD_REQUEST`. 월 경계는 `Asia/Seoul`
- 날짜를 선택하면 5.1(`GET /tasks?date=`) + 6.7(`GET /records/{date}/reflection`) + 6.2(`GET /records/{date}/questions`) + 6.1(`summary`)로 상세 조회. 기록 없는 날의 "기록하러 가기"는 해당 날짜 기록 화면으로 이동 (#13, 프론트)
- 진입 시 기본 선택 날짜는 접속 당일 (#15, 프론트)
- "이 주의 인사이트 보기"(AR-06)는 `GET /insights/weekly?date=` (9.1)
- 날짜별 기록은 인사이트 발행 전까지 수정 가능, 발행 후 읽기 전용 (`locked`)

---

## 8. 외부 AI 연동 공통 규칙

확장 질문(6.5, 6.6)과 주간 인사이트(9.2)가 외부 AI를 호출한다.

**확정** (D-115, D-50 변경): 제공자는 **GPT 계열 무료 모델**이다. **Spring이 `ai/client` 어댑터로 직접 호출**한다(FastAPI 등 별도 AI 서버는 두지 않음). `QuestionGenerator`·`WeeklyInsightGenerator` 포트 인터페이스는 그대로 유지하므로 나중에 어댑터만 교체하면 된다.
**미확정 (사용자가 직접 제공, `NOTICE.md`)**: 모델명, 호출 URL(또는 SDK), API 키, 프롬프트 본문, 타임아웃·재시도 정책, 호출 한도(무료 모델의 rate limit 대응), 입력 데이터의 학습 활용 여부(약관)

**서버가 지켜야 할 원칙**
1. 모든 생성 결과는 **사용자가 입력한 실제 기록에 근거**한다. 기록에 없는 성과·사실을 만들지 않는다 (RC-06, IN-10).
2. **강점과 보완할 부분 모두 근거 기록**(날짜·종류)이 붙는다 (D-60). AI가 반환한 근거 날짜·종류가 실제 해당 주의 기록에 없으면 저장하지 않고 걸러내거나 재시도한다.
3. 보완할 부분은 "부족하다"고 **단정하지 않는다** — "현재 기록만으로는 설명하기 어려운 부분"·"~를 더 기록하면 좋아요" 톤 (IN-07). 기획 문서의 예시 문구('~가 부족해요')는 예시이며 프롬프트 지시로 완화한다 `[확정]` D-113.
4. 인사이트에는 **`COMPLETED` 기록만 반영**하고 `DRAFT`는 제외한다.
5. 개수 (#18): 강점 1~2개, 보완 1~2개, **추천 행동은 보완 하나당 하나**.
6. 추천 행동 문구는 **20자 이내**여야 한다 (다음 할 일 제목이 되므로). 서버가 검증하고 초과 시 재시도, 계속 초과하면 `FAILED` (D-57).
7. 메모·회고·답변이 **하나도 없는 주**는 할 일 제목을 근거로 분석하고, 응답에 기록 부족 경고를 포함한다 (D-54). 이때 근거 종류는 `TASK`가 된다.
8. **인사이트 제목·소제목은 AI가 생성하되, 서버가 계산한 수치(업무 수, 완수율, 전주 대비 증감)를 입력으로 주고 응답의 숫자가 서버 계산값과 일치하는지 서버가 검증한다.** 불일치 시 재시도, 계속 불일치하면 `FAILED`. 지난 주 비교 자료가 없으면 비교 문구를 쓰지 않도록 지시한다 `[확정]` D-112.
9. **하루 회고(D-124)는 AI 입력에 포함**한다: 질문 생성(6.5)과 주간 인사이트(9.2) 모두. 회고도 메모·답변처럼 지시문과 분리해서 전달하고, 근거 칩 종류는 `REFLECTION`이다. 회고의 날짜·종류가 실제 기록에 있는지 서버가 검증한다 (2번). `[확정: 방향]` / `[제안: 입력 형식]` D-126
10. **강점·개선의 판단 기준** `[확정]` D-132 (`KEYWORD_DEFINITIONS.md` 1장): 강점은 역량과 관련된 행동의 근거가 기록에 구체적으로 있을 때만 제시하고 희망 직군의 역량을 우선 보되 억지로 연결하지 않는다. 개선은 역량 부족을 단정하지 않고 STAR 중 약한 부분(상황 디테일 / 핵심 과제 파악 / 행동의 판단 기준·이유 / 성과 수치)을 보완하도록 제안한다. AI 입력에 희망 직군과 선택 역량(정의 포함)을 추가한다 `[제안]` D-133. 강점의 역량 코드·개선의 STAR 구분을 응답 필드로 둘지는 `[미확정]` D-134

**백엔드 구현 원칙**
- AI 응답은 JSON 스키마로 받아 서버에서 검증한다 (개수, 길이, 근거 유효성, 20자, 제목·소제목 숫자).
- 사용자 기록 텍스트는 프롬프트에서 지시문과 분리한다 (prompt injection 방어).
- 호출 타임아웃, 재시도 횟수(무료 모델 한도 초과 시 백오프 포함), 실패 상태 기록을 둔다.
- 로그에 기록 원문을 남기지 않는다.
- 사용자 기록(업무 정보 포함 가능)이 외부 AI 제공자로 전송되므로 고지·동의·학습 활용 여부는 사용자가 확인해야 한다 (`NOTICE.md`, 법무 L-1).

---

## 9. 주간 인사이트 P-04

### 9.1 주간 인사이트 조회 `GET /insights/weekly?date=YYYY-MM-DD` — IN-01, IN-02, IN-04~08 `[확정]`

`date`는 **해당 주에 속한 아무 날짜**다. 서버가 그 날짜가 속한 월~일 주를 계산한다 (`‹ ›` 이동, 아카이브 "이 주의 인사이트 보기" 모두 같은 호출).

**Response 200 — 미발행 (`NOT_PUBLISHED`) 또는 실패 (`FAILED`)**
```json
{
  "weekStart": "2026-10-19",
  "weekEnd": "2026-10-25",
  "weekLabel": "10월 3주차",
  "status": "NOT_PUBLISHED",
  "eligibility": { "eligible": true, "requestable": true, "completedDays": 3, "requiredDays": 3 },
  "report": null
}
```

- `eligible`: 기록 조건 충족(`COMPLETED` 3일 이상이고 분석할 내용이 있음, D-51·D-136) `[확정]`
- `requestable`: **지금 분석을 요청할 수 있는 시점**인지(금요일 기록이 `COMPLETED`가 된 뒤·토·일, D-139). 요청 버튼 노출은 `eligible && requestable`로 판단한다. `weekEnded`는 없다 `[확정]`
- `FAILED`이면 프론트가 실패 안내 후 "분석 요청하기"를 다시 노출 (D-61). 재요청 허용

**Response 200 — 생성 중 (`GENERATING`)**: `eligibility: null`, `report: null`. 프론트가 "기록을 분석 중입니다. 최소 00분이 소요됩니다."를 표시. 소요 시간은 AI 연동 후 측정 `[미확정]`

**Response 200 — 발행 완료 (`PUBLISHED`)**
```json
{
  "weekStart": "2026-10-19",
  "weekEnd": "2026-10-25",
  "weekLabel": "10월 3주차",
  "status": "PUBLISHED",
  "eligibility": null,
  "report": {
    "insightId": 77,
    "generatedAt": "2026-10-26T09:10:00",
    "warnings": [],
    "title": "이번주는 평소보다 더 집중했어요",
    "subtitle": "12개 업무를 기록하며 지난 주 대비 20% 증가한 업무 완수율을 보였어요",
    "summary": { "recordedDays": 4, "memoCount": 7, "reflectionCount": 3, "answerCount": 6 },
    "weeklyAchievement": {
      "totalCount": 12,
      "completedCount": 9,
      "days": [
        { "date": "2026-10-19", "dayOfWeek": "MON", "completedCount": 2, "totalCount": 3 },
        { "date": "2026-10-20", "dayOfWeek": "TUE", "completedCount": 1, "totalCount": 4 },
        { "date": "2026-10-25", "dayOfWeek": "SUN", "completedCount": 0, "totalCount": 0 }
      ]
    },
    "weeklyFlow": [
      { "weekLabel": "10월 1주차", "weekStart": "2026-10-05", "weekEnd": "2026-10-11", "completedCount": 8, "totalCount": 10 },
      { "weekLabel": "10월 2주차", "weekStart": "2026-10-12", "weekEnd": "2026-10-18", "completedCount": 6, "totalCount": 9 },
      { "weekLabel": "10월 3주차", "weekStart": "2026-10-19", "weekEnd": "2026-10-25", "completedCount": 9, "totalCount": 12 }
    ],
    "strengths": [
      {
        "id": 1,
        "title": "비교 기준을 스스로 정리했어요",
        "description": "같은 업무를 반복하며 자료를 비교하기 쉽게 기준을 새로 만든 행동이 두 번 나타났어요.",
        "tags": ["업무 개선 경험"],
        "evidences": [
          { "date": "2026-10-23", "type": "REFLECTION" },
          { "date": "2026-10-22", "type": "QUESTION_ANSWER" },
          { "date": "2026-10-21", "type": "MEMO" }
        ]
      }
    ],
    "improvements": [
      {
        "id": 1,
        "title": "협업 과정을 더 기록하면 좋아요",
        "description": "…",
        "evidences": [ { "date": "2026-10-22", "type": "TASK" } ]
      }
    ],
    "actions": [
      { "id": 1, "improvementId": 1, "text": "회의 후 결정사항 한 줄 메모" }
    ]
  }
}
```

| 필드 | 설명 |
|---|---|
| `weekLabel` | 월요일이 속한 달 기준, 그 달 첫 월요일이 속한 주 = 1주차. 서버가 제공 `[확정]` D-55 (예: 10/26~11/1 → "10월 4주차") |
| `title` / `subtitle` | 인사이트 대표 제목·소제목. **AI가 생성하고 서버가 숫자를 검증**한다 (8장 8번) `[확정]` D-112. 지난 주 비교 자료가 없는 첫 주는 비교 문구가 없다 |
| `summary.recordedDays` | 해당 주 `COMPLETED` 기록 일수 (빈 기록 포함) |
| `summary.memoCount` | 해당 주에 비어 있지 않은 업무별 메모 수(할 일 단위, 같은 할 일은 한 번) `[제안]` |
| `summary.reflectionCount` | 해당 주에 쓴 하루 회고 수(날짜 단위) `[확정]` (D-126, v0.3에서 삭제했던 필드의 복원) |
| `summary.answerCount` | 답변이 있는 확장 질문 수 (건너뜀·빈 답변 제외) `[제안]` |
| `warnings` | `["INSUFFICIENT_CONTENT"]`: 메모·회고·답변이 하나도 없어 할 일 제목만으로 분석함 (D-54). 필드 이름·값은 `[제안]` |
| **`weeklyAchievement`** | **월~일 7일 전체**(토·일 포함)의 업무 달성 현황 `[확정]` D-112. 프론트가 그래프와 "전체 N개 중 M개"를 그린다. 비율 계산은 프론트가 한다 |
| `weeklyAchievement.days[]` | 날짜별 `totalCount`(그날 **배정된** 할 일 수 = 5.1의 `totalCount`) / `completedCount`(그 중 완료한 수 = 5.1의 `completedCount`). `dayOfWeek`: `MON`~`SUN` `[확정]` (D-128, 이월이 없어 단순해짐) |
| `weeklyAchievement.totalCount` / `completedCount` | 그 주(월~일)에 **배정된 할 일 수**(이월이 없으므로 일별 `totalCount`의 합) / 그 중 **완료한 수** `[확정]` (D-128) |
| **`weeklyFlow`** | **이번주 업무 흐름**. 인사이트 발행 주 기준으로 **같은 달의 1주차부터 해당 주차까지**(해당 주 포함) 주별 완료/전체 `[확정]` D-112. 예: 11월 3주차 인사이트 → 11월 1주차, 2주차, 3주차. 주 경계·집계 정의는 `weeklyAchievement`와 같다. 1주차 인사이트면 항목 1개. "같은 달" 기준은 D-55 주차 규칙(월요일이 속한 달)을 따른다 `[제안]` |
| `strengths` | 1~2개. `title`(굵은 제목) + `description`(세부 내용) + **`competencyCode`**(근거가 된 역량 코드, `KEYWORD_DEFINITIONS.md`). `tags`는 `#` 없이 텍스트만 (UI가 `#` 부착). 역량 코드는 희망 직군 역량 우선, 서버가 실제 역량 코드인지 검증 `[확정]` D-134 (구현: `competencyCode`) |
| `strengths[].evidences`, `improvements[].evidences` | 근거 기록 칩. 칩 클릭 시 프론트가 해당 날짜 기록(5.1·6.7·6.2)으로 이동 (IN-06). **강점·보완 모두 포함** `[확정]` D-60 |
| `improvements` | 1~2개. `title` + `description` + 근거 + **`starPart`**(`S`/`T`/`A`/`R`, 보완이 필요한 STAR 단계). 톤은 8장 3번, 판단 기준은 8장 10번 `[확정]` D-134 (구현: `starPart`) |
| `actions` | 보완 하나당 하나. 홈에 보여주기만 하고 할 일로 반영하지 않는다 `[확정(방향)]` (D-147) |

- **스냅샷 저장** `[제안]`: 제목·소제목·`weeklyAchievement`·`weeklyFlow`는 발행 시점의 값을 저장해 그대로 돌려준다(이전 주의 할 일이 나중에 바뀌어도 소제목의 숫자와 어긋나지 않도록). 저장 형태(JSON 컬럼/별도 테이블)는 구현 시 제안.
- 미래 주 조회: `NOT_PUBLISHED` + `requestable: false`로 반환한다(구현됨)
- 화면 분기: 상태예외 시트의 "기록 부족"(기록하러 가기)과 "미발행"(분석 요청하기)은 `eligibility`로 판단할 수 있다. 어느 시점에 어느 화면을 보여줄지는 프론트 사항 `[확인 필요]`

### 9.2 분석 요청 `POST /insights/weekly` — IN-03 `[확정]`

"인사이트 분석 요청하기" 버튼(인사이트 목록 화면 상단 배너: "이번 주의 기록을 인사이트로 만들어 볼까요?"). 사용자가 눌러야만 분석한다 (자동 생성 없음).

**Request** `{ "date": "2026-10-21" }`

**Response 202**
```json
{ "insightId": 77, "weekStart": "2026-10-19", "weekEnd": "2026-10-25", "weekLabel": "10월 3주차", "status": "GENERATING" }
```

| 규칙 | 상태 |
|---|---|
| **금요일(퇴근 후)·토요일·일요일에만 요청 가능하고, 요청한 주(월~일)를 분석한다.** "금요일 퇴근 후"는 **금요일 기록이 `COMPLETED`가 된 뒤**(퇴근 시간 미설정이어도 동일), `Asia/Seoul` 기준. 그 밖의 요일에는 요청할 수 없고 놓친 주는 요청할 수 없다. 요청 날짜 `date`는 그 주 안의 날짜(보통 오늘) | `[확정]` D-139 (D-53 변경) |
| 해당 주 **`COMPLETED` 기록 3일 이상** (빈 기록 포함, 최초 1회 예외 없음) | `[확정]` D-51, D-52 |
| 이미 `PUBLISHED`이면 **재요청 불가** | `[확정]` |
| `GENERATING` 중 재요청이면 기존 건을 그대로 반환 (중복 AI 호출 방지) | `[제안]` |
| `FAILED` 후 재요청 허용 (같은 행을 `GENERATING`으로 되돌림) | `[확정]` |
| 비동기 처리 + 프론트 폴링 (`GET /insights/weekly`) | `[제안]` 소요 시간 확인 후 조정 |
| 주당 인사이트 1건: `(user, weekStart)` 유니크 | `[제안]` |
| 메모·회고·답변이 모두 없는 주도 요청 가능. 할 일 제목 기반으로 분석하고 `warnings`에 경고 | `[확정]` D-54 |
| 요청 시 서버가 주간 수치(`weeklyAchievement`, `weeklyFlow`, 전주 대비 증감)를 계산해 AI 입력으로 전달 | `[확정]` D-112 |
| 요청 시 AI 입력에 해당 주의 **하루 회고**를 날짜별로 함께 전달 | `[확정: 방향]` D-126 |
| **할 일이 0개인 주**: 회고·메모·답변이 하나라도 있으면 분석 허용(`warnings`), 할 일·회고·메모·답변이 모두 없으면 `INSUFFICIENT_RECORDS` | `[확정]` D-136 |
| 발행되면(그리고 `GENERATING` 중에도) 그 주 전체가 잠긴다. 금요일에 요청하면 토·일도 잠김 | `[확정]` D-137, D-139 |

**Errors**
| HTTP | errorCode | 설명 |
|---|---|---|
| 422 | `INSUFFICIENT_RECORDS` | `COMPLETED` 3일 미만, 또는 할 일·회고·메모·답변이 모두 없음. 프론트 "이번 주는 분석할 기록이 아직 부족해요" + 기록하러 가기 |
| 422 | `INSIGHT_NOT_REQUESTABLE` | 요청 가능 시점이 아님(월~목, 또는 금요일 기록이 아직 `COMPLETED`가 아님) (구현됨, 기존 `INSIGHT_WEEK_NOT_ENDED` 대체) |
| 409 | `INSIGHT_ALREADY_PUBLISHED` | 이미 발행된 주 |
| 409 | `RECORD_LOCKED` | (6장 기록·할 일 수정 API) 발행됐거나 `GENERATING`인 주의 기록을 고치려 할 때 |
| 400 | `BAD_REQUEST` | 날짜 형식 오류 |

### 9.3 추천 행동은 업무에 반영하지 않는다 — IN-09 `[확정(방향)]` (D-147, 2026-11-24)

추천 행동은 **홈 화면의 "이번 주 추천 행동" 카드에 보여주기만** 한다(기획 화면 1-1 home, 화면은 기획 '안' 상태). 할 일로 반영하지 않으므로 아래는 **만들지 않는다**.

- `POST /insights/weekly/{insightId}/reflect` (반영 API), 에러 `NO_ACTION_SELECTED`·`ACTION_NOT_FOUND`
- 응답 `actions[].reflected`, 테이블 컬럼 `insight_actions.last_reflected_at`
- 중복 반영, 반영 토스트 문구, 행동 선택 UI(IN-08)

이전 규칙(D-56 반영일, D-58 중복 반영, D-129 응답 형식·20개 제한)은 D-147로 대체했다. 추천 행동을 따로 조회하는 화면이 나중에 생기면 그때 다시 정한다. 추천 행동 문구는 계속 20자 이내로 생성·검증한다(D-57).

### 9.4 홈의 인사이트·추천 행동 카드 `GET /insights/weekly/latest` — HM-12 `[확정: 방식]` · 구현됨(PR #18) (D-140, D-59 변경)

홈 카드는 **가장 최근에 발행된(`PUBLISHED`) 인사이트**를 가리킨다 (지난주 기준 폐기). 경로는 `/insights/weekly/latest`다(이전 `/insights/weekly/last-week` 대체, 구현됨).

**Response 200**
```json
{ "insightId": 77, "weekStart": "2026-10-26", "weekEnd": "2026-11-01", "weekLabel": "10월 4주차", "status": "PUBLISHED", "title": "이번 주는 평소보다 더 집중했어요.", "subtitle": "총 12개의 업무를 기록하며, 지난 주 대비 20% 증가한 업무 완수율을 보였어요.", "actions": [ { "text": "비교 기준 먼저 정의하기" } ] }
```

- `actions`: 가장 최근 발행본의 추천 행동 문구 목록(보완 하나당 하나, 최대 2개). 홈의 "이번 주 추천 행동" 카드에 표시하며 할 일로 반영하지 않는다 `[확정(방향)]` (D-147). 기획 화면에는 1개만 보이므로 몇 개를 보일지는 확인 필요(OPEN_ISSUES Q-19). 홈에 제목·소제목 카드가 있는지도 확인 필요(1-1 home에는 추천 행동 카드만 보임)
- 발행된 인사이트가 하나도 없으면 `status: "NOT_PUBLISHED"`이고 `insightId`·`title`·`subtitle`은 `null`, `actions`는 빈 배열이다. 프론트가 "아직 분석된 내용이 없어요. 분석 요청하기를 눌러주세요."를 표시 (HM-12 답변). 버튼은 인사이트 화면으로 이동
- 이번 주 분석이 `GENERATING`/`FAILED`인 상태는 인사이트 화면(9.1, 9.2)에서 보여 준다. 홈 카드에는 발행본만 나온다 `[제안]`
- 미발행 안내 문구가 세 군데(상태예외 P-04, 확인필요 #4, HM-12 답변)에서 서로 다르다. 프론트 문구 통일 필요
- 기록 3일 미만이어도 이 API는 상태만 반환한다. 부족 안내는 인사이트 화면(9.1 `eligibility`)에서 처리

### 9.5 인사이트 목록 조회 `GET /insights/weekly/list` `[확정]` (D-114 → D-141, 2026-11-24)

기획 화면 `4-1 insight-home`(인사이트 탭 첫 화면): 상단에 "이번 주의 기록을 인사이트로 만들어 볼까요?" 배너와 [분석 요청하기], 아래에 "인사이트 목록"(정렬 드롭다운 "최신순").

**Request** 쿼리 `sort=latest|oldest`(기본 `latest`), `page`(기본 0), `size`(기본 20)

**Response 200**
```json
{
  "items": [
    { "insightId": 77, "weekStart": "2026-11-02", "weekEnd": "2026-11-08", "weekLabel": "11월 1주차", "title": "이번 주는 평소보다 더 집중했어요.", "subtitle": "총 12개의 업무를 기록하며, 지난 주 대비 20% 증가한 업무 완수율을 보였어요." }
  ],
  "page": 0, "size": 20, "totalElements": 1, "hasNext": false
}
```

| 규칙 | 상태 |
|---|---|
| 대상은 **`PUBLISHED`인 주만**. 분석 중·실패한 주는 목록에 없다 (화면에 상태 표시 없음) | `[확정]` D-141 |
| 항목 = 제목·소제목·기간(월~일). 기간은 프론트가 `weekStart`~`weekEnd`로 "2026. 11. 2 - 11. 8"처럼 표기 | `[확정]` D-141 |
| 정렬 최신순(기본)/오래된순, 기준은 `weekStart` | `[확정]` D-141 |
| 20개씩 페이지. 필드명·0 시작 페이지 번호·`totalElements`/`hasNext` 구성은 | `[제안]` |
| 항목 클릭 시 상세 조회: `GET /insights/weekly?date=<weekStart>` (9.1) | `[확정]` 동작 / `[제안]` 호출 형태 |
| 본인 인사이트만 조회 | `[확정]` |

---

## 10. 참고: 논리 데이터 모델 `[제안]`

구현 담당이 설계할 때 참고하는 초안이다. 엔티티 이름과 구조는 스키마 단계(PROMPTS 단계 3)에서 확정한다.

모든 엔티티는 공통 `BaseEntity`를 상속하므로 `created_at`, `updated_at`(`LocalDateTime`) 컬럼을 가진다. 아래 표에서는 생략한다.

| 테이블 | 주요 컬럼 | 비고 |
|---|---|---|
| `users` | id, email, nickname(2~10), work_end_time(nullable), gender(nullable), age(nullable, V7에서 birth_year 대체), current_job_group(nullable), target_job_group(nullable), level(1~9, 기본 1), provider, provider_user_id | `(provider, provider_user_id)` 유니크. 직군·성별은 ENUM을 **문자열**로 저장. 이미 만들어진 `users`에는 마이그레이션으로 컬럼 추가 |
| `user_competencies` | id, user_id, competency(ENUM 문자열) | 유니크 `(user_id, competency)`. 탈퇴 시 `ON DELETE CASCADE`. 직군·역량 ENUM은 코드에서 관리(D-99) |
| `tasks` | id, user_id, title(≤20), **date(NOT NULL, 배정일)**, due_date(nullable, 마감 일시), completed, completed_date(nullable, 참고용), memo(≤500, nullable) | 인덱스 `(user_id, date)`, `(user_id, completed_date)`. 개수 제한(그날 20개, 완료 포함)은 서비스에서 검증. **2026-11-24: `date`를 NOT NULL로 되돌림**(V8, 기존 NULL은 생성일로 채움). 이월이 없어 `date` 하나로 노출·잠금·집계를 판단 |
| `daily_records` | id, user_id, date, status(DRAFT/COMPLETED), completed_at | 유니크 `(user_id, date)`. 행이 없으면 `NOT_STARTED`. **회고는 이 테이블이 아니라 `daily_reflections`에 둔다** (D-124) |
| `daily_reflections` | id, user_id, date, content(≤2,000) | 유니크 `(user_id, date)`, users FK `ON DELETE CASCADE`. 내용이 비면 행을 두지 않는다. `daily_records` 행이 없는 날도 자동저장될 수 있어 `(user_id, date)`로 식별 (V9, D-124) |
| `record_questions` | id, record_id, order(1~3), text, answer(≤1000), skipped | |
| `weekly_insights` | id, user_id, week_start, status, generated_at, warnings, **title, subtitle**, summary 4종 수치(recordedDays, memoCount, reflectionCount, answerCount), **주간 합계(total_count, completed_count)** | 유니크 `(user_id, week_start)` |
| `weekly_insight_daily_stats` | id, insight_id, date, completed_count, total_count | 발행 시점 스냅샷, 7행 `[제안]` (JSON 컬럼 대안) |
| `weekly_insight_flow` | id, insight_id, week_start, week_label, completed_count, total_count | 발행 시점 스냅샷 `[제안]` (JSON 컬럼 대안) |
| `insight_strengths` | id, insight_id, title, description, tags | |
| `insight_improvements` | id, insight_id, title, description | |
| `insight_evidences` | id, strength_id(nullable), improvement_id(nullable), date, type | 강점·보완 모두 근거를 가짐. `type`: MEMO / REFLECTION / QUESTION_ANSWER / TASK |
| `insight_actions` | id, insight_id, improvement_id, text(≤20) | 반영하지 않으므로 반영 이력 컬럼은 두지 않음 (D-147) |

Redis: Refresh Token 저장(`refresh:{userId}`), Access Token 블랙리스트(`blacklist:{jti}`).

---

## 11. v0.3 호환 깨짐 요약 (프론트 영향)

| 변경 | 이전 | 이후 |
|---|---|---|
| 할 일 추가 | `POST /tasks` `{date, title}` | `{title, date?, dueDate?}` (`date` 선택) |
| 할 일 조회 | `GET /tasks?date=` → `{date, items}` | `{date, completedCount, totalCount, completed[], incomplete[]}` (항목에 `date`/`dueDate`/`completedDate`/`memo`/`overdueDays`) |
| 할 일 수정 | `title`/`completed` | + `date`/`dueDate` |
| 기록 상세 | `GET /records/{date}` | **폐지** → `GET /tasks`, `GET /records/{date}/questions`, `GET /records/{date}/summary` |
| 기록 요약 | `{date, status, memoCount, reflectionWritten}` | `{date, status, locked, memoCount, completedAt}` |
| 임시저장·완료 본문 | `{manual, taskMemos, reflection, answers}` | `reflection` 삭제 |
| 기록 완료 응답 | `{date, status, completedAt}` | + `level` |
| 아카이브 달력 | `days: [{date, status}]` (기록 있는 날만) | `days: [{date, hasRecord}]` (그 달 모든 날짜) |
| 닉네임 수정 | `PATCH /users/me/nickname` | **삭제** → `PUT /users/me/profile` |
| 내 정보 | `{nickname, email, workEndTime}` | + `gender`, `birthYear`, `currentJobGroup`, `targetJobGroup`, `competencies`, `level` |
| 가입 | `{signupToken, nickname}` | + `gender?`, `birthYear?` (선택, 호환 유지) |
| 인사이트 조회 | `report.summary.reflectionCount`, 근거 `REFLECTION` | 삭제. `title`/`subtitle`/`weeklyAchievement`/`weeklyFlow` 추가 |
| 행동 반영 | 응답 `{targetDate, createdTasks}` | `{createdTasks}` (배정일·마감일 null) |
| 신규 | | `GET /meta/profile-options`, `GET /insights/weekly/list` |

### v0.4 호환 깨짐 요약 (2026-11-24)

| 변경 | v0.3 | v0.4 |
|---|---|---|
| 할 일 노출 | 이월(배정일 ≤ 조회일인 미완료 계속 노출), 배정일 없음 = 항상 노출, 완료는 완료일 기준 | **그날(배정일) 추가한 할 일만.** 완료/미완료는 같은 날 목록 안에서 나눔 |
| 할 일 `date` | nullable | **필수**(추가 시 생략하면 오늘), PATCH에서 `null` → 400 |
| 마감 표시 | `overdueDays`(조회일 − 마감, 지난 것만 값) | **`dueInDays`**(마감 날짜 − 서버 오늘, 남은 일수도 포함, 음수 = 지남. 완료·마감 없음은 `null`) |
| 할 일 개수 제한 | 처음 보이는 날 기준 20개 | 그날(배정일)별 20개(완료 포함) |
| 과거 날짜 조회 | 그날 시점으로 재구성 | 재구성 없음(현재 상태 그대로) |
| 하루 회고 | 삭제 | **복원**: `PUT draft`·`POST complete` 본문 `reflection`, `GET /records/{date}/reflection`(신규), `summary.reflectionWritten`, 인사이트 `summary.reflectionCount`·근거 `REFLECTION` |
| 질문 받기 조건 | 그날 할 일 1개 이상 | 그날 할 일 1개 이상 **또는 회고 있음** |
| 행동 반영 | `{createdTasks}`(배정일·마감 null) | `{targetDate, createdTasks}`(**반영한 날(오늘) 배정**) |
| `weeklyAchievement` | 노출된 할 일(이월 포함), 완료일 기준 | 배정일 기준(이월 없음) |

---

## 12. 남은 질문 (요약)

상세는 `OPEN_ISSUES.md`, 기획 확인은 `PLANNING_NOTICE.md` 참조. 확정되지 않은 것만 남겼다. (2026-11-24에 대부분 확정: D-119~D-146)

1. 추천 행동은 **홈 표시만** 하고 반영하지 않는다(D-147). 홈에 추천 행동을 몇 개 보일지, 제목·소제목 카드를 홈에 둘지 기획 확인 (Q-19)
2. 마감 D-day 표시 문구, 회고 영역 배치 등 프론트·기획 결정 대기 (PLANNING_NOTICE P-6~P-9, P-18, P-19)
3. 프롬프트 검토·승인(NOTICE-019), 인사이트 AI 입력에 희망 직군·역량 정의를 넣는 방식(D-133 `[제안]`)
4. 성장 레벨 순환 횟수 표시 여부, "기록 하루"를 퇴근 완료한 날로 보는 해석 (4.6 `[제안]`)
5. 외부 AI 전송 고지·동의(법무, NOTICE-012, 출시 전 재확인)
6. CORS 도메인, 구글 `redirect_uri` (NOTICE-018, 015)
