# TILLY API 명세서 (v0.3)

> 기준 문서: `TILLY_기능명세서.xlsx` v0.1 (2026.11.03) + 확인필요 시트 답변 + 2026.11.07~08 사용자 확정 사항 (`DECISIONS.md` D-01~D-95) + **2026.11.12 기획 변경 반영 (`DECISIONS.md` D-96~D-117)**
> 스택: Spring Boot 4.x + Java 21 / Gradle(Groovy) / MySQL + Flyway / Redis
> 작성 원칙: **명세서에 없는 기능은 추가하지 않는다. 근거가 없는 값은 임의로 채우지 않고 `[미확정]`으로 남긴다.**
> 변경 이력: v0.1 초안 → v0.2 (2026.11.08, 사용자 확정 사항 일괄 반영. Base path `/api/v1` → `/api`) → **v0.3 (2026.11.12, 기획 변경 반영: 회원 프로필 확장, 할 일 마감일·배정일 모델, 회고 삭제, 기록 API 분해, 아카이브 달력 단순화, 인사이트 확장, AI 제공자 변경, 인증 구현 내용 반영)**
> v0.3에서 ⚠️ 호환이 깨지는 변경: `POST /tasks`·`GET /tasks`·`PATCH /tasks/{id}` 형식, `GET /records/{date}` 폐지, `reflection` 삭제(`PUT /records/{date}/draft` 본문·summary 응답), `PATCH /users/me/nickname` 삭제, `GET /archive/calendar` 응답, `POST /insights/weekly/{id}/reflect` 응답. 목록은 문서 끝 11장.

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
| 사용자 | 400 | `INVALID_COMPETENCY_SELECTION` | 역량 선택 규칙 위반(공통 역량 1개 미만, 희망 직군 역량 2개 미만, 희망 직군 소속이 아닌 역량 등). 메시지에 사유 `[제안]` |
| 할 일 | 404 | `TASK_NOT_FOUND` | 타 사용자 리소스 접근도 404 (존재 여부 노출 방지) |
| 할 일 | 400 | `TASK_LIMIT_EXCEEDED` | 배정일별 20개 초과 또는 배정일 없는 미완료 20개 초과 (5.3) |
| 기록 | 404 | `QUESTION_NOT_FOUND` | |
| 기록 | 409 | `RECORD_LOCKED` | 해당 주 인사이트가 발행되어 수정 불가 (1.5) |
| 기록 | 422 | `RECORD_EMPTY` | 그날 노출되는 할 일이 하나도 없어 질문 생성 불가 (6.5) |
| AI | 502 | `AI_GENERATION_FAILED` | 외부 AI 호출 실패 (호출 한도 초과 포함 `[제안]`) |
| AI | 504 | `AI_TIMEOUT` | 외부 AI 응답 시간 초과 |
| 인사이트 | 404 | `INSIGHT_NOT_FOUND` / `ACTION_NOT_FOUND` | |
| 인사이트 | 422 | `INSIGHT_WEEK_NOT_ENDED` | 아직 끝나지 않은 주에 분석 요청 |
| 인사이트 | 422 | `INSUFFICIENT_RECORDS` | `COMPLETED` 기록이 3일 미만 |
| 인사이트 | 409 | `INSIGHT_ALREADY_PUBLISHED` | 이미 발행된 주에 재요청 |
| 인사이트 | 400 | `NO_ACTION_SELECTED` | 반영할 행동을 선택하지 않음 |

### 1.4 공통 Enum

| Enum | 값 | 비고 |
|---|---|---|
| `RecordStatus` | `NOT_STARTED`(작성 전) / `DRAFT`(임시저장) / `COMPLETED`(퇴근 완료) | `NOT_STARTED`는 **수동 저장(`manual: true`)이 아직 없었던 상태**를 응답에서 표현한 값(D-95). `DRAFT`는 아카이브에 보이고 인사이트에 **반영하지 않음** |
| `InsightStatus` | `NOT_PUBLISHED` / `GENERATING` / `PUBLISHED` / `FAILED` | `FAILED`: 프론트가 실패 안내 후 분석 요청하기를 다시 노출 `[확정]` |
| `EvidenceType` | `MEMO`(업무별 메모) / `QUESTION_ANSWER`(AI 질문 답변) / `TASK`(할 일 제목) | `REFLECTION`은 회고 삭제(D-107)로 제거. `TASK`는 내용 없는 주(D-54) 때문에 추가 `[제안]` |
| `Gender` | `MALE` / `FEMALE` / `OTHER` | `[임시]` 값. 성별은 선택(null 허용) |
| `JobGroup` | `DEVELOPMENT` / `DESIGN` / `PLANNING` / `MARKETING` / `DATA` | `[임시]` 목록 (`PLANNING_NOTICE.md`). 재직 직군·희망 직군 공용 |
| `CompetencyType` | `COMMON`(공통 역량) / `JOB`(직군별 역량) | |
| `Competency` | 공통 6개 + 직군별 4개×5 = 26개 | `[임시]` 목록 (`PLANNING_NOTICE.md`). 각 상수가 `type`과 소속 `jobGroup`(공통이면 null)을 가진다 (D-99) |

### 1.5 기록 잠금 규칙 `[확정: 원칙] / [제안: 할 일 모델 적용]` (D-44)

- 어떤 날짜가 속한 **주의 인사이트가 `PUBLISHED`이면** 그 주(월~일)의 기록과 할 일은 **수정할 수 없다** → `409 RECORD_LOCKED`. `[확정]`
- 할 일은 배정일(null 허용)·완료일을 가지므로 **"잠긴 할 일"**을 다음으로 정의한다 `[제안]`:
  - **배정일이 잠긴 주에 속하는 할 일**, 또는 **완료일(`completedDate`)이 잠긴 주에 속하는 할 일**
  - 배정일이 null이고 미완료인 할 일은 어느 주에도 속하지 않으므로 잠기지 않는다
