# TILLY 백엔드 프로젝트 구조

도메인별로 패키지를 나누고, 그 안에 `controller` / `service` / `dto` / `repository` / `entity` / `enums` 하위 패키지를 두는 구조입니다.
참고 이미지와 기존 프로젝트 코드(`efub.awa.moamoa`)를 기준으로 작성했습니다. **이 문서의 구조를 따르고, 벗어나야 할 때는 사용자에게 질문합니다.**

표기: `[확정]` 이미지 또는 사용자 답변에 근거 / `[제안]` 이미지에 없어 제가 정한 잠정안 (승인 전에는 임의로 확정하지 않음)

> 2026-11-08: 아래 구조 제안 5개(`scheduler`, `client`, 의존 방향, DTO 이름, 테스트 구조)는 사용자가 **모두 승인**했다 (`DECISIONS.md` D-12). 현재 남은 `[제안]`은 클래스 이름 등 세부뿐이다.

---

## 1. 확정된 사항

| 항목 | 내용 | 근거 |
|---|---|---|
| 기본 패키지 | `com.unis.tilly` | 사용자 답변 `[확정]` |
| 패키징 방식 | **도메인 우선**. 최상위는 도메인, 그 아래에 계층 하위 패키지 | 이미지 `[확정]` |
| 하위 패키지 이름 | `controller`, `dto`, `entity`, `enums`, `repository`, `service` | 이미지 `[확정]` |
| 공통 코드 위치 | `global` 아래에 `common`, `config`, `exception`, `security` | 사용자 답변 `[확정]` |
| 공통 응답 · 베이스 엔티티 | `global/common` 안에 정상/에러 공통 응답(`response`)과 `BaseEntity`(`entity`)를 둔다 | 사용자 답변 `[확정]` |
| 아카이브 | 별도 도메인을 만들지 않고 **`record` 도메인에 포함** | 사용자 답변 `[확정]` |
| 외부 AI 호출 | **`ai` 도메인으로 분리** | 사용자 답변 `[확정]` |

---

## 2. 전체 구조

```
src/main/java/com/unis/tilly
├── auth                      # 로그인·로그아웃·토큰 (구글만 + JWT + Redis, D-94. 구현 완료)
│   ├── controller
│   ├── dto
│   ├── repository
│   └── service
├── user                      # 내 정보, 프로필(성별·나이·직군·역량), 성장 레벨, 퇴근 시간, 탈퇴, 프로필 선택지(options)
│   ├── controller            # UserController, ProfileOptionController(GET /meta/profile-options) [제안]
│   ├── dto
│   ├── entity                # User, UserCompetency (user_competencies 매핑)
│   ├── enums                 # Gender, JobGroup, CompetencyType, Competency (D-99, 키워드는 [임시])
│   ├── repository
│   └── service
├── task                      # 할 일 (배정일 필수·마감 일시·완료일(참고용)·메모, 그날 추가한 일만 노출, D-102~D-106, D-119~D-123)
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── repository
│   └── service
├── record                    # 기록 요약, 하루 회고(별도 테이블, D-124), 하루 질문(확장 질문), 임시저장·완료, 아카이브 달력
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── enums
│   ├── repository
│   ├── scheduler             # 퇴근 10분 전 자동 질문 생성
│   └── service
├── insight                   # 주간 인사이트(제목·소제목·주간 달성·업무 흐름 스냅샷), 목록, 홈 카드(추천 행동은 표시만), 주간 기록 잠금
│   ├── controller
│   ├── dto
│   ├── entity
│   ├── enums
│   ├── repository
│   └── service
├── ai                        # 외부 AI 호출 (포트 인터페이스 + 어댑터)
│   ├── client                # 포트 인터페이스 + 어댑터 (GPT 직접 호출 어댑터, D-115. 모델·키는 NOTICE-016 확정 후. FastAPI 없음)
│   └── dto
└── global
    ├── common
    │   ├── entity            # BaseEntity (생성/수정 시각)
    │   └── response          # ApiResponse (공통 정상/에러 응답 구조)
    ├── config                # 설정 (JPA Auditing 등)
    ├── exception             # ErrorCode, 예외, 전역 예외 처리기
    └── security              # 보안 설정 (인증 방식 확정 후)
```

> **이미지 기준 관찰**: 모든 도메인이 6개 하위 패키지를 전부 갖지는 않는다. 예를 들어 `balance`는 `controller`가 없고, `auth`는 `entity`가 없다. **필요한 하위 패키지만 만든다.** 빈 패키지를 미리 만들지 않는다.

---

## 3. 도메인별 책임과 API 연결 `[확정]`

도메인 목록은 `API_SPEC.md`의 장 구성에서 도출했습니다.