- 잠금 대상 동작: 잠긴 할 일의 수정(제목·메모·배정일·마감일)·삭제·완료 토글, **배정일을 잠긴 주 날짜로 두는 추가·수정**, 잠긴 주 날짜의 임시저장·기록 완료·질문 받기.
- 완료 토글은 완료일을 "오늘"로 기록하므로 오늘이 속한 주(아직 발행될 수 없음)에는 영향이 없다. 단 **완료일이 잠긴 주인 할 일을 미완료로 되돌리는 것은 잠금**이다.
- 인사이트 발행 **전**에는 `COMPLETED` 기록과 그날의 할 일도 자유롭게 수정할 수 있다. 수정해도 상태는 `COMPLETED`로 유지되고 최초 완료 시각은 바뀌지 않는다. `[확정]`
- `GENERATING` 중에도 잠글지는 `[확인 필요]` (NOTICE-023). 제안: 입력 데이터를 요청 시점 기준으로 읽어야 하므로 `GENERATING` 중에도 잠금. 답변 전에는 `PUBLISHED`일 때만 잠금.
- 인사이트 반영(9.3)으로 만들어지는 할 일은 배정일이 null이므로 잠금 대상이 아니다.

---

## 2. 기능 ID ↔ API 매핑

| 기능 ID | 기능 | API | 비고 |
|---|---|---|---|
| CM-01, CM-02 | 메뉴 이동, 헤더 | (없음, 프론트 전용) | |
| CM-03 | 프로필 아이콘 | (없음) | 확인필요 #6. 회원 정보 수정은 환경 설정(P-05)의 회원수정 페이지에서 (D-100) |
| HM-01 | 주간 캘린더 표시 | (없음, 프론트 전용) | `[확인 필요]` 표시 기준 주/이동 방식 (프론트 결정 대기) |
| HM-02, HM-03 | 날짜 선택, 체크리스트 | `GET /tasks` | 5.1. 완료/미완료 분리, 개수 필드 |
| HM-04, RC-03 | 완료 체크 | `PATCH /tasks/{taskId}` | 같은 데이터 |
| HM-05 | 할 일 추가 | `POST /tasks` | 배정일·마감일 선택 입력 |
| HM-06, HM-09 | 액션 팝업, 기록하기 | (없음, 프론트 전용) | 팝업 버튼 3개(수정/삭제/기록하기) |
| HM-07 | 수정하기 | `PATCH /tasks/{taskId}` | |
| HM-08 | 삭제하기 | `DELETE /tasks/{taskId}` | |
| HM-10, HM-11 | 기록 상태 표시 | `GET /records/{date}/summary` | 상태·잠금·완료 시각 포함 |
| HM-12 | 최근 인사이트 카드 | `GET /insights/weekly/last-week` | 지난주 기준 `[확정]` |
| RC-01 | 기록 날짜 제목 | (없음, 프론트 전용) | |
| RC-02, RC-05, RC-09 | 업무/메모/답변 조회 | 상단: `GET /tasks` (메모 포함) / 하단: `GET /records/{date}/questions` | 회고 삭제(D-107). 기존 `GET /records/{date}`는 폐지(D-108) |
| RC-04 | 회고 가이드 선택 | (삭제 제안) | 회고가 기획에서 삭제되어 기능 자체가 없어질 것으로 보임 → 기획 확인 (`PLANNING_NOTICE.md`) |
| RC-06 | 확장 질문 생성 | `POST /records/{date}/questions` + 내부 스케줄러 | |
| RC-07 | 질문 넘기기 | (없음, 프론트 전용) | 서버는 `questions[].order`(1~3) 제공 |
| RC-08 | 진행 표시 | (없음) | 확인필요 #9로 **제거 확정** |
| RC-10 | 질문 건너뛰기 | 저장 API의 `skipped` 필드 | |
| RC-11, RC-14 | 하단 안내/고정 바 | (없음, 프론트 전용) | |
| RC-12 | 임시저장 | `PUT /records/{date}/draft` | `manual` 필드 (D-95) |
| RC-13 | 기록 완료 | `POST /records/{date}/complete` | 레벨 갱신 (D-101) |
| AR-01, AR-02 | 월별 캘린더 | `GET /archive/calendar` | 기록 유무만 (D-110) |
| AR-03~05, AR-07 | 날짜별 기록 | `GET /tasks?date=` + `GET /records/{date}/questions` + `GET /records/{date}/summary` | |
| IN-01~02, IN-04~08 | 주간 인사이트 조회 | `GET /insights/weekly` | 제목·소제목·그래프·주차별 흐름 포함 (9.1) |
| IN-03 | 분석 요청 | `POST /insights/weekly` | |
| IN-09 | 다음 주 업무에 반영 | `POST /insights/weekly/{insightId}/reflect` | 마감일·배정일 null (D-111) |
| (신규) | 인사이트 목록 조회 | `GET /insights/weekly/list` | 세부 `[미확정]` (9.5) |
| IN-10 | 분석 근거 원칙 | (API 아님, AI 프롬프트/검증 규칙) | 8장 |
| IN-11 | 리포트 생성 방식 | `POST /insights/weekly` | #16: 분석 요청하기 방식 확정, 자동 생성 없음 |
| ST-01 | 이메일 표시 | `GET /users/me` | 프로필·레벨 포함 |
| ST-02 | 로그아웃 | `POST /auth/logout` | |
| ST-03 | 탈퇴 | `POST /users/me/withdrawal` | 화면 확정: 이메일 입력 후 탈퇴 (D-117) |
| (신규) | 회원 프로필 수정(회원수정 페이지 1) | `PUT /users/me/profile` | 닉네임·성별·출생연도·직군·역량 일괄 (D-100) |
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
| 흐름 | 제공자가 **인가 코드를 프론트로 돌려주고, 프론트가 그 코드를 백엔드로 전송** (D-88). 이미 가입했으면 로그인, **미가입이면 가입 토큰 발급 → 닉네임(+성별·출생연도) 입력으로 가입** → Access/Refresh 발급 |
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
| 가입 | `POST /auth/register` | 불필요 | **`{ "signupToken": "…", "nickname": "2~10자", "gender": "MALE"\|"FEMALE"\|"OTHER"\|null, "birthYear": 2001\|null }`** → `{ "accessToken", "userId" }` + Refresh 쿠키. `gender`·`birthYear`는 **선택(생략·null 허용)이라 닉네임만 보내는 기존 요청도 그대로 동작** (D-97). 실패 `SIGNUP_TOKEN_REQUIRED`/`INVALID_SIGNUP_TOKEN`/`EXPIRED_SIGNUP_TOKEN`(401), 형식 오류 400 |
| 재발급 | `POST /auth/reissue` | 불필요(쿠키+헤더) | (본문 없음, Refresh 쿠키 + `X-Tilly-Client: web`) → `{ "accessToken" }` + Refresh 쿠키 재설정. 사용된 Refresh 재사용 시 `INVALID_REFRESH_TOKEN` |
| 로그아웃 | `POST /auth/logout` | 필요 | `data: null`. Refresh 쿠키 삭제 + Access 무효화 (4.5) |
| 개발용 | `POST /auth/dev-login` | 불필요 | `local` 전용 |

`gender`·`birthYear` 검증: 4.2의 프로필 규칙과 같다. 출생연도 범위는 `[임시]` 1950~올해(`Clock` 기준).

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
  "birthYear": 2001,
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
| `birthYear` | number \| null | 선택 항목. 저장은 출생연도, 나이 표시는 프론트 `[제안]` |
| `currentJobGroup` | enum \| null | 재직(현재 인턴) 직군. 선택 항목 |
| `targetJobGroup` | enum \| null | 희망 직군. 선택 항목 |
| `competencies` | enum[] | 얻고 싶은 역량(공통+희망 직군). **비어 있으면 프로필 입력(2단계) 전**으로 프론트가 판단 `[제안]` |
| `level` | number | 성장 레벨 1~9 (4.6). 레벨별 이미지(흙, 새싹…)는 프론트가 매핑 |

### 4.2 프로필 수정 `PUT /users/me/profile` `[확정: 동작] / [제안: 경로·필드명]` (D-100)

회원수정 페이지 1과 **가입 직후 프로필 입력(2단계)**에서 같은 API를 쓴다. **전체 교체** 방식이며 선택 항목은 `null`/생략이 "해제"다. 기존 `PATCH /users/me/nickname`은 **삭제**되었다 ⚠️.

**Request**
```json
{
  "nickname": "새닉네임",
  "gender": "FEMALE",
  "birthYear": 2001,
  "currentJobGroup": "DEVELOPMENT",
  "targetJobGroup": "DESIGN",
  "competencies": ["COMMUNICATION", "DSN_UX", "DSN_PROTOTYPING"]
}
```

**Response 200**: 4.1과 같은 형식(수정 후 전체 프로필)

| 규칙 | 상태 |
|---|---|
| `nickname` 필수, 2~10자, 중복 허용 | `[확정]` D-35 |
| `gender`, `birthYear`, `currentJobGroup`, `targetJobGroup` 선택(null 허용). 직군은 `JobGroup` 값 | `[확정]` |
| **공통 역량(`type=COMMON`) 1개 이상 필수** | `[확정]` |
| **`targetJobGroup`을 선택한 경우, 그 직군 소속 역량(`type=JOB`, `jobGroup=targetJobGroup`) 2개 이상 필수** | `[확정]` D-98 |
| `targetJobGroup`이 null이면 직군 소속 역량은 선택할 수 없다(0개) | `[제안]` |
| 직군 역량은 반드시 `targetJobGroup` 소속이어야 한다. 희망 직군을 바꾸면 새 직군 기준으로 다시 보내야 한다 | `[제안]` |
| 중복 역량 불가, 존재하지 않는 값은 400 | `[제안]` |
| 역량 **최대 선택 개수** | `[미확정]` (기획 확인) |
| `birthYear` 범위 1950~올해 | `[임시]` |

**Errors**: `400 BAD_REQUEST`(형식), `400 INVALID_COMPETENCY_SELECTION`(역량 규칙 위반)

### 4.3 프로필 선택지 `GET /meta/profile-options` `[확정: 존재] / [제안: 경로·응답]` (D-99)

직군·역량·성별 키워드는 코드의 ENUM으로 관리하고(`JobGroup`, `Competency`, `Gender`), 프론트에는 이 API로 선택지를 내려준다. 인증 필요. 표시 문구(`label`)는 서버 ENUM이 가진다 `[임시]`.

**Response 200**
```json
{
  "genders": [ { "code": "MALE", "label": "남성" } ],
  "jobGroups": [ { "code": "DESIGN", "label": "디자인" } ],
  "competencies": [
    { "code": "COMMUNICATION", "label": "의사소통", "type": "COMMON", "jobGroup": null },
    { "code": "DSN_UX", "label": "사용자 경험 설계", "type": "JOB", "jobGroup": "DESIGN" }
  ],
  "selectionRules": { "commonMin": 1, "jobMin": 2 }
}
```

- 전체 목록은 `PLANNING_NOTICE.md`의 `[임시]` 표를 따른다. 기획 확정 시 ENUM만 교체한다.

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

### 4.6 성장 레벨 `[확정: 방식] / [임시: 구간 값]` (D-101)

| 규칙 | 상태 |
|---|---|
| `users.level` 컬럼에 1~9로 저장. 가입 직후 1 | `[확정]` |
| 기준: **`COMPLETED` 기록 누적 일수**(서로 다른 날짜 수) | `[확정]` (기획 확정 시 변경될 수 있음) |
| **기록 완료(`POST /records/{date}/complete`)로 날짜가 처음 `COMPLETED`가 될 때** 재계산해 갱신 | `[확정]` |
| 레벨은 내려가지 않는다 (기록을 수정해도 유지) | `[확정]` |
| 구간 임계값 | `[임시]` 아래 표 |

| 레벨 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 누적 `COMPLETED` 일수(이상) | 0 | 1 | 3 | 7 | 14 | 30 | 60 | 100 | 150 |

- 임계값은 설정/상수 한곳에서만 관리한다. 레벨별 이미지(흙→새싹…)는 프론트가 `level`로 매핑한다.

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

### 5.0 할 일 모델 `[확정]` (D-102~D-106)