| 도메인 | 책임 | API_SPEC 장 | 주요 클래스 (이름은 잠정) |
|---|---|---|---|
| `auth` | 로그인, 로그아웃, 토큰, 현재 사용자 조회 | 3장, 4.5 | `AuthController`, `AuthService`, `CurrentUserProvider`(인터페이스) |
| `user` | 내 정보 조회, **프로필 전체 교체**, 프로필 선택지, 퇴근 시간 설정, 성장 레벨 계산, 탈퇴 | 4.1~4.4, 4.6, 4.7 | `User`, `UserCompetency`, `UserController`, `UserService`, `UserRepository` |
| `task` | 할 일 조회(그날 배정분만·`dueInDays`)·추가·수정·삭제·완료 토글 | 5장 | `Task`, `TaskController`, `TaskService`, `TaskRepository` |
| `record` | 기록 요약, **하루 회고 조회·저장(`reflection`, `DailyReflection`)**, 하루 질문 조회·생성, 임시저장·완료(`taskMemos`), **아카이브 월별 조회(`hasRecord`)** | 6장, 7장 | `DailyRecord`, `DailyReflection`, `RecordQuestion`, `RecordController`, `RecordService`, `RecordQuestionService`, `ArchiveController`(7장) |
| `insight` | 주간 인사이트 조회·분석 요청·홈 카드·목록·주간 잠금(**구현됨, PR #18**, 추천 행동 반영은 없음 D-147) | 9장 | `WeeklyInsight`, `InsightStrength`, `InsightEvidence`, `InsightImprovement`, `InsightAction`, 주간 스냅샷(`InsightSnapshot`, 일별 통계·주간 흐름), `InsightController`, `InsightService`, `InsightGenerationService`(비동기 생성), `InsightLockService`(주간 잠금), `InsightRecovery`(GENERATING 정리) |
| `ai` | 확장 질문 생성, 주간 인사이트 생성 호출 | 8장 | `QuestionGenerator`, `WeeklyInsightGenerator` (인터페이스), GPT 어댑터(Spring 직접 호출)는 모델·키 확정 후 |
| `global` | 공통 응답, 베이스 엔티티, 설정, 예외 처리, 보안 | 1장 | `ApiResponse`, `BaseEntity`, `ErrorCode` 등 (5장) |

### 3.1 `enums` 위치 (이미지의 `BalanceChangeType`, `ReferenceType` 패턴)

| 도메인 | Enum | 근거 |
|---|---|---|
| `record` | `RecordStatus` (`NOT_STARTED` / `DRAFT` / `COMPLETED`) | API_SPEC 1.4 |
| `user` | `Gender`, `JobGroup`, `CompetencyType`, `Competency` | API_SPEC 1.4, D-99 |
| `insight` | `InsightStatus`, `EvidenceType` (`MEMO`/`REFLECTION`/`QUESTION_ANSWER`/`TASK`), `StarPart` (`S`/`T`/`A`/`R`) | API_SPEC 1.4 |

### 3.2 클래스 이름 주의

- 기록 엔티티는 `Record`가 아니라 **`DailyRecord`**로 한다. `java.lang.Record`와 충돌한다.
- 엔티티 이름과 테이블 구조는 스키마 확정(PROMPTS 단계 3) 때 최종 확정한다. 위 이름은 잠정이다.

---

## 4. 하위 패키지 규칙

| 하위 패키지 | 들어가는 것 | 규칙 |
|---|---|---|
| `controller` | `@RestController` | 요청 검증, 서비스 호출, 응답 변환만. 비즈니스 로직 금지 |
| `service` | 비즈니스 로직, 트랜잭션 | 한 도메인에 서비스가 여러 개여도 됨 (이미지의 `AuthService`, `TokenService`) |
| `dto` | 요청/응답 객체 | 엔티티를 API로 직접 노출하지 않는다. 이름은 `XxxRequest` / `XxxResponse` `[확정]` |
| `repository` | `JpaRepository` 인터페이스 | `{Entity}Repository` (이미지의 `BalanceHistoryRepository`) |
| `entity` | JPA 엔티티 | 공통 필드는 `global/common/entity`의 베이스 엔티티를 상속 |
| `enums` | 도메인 열거형 | 이미지의 `enums`(복수형)를 따른다 |
| `scheduler` | 스케줄 작업 `[확정]` | `record`에서만 필요 (API_SPEC 6.6). 이미지에 없는 패키지 |
| `client` | 외부 서비스 호출 `[확정]` | `ai`에서만 사용. 포트 인터페이스와 어댑터 |

### 4.1 의존 방향 `[확정]`

```
controller → service → repository
                ↓
        (다른 도메인은 그 도메인의 service를 통해서만 접근)
```

- 다른 도메인의 `repository`를 직접 호출하지 않는다. 그 도메인의 `service`를 호출한다.
  - 예: 인사이트의 "다음 주 업무에 반영"(9.3)은 `task` 도메인의 `TaskService`를 호출해 할 일을 만든다. `TaskRepository`를 직접 쓰지 않는다.
- 도메인 간 순환 참조가 생기면 구현하지 말고 질문한다.
- `record`와 `insight`는 `ai`의 **인터페이스**(`QuestionGenerator`, `WeeklyInsightGenerator`)에만 의존한다. 어댑터 구현체에 직접 의존하지 않는다.

---

## 5. `global` 패키지 `[확정]`

`global`은 도메인에 속하지 않는 공통 코드이며 하위는 아래 4개다. 상세 코드 규칙은 `RULES.md` 7.6을 따른다.

| 패키지 | 들어가는 것 | 비고 |
|---|---|---|
| `global/common/entity` | `BaseEntity` (`createdAt`, `updatedAt`) | 모든 엔티티가 상속 |
| `global/common/response` | `ApiResponse<T>` (공통 정상/에러 응답 구조), `SuccessMessage` (성공 메시지 상수) | 모든 컨트롤러가 반환. `SuccessMessage` 위치는 `[제안]` |
| `global/config` | 설정 클래스. 예: JPA Auditing 활성화(`BaseEntity` 동작에 필요) | 그 외 Clock, 스케줄링, 비동기, CORS 등은 필요해질 때 `[제안]` |
| `global/exception` | `ErrorCode`(`int status`, `String message`), 도메인/공통 예외, 전역 예외 처리기 | `ApiResponse.fail(...)`이 `ErrorCode`를 사용 |
| `global/security` | 보안 설정 (JWT 필터, Redis 연동 등) | 인증 방식은 확정·구현됨(JWT + Redis, 구글만 D-94) |

- `common`에는 **공통 응답 구조와 `BaseEntity`**를 둔다. 비즈니스 로직이나 도메인 코드를 넣지 않는다.
- `global` 아래에 위 4개 외의 패키지가 필요하면 먼저 질문한다.
- 클래스 이름 중 `ApiResponse`, `BaseEntity`는 기존 프로젝트와 같다 `[확정]`. 예외 처리기·설정 클래스의 이름은 구현 시 정한다.

---

## 6. 테스트 패키지

`src/test/java/com/unis/tilly` 아래에 **main과 같은 도메인 구조**로 둔다 `[확정]`.

```
src/test/java/com/unis/tilly
├── task
│   ├── controller   # TaskControllerTest
│   └── service      # TaskServiceTest
└── record ...
```

- Fake 구현체(예: `FakeQuestionGenerator`)는 `src/test` 아래에만 둔다. (RULES.md 4장)

---

## 7. 이름 규칙

| 대상 | 규칙 | 예 |
|---|---|---|
| 패키지 | 소문자, 단수 | `task`, `record`, `insight` |
| 컨트롤러 | `{도메인}Controller` | `TaskController` |
| 서비스 | `{도메인 또는 역할}Service` | `TaskService`, `TokenService` |
| 리포지토리 | `{엔티티}Repository` | `TaskRepository` |
| 엔티티 | 도메인 명사 | `Task`, `DailyRecord` |
| 열거형 | `{의미}Type` 또는 `{의미}Status` | `RecordStatus`, `EvidenceType` |
| DTO | `{동작}{Request/Response}` `[확정]` | `TaskCreateRequest`, `TaskResponse` |

---

## 8. 구조 변경이 필요할 때

- 새 도메인이나 이 문서에 없는 하위 패키지를 만들어야 하면 **먼저 사용자에게 질문**한다 (RULES.md 2.1).
- 구조 제안은 모두 승인되었다(D-12). 엔티티·클래스 이름 등 세부는 구현 단계에서 확정한다.

---

## 9. 저장소 루트 파일과 Git 제외 대상 `[확정]` (D-74)

```
(레포 루트)
├── CLAUDE.md          # 루트에 둔다 (Claude Code가 자동으로 읽음). Git 제외
├── NOTICE.md          # 루트에 둔다. Claude Code가 갱신. Git 제외
├── guideline/         # 모든 참고 문서. Git 제외 (_converted/ 포함)
├── src/
├── build.gradle
├── docker-compose.yml # (초기 세팅에서 승인 시)
├── .env.example       # 변수 이름·설명만. 커밋 가능
└── .gitignore         # 위 제외 대상 포함
```

- 제외 대상 전체 목록과 커밋·푸시 전 확인은 `RULES.md` 6.1을 따른다.
- `.gitignore`는 사용자가 이미 설정해 두었다. Claude Code는 이 항목을 지우거나 바꾸지 않고, 빠진 항목(`.env` 등)만 사용자에게 제안한다.