| 필드 | 타입 | 설명 |
|---|---|---|
| `id` | number | |
| `title` | string | 앞뒤 공백 제거 후 1~20자 |
| `date` | string \| null | **배정일.** 이 날부터 목록에 노출된다. `null`이면 조회 날짜와 무관하게 미완료인 동안 항상 노출 |
| `dueDate` | string \| null | **마감일.** 표시·지연 판단용(노출 여부에는 영향 없음). `null` 허용 |
| `completed` | boolean | |
| `completedDate` | string \| null | **완료한 날**(서버가 완료 토글 시점의 "오늘"로 기록, 미완료로 되돌리면 `null`). 그날 완료로 기록되어 그날 목록에 남는다 |
| `memo` | string \| null | 업무별 메모, 최대 500자. 없으면 `null` |
| `overdueDays` | number \| null | **조회 응답에서만** 계산: `dueDate`가 있고 미완료이며 조회일이 마감일보다 뒤이면 `조회일 − dueDate`(일 수), 아니면 `null`. 프론트가 "D+4"로 표기 `[제안: 필드명]` |

- `dueDate`는 `date`가 있으면 `date` 이후(같은 날 허용)여야 한다 `[제안]`.

### 5.1 할 일 목록 `GET /tasks?date=YYYY-MM-DD` — HM-02, HM-03, RC-02 `[확정]` (D-103~D-105)

`date`를 생략하면 오늘(`Asia/Seoul`). 홈 체크리스트와 기록 화면 상단(할 일+메모), 아카이브 날짜 상세가 모두 이 API를 쓴다.

**Response 200**
```json
{
  "date": "2026-10-21",
  "completedCount": 2,
  "totalCount": 5,
  "completed": [
    { "id": 101, "title": "주간 보고서 작성", "date": "2026-10-21", "dueDate": "2026-10-21", "completed": true, "completedDate": "2026-10-21", "memo": "초안 구조를 바꿔서 시간이 줄었다.", "overdueDays": null }
  ],
  "incomplete": [
    { "id": 102, "title": "고객 문의 정리", "date": "2026-10-17", "dueDate": "2026-10-17", "completed": false, "completedDate": null, "memo": null, "overdueDays": 4 },
    { "id": 120, "title": "회의 후 결정사항 한 줄 메모", "date": null, "dueDate": null, "completed": false, "completedDate": null, "memo": null, "overdueDays": null }
  ]
}
```

**노출 규칙** (조회일 = D)

| 목록 | 조건 |
|---|---|
| `completed` | `completedDate = D` (**완료일 기준으로만**) |
| `incomplete` | **D 시점에 아직 끝나지 않은** 할 일 중 — 배정일이 있으면 `date ≤ D`(이월 포함), 배정일이 null이면 생성일 ≤ D(항상 노출). 여기서 "D 시점에 끝나지 않음" = `completedDate`가 null이거나 `completedDate > D` |

- **지난 마감도 계속 노출**하고 `overdueDays`로 지연을 표시한다 (D-104). 마감일은 노출 여부에 영향이 없다. 배정일 > D인 할 일은 노출하지 않는다.
- 과거 날짜(D < 오늘)는 **그날 시점의 상태로 재구성**한다(`completedDate > D`이면 그날엔 미완료였던 것으로 취급). `[제안]` — 완료를 미완료로 되돌리면 `completedDate`가 지워져 그 이력은 남지 않는다.
- `completedCount` = `completed` 개수, `totalCount` = `completed` + `incomplete` 개수. **각각 필드로 내려주고 "2/5" 표기는 프론트가 처리** `[확정]` D-105.
- 정렬: 각 목록 내 생성 순서(`id` 오름차순) `[제안]`. 빈 목록이면 `[]`.
- 메모: 이월되어 여러 날 노출되어도 같은 메모가 보인다(할 일당 메모 1개).

### 5.2 주간 캘린더 `[확인 필요]` (HM-01)

표시 기준 주, 선택 날짜 강조, 주 이동 방식은 프론트 결정 대기(#2)다. 서버는 `date`를 받는 `GET /tasks`만 제공한다. 확정 후 필요하면 주 단위 조회를 추가한다.

### 5.3 할 일 추가 `POST /tasks` — HM-05 `[확정]` (⚠️ 요청·응답 형식 변경)

**Request** `{ "title": "고객 문의 정리", "date": "2026-10-21", "dueDate": "2026-10-23" }` — `date`·`dueDate`는 생략하거나 `null`이면 "없음"

**Response 201** `{ "id": 103, "title": "고객 문의 정리", "date": "2026-10-21", "dueDate": "2026-10-23", "completed": false, "completedDate": null, "memo": null }`

| 규칙 | 상태 |
|---|---|
| `title`: 앞뒤 공백 제거 후 **1~20자** | `[확정]` |
| 입력은 Enter로 확정, 빈 값이면 해당 행 자동 삭제 | `[확정]` 프론트 동작. 서버는 빈 값을 `400 BAD_REQUEST`로 거절 |
| **개수 제한: 배정일별 20개 + 배정일이 null인 미완료 20개(별도)** | `[확정]` D-102. 초과 시 `400 TASK_LIMIT_EXCEEDED` |
| 배정일 개수는 그 배정일의 할 일 전체(완료 포함), null은 **미완료만** 센다 | `[제안]` |
| 배정일·마감일 입력 가능 날짜 | `[확정]` 제한 없음 (과거·미래·주말 모두) |
| `dueDate` ≥ `date` | `[제안]` 위반 시 `400 BAD_REQUEST` |
| 배정일이 발행된 주에 속함 | `409 RECORD_LOCKED` (1.5) |

### 5.4 할 일 수정 / 완료 토글 `PATCH /tasks/{taskId}` — HM-04, HM-07, RC-03 `[확정]`

**Request** (변경할 필드만 전송) 예: `{ "title": "고객 문의 정리 및 회신" }`, `{ "completed": true }`, `{ "date": "2026-10-22", "dueDate": null }`

**Response 200**: 변경된 할 일 (5.3 응답 형식)

- 수정 가능 필드: `title`, `completed`, `date`, `dueDate`. **필드를 생략하면 유지, `date`/`dueDate`를 명시적 `null`로 보내면 해제** `[제안]`
- `completed: true` → `completedDate` = 오늘. 이미 완료된 할 일에 `true`를 다시 보내도 완료일은 유지. `completed: false` → `completedDate` = null
- 메모 수정은 기록 저장(6.3, 6.4)의 `taskMemos`로 한다 `[제안]` (할 일 수정 API에는 `memo`를 두지 않음)
- 수정 시 `title`도 1~20자. 수정 중 빈 값은 `400 BAD_REQUEST`. 배정일을 바꿀 때도 5.3의 개수 제한을 적용한다
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

날짜 하나당 기록(Record)의 **상태**가 하나 있다. 기록 화면은 다음 두 부분으로 구성되며 **별도 API로 조회**한다 (D-108).

- **상단: 할 일 + 업무별 메모** — `GET /tasks` (5.1). 메모는 할 일당 1개, 최대 500자
- **하단: 하루 질문** — TILLY 확장 질문(AI가 만든 최대 3개)과 질문별 답변(최대 1,000자)/건너뜀. `GET /records/{date}/questions` (6.2)
- ~~하루 회고~~ : **기획에서 삭제**되었다 (D-107). `reflection` 필드, 회고 글자 수(2,000자), 회고 근거 종류는 모두 제거

기록 상태: `NOT_STARTED` → (임시저장) `DRAFT` → (퇴근) `COMPLETED`.
**모든 날짜의 기록을 작성할 수 있다 (과거·미래 포함)** (D-43). 단, 발행된 주의 기록은 잠긴다 (1.5).

### 6.1 기록 상태 요약 `GET /records/{date}/summary` — HM-10, HM-11 `[확정]` (⚠️ 필드 변경)

홈의 "오늘의 기록" 카드와 기록 화면·아카이브 상세의 상태 표시용. 기존 `GET /records/{date}`의 `status`·`locked`·`completedAt`을 흡수한다 (D-108).

**Response 200**
```json
{ "date": "2026-10-21", "status": "DRAFT", "locked": false, "memoCount": 2, "completedAt": null }
```

- `memoCount`: **그날 노출되는 할 일(5.1 규칙)** 중 비어 있지 않은 메모 개수. (`reflectionWritten`은 삭제 ⚠️)
- `locked`: 해당 주 인사이트가 발행되어 수정 불가인지. 프론트가 읽기 전용 화면으로 전환 `[제안: 필드]`
- `completedAt`: `COMPLETED`일 때 최초 완료 시각, 아니면 `null`
- `COMPLETED`이면 프론트가 칩을 "퇴근 완료", 버튼을 "기록 보기"로 바꾼다.
- 홈 칩에서 `DRAFT`를 어떻게 표시할지는 프론트 결정 대기(HM-10)
- "기록이 없는 날"(`NOT_STARTED`)의 정의: **수동 저장이 없었던 날** `[확정]` D-95. 자동저장된 메모·답변은 저장되어 있을 수 있으며(상태는 `NOT_STARTED`), 페이지를 다시 열 때 `GET /tasks`(메모)·`GET /records/{date}/questions`(답변)가 그 내용을 돌려준다.

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

### 6.3 임시저장 `PUT /records/{date}/draft` — RC-12 `[확정]` (⚠️ `reflection` 삭제)

현재 입력(메모·답변)을 저장한다. 기록 화면의 **현재 전체 입력 상태**를 보낸다 (전체 교체, D-20).

**Request**
```json
{
  "manual": true,
  "taskMemos": [
    { "taskId": 101, "memo": "초안 구조를 바꿔서 시간이 줄었다." },
    { "taskId": 102, "memo": "" }
  ],
  "answers": [
    { "questionId": 501, "answer": "읽는 사람이 결론을 먼저 보도록 하려고 했다.", "skipped": false },
    { "questionId": 502, "answer": null, "skipped": true }
  ]
}
```

| 규칙 | 상태 |
|---|---|
| 메모는 `tasks.memo`에 저장한다. 빈 문자열/`null` 메모는 "메모 없음"으로 저장 | `[확정]` |
| **전체 교체의 범위는 "그날 노출되는 할 일(5.1 규칙)"이다.** `taskMemos`에 없는 노출 할 일의 메모는 **삭제**, 노출되지 않는 할 일의 메모는 **건드리지 않는다**(이월·완료 할 일의 메모 보호) | `[제안]` D-20 보강 |
| 글자 수: 메모 500 / 답변 1,000 | `[확정]` |
| 상태: `NOT_STARTED` → `DRAFT`, `DRAFT` 유지, **`COMPLETED`는 `COMPLETED` 유지**(수정 반영) | `[확정]` D-45 |
| `answers[].skipped`: 건너뛰기를 누른 질문은 `true`. 자동으로 다음 질문을 보여주는 것은 프론트 동작 | `[확정]` #10 |
| 마지막 질문에서 건너뛰기 동작, 건너뜀 표시 방식 | 프론트 사항 `[미확정]` |
| 발행된 주 | `409 RECORD_LOCKED` |
| `manual: true`(버튼) → 상태를 `DRAFT`로 전환(`COMPLETED`는 유지). 한 번 `DRAFT`가 되면 이후 `manual: false` 호출로 되돌리지 않음(sticky) | `[확정]` D-95 |
| `manual: false`(자동저장, 내용 변경 시 1~5분 주기 + 페이지 이탈 시 1회를 프론트가 호출) → 내용만 저장, 상태는 그대로 | `[확정]` D-95 |
| `manual` 값과 무관하게 **저장할 내용(메모·답변)이 전부 비어 있고 저장된 적 없는 날**이면 저장하지 않음(기록 행 생성 안 함). 이미 저장된 내용이 있으면 비어 있는 내용으로도 전체 교체되며 상태는 내려가지 않음 | `[확정]` D-95 (`reflection` 제외로 정리) |
| "질문 받기"(RC-06, 6.5) 사전 저장은 `manual: false`로 처리 | `[확정]` D-95, D-46 보강 |
| 요청 순서는 프론트가 겹치지 않게 순차 전송하는 방식으로 보장(버전 필드 없음) | `[확정]` D-95 |

**Response 200**
```json
{ "date": "2026-10-21", "status": "DRAFT", "savedAt": "2026-10-21T17:40:00" }
```

**Errors**: `400 BAD_REQUEST`(길이 초과), `404 TASK_NOT_FOUND`/`QUESTION_NOT_FOUND`(그날 노출되지 않는 할 일이거나 다른 날짜·사용자의 ID), `409 RECORD_LOCKED`

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
| **질문 생성 조건: 그날 노출되는 할 일(5.1)이 1개 이상이면 메모가 없어도 생성** | `[확정]` D-109 |
| 질문은 최대 3개. 몇 개를 만들지 기준은 AI 프롬프트 사항 | `[확정]` / 프롬프트 `[미확정]` |
| AI 입력: 그날 노출되는 할 일 제목·완료 여부·메모 | `[제안]` |
| 기록에 없는 성과·사실을 만들지 않는다 (8장) | `[확정]` |
| `COMPLETED` 이후에도 질문이 없으면 생성 가능 (인사이트 발행 전까지) | `[제안]` |
| 동기 응답 (프론트는 응답 대기 중 스켈레톤). 응답이 길면 비동기 전환 필요 | `[제안]` AI 연동 후 측정 |

**Errors**
| HTTP | errorCode | 설명 |
|---|---|---|
| 422 | `RECORD_EMPTY` | 그날 노출되는 할 일이 하나도 없음 (화면: "기록을 작성하면 질문이 생겨요" 문구는 기획 확인). 퇴근은 가능 |
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
| 이미 질문이 있는 날, **그날 노출되는 할 일이 하나도 없는 날**은 건너뜀 | `[제안]` (D-109로 조건 변경) |
| 이미 `COMPLETED`이거나 잠긴 날은 건너뜀 | `[제안]` |
| 서버에 저장된 내용만 사용 (저장 전 입력은 알 수 없음) | 자연스러운 제약 |
| 다중 서버 인스턴스에서 중복 실행 방지 (ShedLock 등) | 구현 사항, 방식은 구현 시 질문 |
| 실행 방식 (매분 배치로 해당 시각 사용자 조회 등) | 구현 시 설계 후 확인 |

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
- 날짜를 선택하면 5.1(`GET /tasks?date=`) + 6.2(`GET /records/{date}/questions`) + 6.1(`summary`)로 상세 조회. 기록 없는 날의 "기록하러 가기"는 해당 날짜 기록 화면으로 이동 (#13, 프론트)
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
7. 메모·답변이 **하나도 없는 주**는 할 일 제목을 근거로 분석하고, 응답에 기록 부족 경고를 포함한다 (D-54). 이때 근거 종류는 `TASK`가 된다.
8. **인사이트 제목·소제목은 AI가 생성하되, 서버가 계산한 수치(업무 수, 완수율, 전주 대비 증감)를 입력으로 주고 응답의 숫자가 서버 계산값과 일치하는지 서버가 검증한다.** 불일치 시 재시도, 계속 불일치하면 `FAILED`. 지난 주 비교 자료가 없으면 비교 문구를 쓰지 않도록 지시한다 `[확정]` D-112.

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
  "eligibility": { "eligible": true, "completedDays": 3, "requiredDays": 3, "weekEnded": true },
  "report": null
}
```

- `eligible`: `weekEnded`가 `true`이고 `completedDays >= requiredDays(3)`
- `FAILED`이면 프론트가 실패 안내 후 "분석 요청하기"를 다시 노출 (D-61). 재요청 허용

**Response 200 — 생성 중 (`GENERATING`)**: `report: null`. 프론트가 "기록을 분석 중입니다. 최소 00분이 소요됩니다."를 표시. 소요 시간은 AI 연동 후 측정 `[미확정]`

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
    "summary": { "recordedDays": 4, "memoCount": 7, "answerCount": 6 },
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
          { "date": "2026-10-23", "type": "QUESTION_ANSWER" },
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
      { "id": 1, "improvementId": 1, "text": "회의 후 결정사항 한 줄 메모", "reflected": false }
    ]
  }
}
```

| 필드 | 설명 |
|---|---|
| `weekLabel` | 월요일이 속한 달 기준, 그 달 첫 월요일이 속한 주 = 1주차. 서버가 제공 `[확정]` D-55 (예: 10/26~11/1 → "10월 4주차") |
| `title` / `subtitle` | 인사이트 대표 제목·소제목. **AI가 생성하고 서버가 숫자를 검증**한다 (8장 8번) `[확정]` D-112. 지난 주 비교 자료가 없는 첫 주는 비교 문구가 없다 |
| `summary.recordedDays` | 해당 주 `COMPLETED` 기록 일수 (빈 기록 포함) |
| `summary.memoCount` | 해당 주에 비어 있지 않은 업무별 메모 수(할 일 단위, 같은 할 일은 한 번) `[제안]`. `reflectionCount`는 삭제 ⚠️ |
| `summary.answerCount` | 답변이 있는 확장 질문 수 (건너뜀·빈 답변 제외) `[제안]` |
| `warnings` | `["INSUFFICIENT_CONTENT"]`: 메모·답변이 하나도 없어 할 일 제목만으로 분석함 (D-54). 필드 이름·값은 `[제안]` |
| **`weeklyAchievement`** | **월~일 7일 전체**(토·일 포함)의 업무 달성 현황 `[확정]` D-112. 프론트가 그래프와 "전체 N개 중 M개"를 그린다. 비율 계산은 프론트가 한다 |
| `weeklyAchievement.days[]` | 날짜별 `completedCount`(그날 완료한 할 일 수 = 완료일이 그날) / `totalCount`(그날 노출된 할 일 수 = 5.1의 `totalCount`). `dayOfWeek`: `MON`~`SUN` |
| `weeklyAchievement.totalCount` / `completedCount` | 그 주(월~일)에 **한 번이라도 노출된 서로 다른 할 일 수(이월 포함)** / 그 주에 **완료일이 속한 할 일 수** |
| **`weeklyFlow`** | **이번주 업무 흐름**. 인사이트 발행 주 기준으로 **같은 달의 1주차부터 해당 주차까지**(해당 주 포함) 주별 완료/전체 `[확정]` D-112. 예: 11월 3주차 인사이트 → 11월 1주차, 2주차, 3주차. 주 경계·집계 정의는 `weeklyAchievement`와 같다. 1주차 인사이트면 항목 1개. "같은 달" 기준은 D-55 주차 규칙(월요일이 속한 달)을 따른다 `[제안]` |
| `strengths` | 1~2개. `title`(굵은 제목) + `description`(세부 내용). `tags`는 `#` 없이 텍스트만 (UI가 `#` 부착). 태그 종류·생성 기준은 AI 프롬프트 사항 |
| `strengths[].evidences`, `improvements[].evidences` | 근거 기록 칩. 칩 클릭 시 프론트가 해당 날짜 기록(5.1·6.2)으로 이동 (IN-06). **강점·보완 모두 포함** `[확정]` D-60 |
| `improvements` | 1~2개. `title` + `description` + 근거. 톤은 8장 3번 |
| `actions` | 보완 하나당 하나. `reflected`: 한 번이라도 다음 주 업무에 반영한 적이 있는지(참고용) `[제안]` |

- **스냅샷 저장** `[제안]`: 제목·소제목·`weeklyAchievement`·`weeklyFlow`는 발행 시점의 값을 저장해 그대로 돌려준다(이전 주의 할 일이 나중에 바뀌어도 소제목의 숫자와 어긋나지 않도록). 저장 형태(JSON 컬럼/별도 테이블)는 구현 시 제안.
- 미래 주 조회: 제안 `NOT_PUBLISHED` + `eligible: false`(`weekEnded: false`) 반환 `[제안]`
- 화면 분기: 상태예외 시트의 "기록 부족"(기록하러 가기)과 "미발행"(분석 요청하기)은 `eligibility`로 판단할 수 있다. 어느 시점에 어느 화면을 보여줄지는 프론트 사항 `[확인 필요]`

### 9.2 분석 요청 `POST /insights/weekly` — IN-03 `[확정]`

"인사이트 분석 요청하기" 버튼. 사용자가 눌러야만 분석한다 (일요일 자동 생성 없음).

**Request** `{ "date": "2026-10-21" }`

**Response 202**
```json
{ "insightId": 77, "weekStart": "2026-10-19", "weekEnd": "2026-10-25", "weekLabel": "10월 3주차", "status": "GENERATING" }
```

| 규칙 | 상태 |
|---|---|
| **주가 끝난 뒤에만** 요청 가능 (해당 주의 일요일이 지난 후, `Asia/Seoul` 기준) | `[확정]` D-53 |
| 해당 주 **`COMPLETED` 기록 3일 이상** (빈 기록 포함, 최초 1회 예외 없음) | `[확정]` D-51, D-52 |
| 이미 `PUBLISHED`이면 **재요청 불가** | `[확정]` |
| `GENERATING` 중 재요청이면 기존 건을 그대로 반환 (중복 AI 호출 방지) | `[제안]` |
| `FAILED` 후 재요청 허용 (같은 행을 `GENERATING`으로 되돌림) | `[확정]` |
| 비동기 처리 + 프론트 폴링 (`GET /insights/weekly`) | `[제안]` 소요 시간 확인 후 조정 |
| 주당 인사이트 1건: `(user, weekStart)` 유니크 | `[제안]` |
| 메모·답변이 모두 없는 주도 요청 가능. 할 일 제목 기반으로 분석하고 `warnings`에 경고 | `[확정]` D-54 |
| 요청 시 서버가 주간 수치(`weeklyAchievement`, `weeklyFlow`, 전주 대비 증감)를 계산해 AI 입력으로 전달 | `[확정]` D-112 |
| **노출된 할 일이 0개인 주**(COMPLETED 3일 이상이지만 분석할 할 일이 없음)의 처리 | `[미확정]` (OPEN_ISSUES Q-13) |

**Errors**
| HTTP | errorCode | 설명 |
|---|---|---|
| 422 | `INSUFFICIENT_RECORDS` | `COMPLETED` 3일 미만. 프론트 "이번 주는 분석할 기록이 아직 부족해요" + 기록하러 가기 |
| 422 | `INSIGHT_WEEK_NOT_ENDED` | 아직 끝나지 않은 주 |
| 409 | `INSIGHT_ALREADY_PUBLISHED` | |
| 400 | `BAD_REQUEST` | 날짜 형식 오류 |

### 9.3 다음 주 업무에 반영 `POST /insights/weekly/{insightId}/reflect` — IN-09 `[확정]` (⚠️ 응답 변경, D-111)

선택한 추천 행동을 **할 일로 추가**한다. 행동 선택/해제(IN-08)는 프론트 상태이며, "반영하기" 호출 시점에 선택한 ID를 전달한다.

**Request** `{ "actionIds": [1, 2] }`

**Response 200**
```json
{
  "createdTasks": [
    { "id": 210, "title": "회의 후 결정사항 한 줄 메모", "date": null, "dueDate": null, "completed": false, "completedDate": null, "memo": null }
  ]
}
```

| 규칙 | 상태 |
|---|---|
| **생성되는 할 일은 배정일(`date`)·마감일(`dueDate`)이 모두 null** → 조회 날짜와 무관하게 완료할 때까지 항상 노출 (5.1). 기존 "다음 주 월요일 날짜 지정"(D-56)은 폐기 | `[확정]` D-111 |
| **중복 반영 허용**: 같은 행동을 다시 반영하면 새 할 일이 또 생긴다 | `[확정]` D-58 (변경 언급 없어 유지) |
| 할 일 제목 = 추천 행동 문구 (20자 이내가 보장됨, 8장 6번) | `[확정]` |
| 전부 성공하거나 전부 실패 (트랜잭션) | `[제안]` |
| 배정일 null 미완료가 이미 20개이고 반영으로 초과하면 `400 TASK_LIMIT_EXCEEDED`로 전체 실패 | `[제안]` (D-102) |
| 프론트 토스트 문구 "다음 주 월요일 체크리스트에 반영되었습니다." | 반영 날짜 개념이 바뀌어 **문구 변경 필요** → 기획 확인 (`PLANNING_NOTICE.md`) |
| 선택 0개: 서버는 `400 NO_ACTION_SELECTED`. 화면에서는 이동/나가기로 처리 | `[확정]` #19 (프론트) |
| 이 API가 만든 할 일은 배정일이 없어 잠금 대상이 아님 (1.5) | `[제안]` |

**Errors**: `400 NO_ACTION_SELECTED`, `404 INSIGHT_NOT_FOUND`/`ACTION_NOT_FOUND`, `400 TASK_LIMIT_EXCEEDED`

### 9.4 홈의 인사이트 카드 `GET /insights/weekly/last-week` — HM-12 `[확정]`

홈 카드는 **항상 직전에 끝난 주(지난주)**를 가리킨다 (D-59).

**Response 200**
```json
{ "weekStart": "2026-10-26", "weekEnd": "2026-11-01", "weekLabel": "10월 4주차", "status": "NOT_PUBLISHED" }
```

- `status`: `NOT_PUBLISHED` / `GENERATING` / `PUBLISHED` / `FAILED`
- `NOT_PUBLISHED`이면 프론트가 "아직 분석된 내용이 없어요. 분석 요청하기를 눌러주세요."를 표시 (HM-12 답변). 버튼은 인사이트 화면(해당 주)으로 이동
- 미발행 안내 문구가 세 군데(상태예외 P-04, 확인필요 #4, HM-12 답변)에서 서로 다르다. 프론트 문구 통일 필요
- 기록 3일 미만이어도 이 API는 상태만 반환한다. 부족 안내는 인사이트 화면(9.1 `eligibility`)에서 처리

### 9.5 인사이트 목록 조회 `GET /insights/weekly/list` `[미확정]` (D-114)

지난 인사이트를 **목록으로 조회**한다 (신규). 정렬 기준은 최신순/오래된순 등 몇 가지가 될 예정이며 **세부는 기획 미정**이다. 구현 전에 질문한다.

아래는 확정 전 골격(`[제안]`)이다.

| 항목 | 제안 |
|---|---|
| 정렬 | `sort=latest`(기본, 최신순) \| `oldest`(오래된순). 그 밖의 기준은 `[미확정]` |
| 대상 | `PUBLISHED`인 주 `[제안]` (생성 중·실패 포함 여부 `[미확정]`) |
| 항목 | `insightId`, `weekStart`, `weekEnd`, `weekLabel`, `title`, `subtitle` `[제안]` |
| 페이징 | 방식·크기 `[미확정]` |

---

## 10. 참고: 논리 데이터 모델 `[제안]`

구현 담당이 설계할 때 참고하는 초안이다. 엔티티 이름과 구조는 스키마 단계(PROMPTS 단계 3)에서 확정한다.

모든 엔티티는 공통 `BaseEntity`를 상속하므로 `created_at`, `updated_at`(`LocalDateTime`) 컬럼을 가진다. 아래 표에서는 생략한다.

| 테이블 | 주요 컬럼 | 비고 |
|---|---|---|
| `users` | id, email, nickname(2~10), work_end_time(nullable), gender(nullable), birth_year(nullable), current_job_group(nullable), target_job_group(nullable), level(1~9, 기본 1), provider, provider_user_id | `(provider, provider_user_id)` 유니크. 직군·성별은 ENUM을 **문자열**로 저장. 이미 만들어진 `users`에는 마이그레이션으로 컬럼 추가 |
| `user_competencies` | id, user_id, competency(ENUM 문자열) | 유니크 `(user_id, competency)`. 탈퇴 시 `ON DELETE CASCADE`. 직군·역량 ENUM은 코드에서 관리(D-99) |
| `tasks` | id, user_id, title(≤20), **date(nullable, 배정일)**, **due_date(nullable)**, completed, **completed_date(nullable)**, **memo(≤500, nullable)** | 인덱스 `(user_id, date)`, `(user_id, completed_date)`. 개수 제한은 서비스에서 검증. **이미 만들어진 `tasks`(`date` NOT NULL)는 새 Flyway 마이그레이션(V3 이후)으로 `date` nullable 전환 + 컬럼 추가** (적용된 마이그레이션 파일은 수정하지 않는다) |
| `daily_records` | id, user_id, date, status(DRAFT/COMPLETED), completed_at | 유니크 `(user_id, date)`. 행이 없으면 `NOT_STARTED`. **`reflection` 컬럼 없음** (D-107) |
| `record_questions` | id, record_id, order(1~3), text, answer(≤1000), skipped | |
| `weekly_insights` | id, user_id, week_start, status, generated_at, warnings, **title, subtitle**, summary 3종 수치(recordedDays, memoCount, answerCount), **주간 합계(total_count, completed_count)** | 유니크 `(user_id, week_start)` |
| `weekly_insight_daily_stats` | id, insight_id, date, completed_count, total_count | 발행 시점 스냅샷, 7행 `[제안]` (JSON 컬럼 대안) |
| `weekly_insight_flow` | id, insight_id, week_start, week_label, completed_count, total_count | 발행 시점 스냅샷 `[제안]` (JSON 컬럼 대안) |
| `insight_strengths` | id, insight_id, title, description, tags | |
| `insight_improvements` | id, insight_id, title, description | |
| `insight_evidences` | id, strength_id(nullable), improvement_id(nullable), date, type | 강점·보완 모두 근거를 가짐. `type`: MEMO / QUESTION_ANSWER / TASK |
| `insight_actions` | id, insight_id, improvement_id, text(≤20), last_reflected_at(nullable) | 중복 반영 허용이므로 반영한 할 일과 1:1로 묶지 않음 |

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
| 신규 | | `GET /meta/profile-options`, `GET /insights/weekly/list`(`[미확정]`) |

---

## 12. 남은 질문 (요약)

상세는 `OPEN_ISSUES.md`, 기획 확인은 `PLANNING_NOTICE.md` 참조. 확정되지 않은 것만 남겼다.

1. 외부 AI(GPT 무료 모델): 모델명·호출 방식·키·약관(학습 활용 여부)·호출 한도, 프롬프트 본문 (사용자 제공)
2. `GENERATING` 중 기록 잠금 여부, 새 할 일 모델에 대한 잠금 정의(1.5) 승인
3. 인사이트 목록 조회 세부(9.5), 노출된 할 일이 0개인 주의 처리(9.2)
4. 직군·역량·성별 키워드와 성장 레벨 구간 확정(현재 `[임시]`), 역량 최대 선택 개수
5. 프론트 결정 대기: 주간 캘린더(#2), 홈 임시저장 칩, 인사이트 화면 분기 시점, 지연 표시 문구, 반영 토스트 문구
6. 외부 AI 전송 고지·동의 (법무)
7. CORS 도메인, 구글 `redirect_uri` (NOTICE-018, 015)
