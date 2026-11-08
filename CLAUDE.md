# CLAUDE.md — TILLY 프론트엔드 개발 지침

이 파일은 Claude Code가 이 프로젝트에서 작업할 때 항상 따르는 규칙이다.
작업 전에 반드시 읽고, 규칙과 충돌하는 요청이 오면 먼저 알려 줘.
자세한 배경·로드맵은 `docs/FRONTEND_PLAN.md`를 본다.

## 1. 프로젝트 개요

- 서비스: **TILLY** (Today I Learned). 인턴 경험을 간편하게 기록하고, 기록에서 AI 인사이트를 얻어 다음 주 행동을 바꾸게 돕는 웹 서비스.
- 핵심 흐름: 로그인/가입 → 온보딩 → 홈(오늘 업무 체크리스트) → 기록(업무별 메모·하루 회고) → TILLY 확장 질문 → 주간 인사이트 → 추천 행동을 다음 주 체크리스트에 추가
- 핵심 가치: **기록이 또 하나의 업무가 되면 안 된다.** 최소한의 입력, 빠른 기록, **체크리스트와 업무별 기록은 자동 저장**이 UX 기준이다.
- 플랫폼: **PC·모바일 반응형 웹**. (네이티브 앱, 위젯, 푸시 알림은 이번 버전에서 만들지 않는다.)
- 화면(1depth): 홈 / 기록 / 아카이브 / 인사이트 / 설정  (+ 온보딩·로그인)
- MVP에 넣지 않는 것: 키워드별 아카이브 분류, 기록 완료 시각적 보상, 완성형 STAR 자동 작성, 푸시/이메일 알림, 기록 수정(ver1 불가 — 정책 확정 전까지 임의로 만들지 않는다)

## 2. 사용자(나)에 대해

- 프론트엔드 경험이 거의 없는 초보자다. 백엔드는 Spring(MVC)에 익숙하다.
- Claude가 준 코드를 **내가 읽고 이해할 수 있어야** 한다. 알아서 돌아가는 코드보다 읽히는 코드가 우선이다.
- 새 파일을 만들거나 큰 변경을 한 뒤에는 아래 형식으로 요약해 줘.
  - 만든/바꾼 파일 목록과 각 파일의 역할 (한 줄씩)
  - 데이터가 어디서 와서 어디로 흐르는지
  - 필요하면 Spring 구조에 비유한 설명 (예: `types/` ≈ DTO, `api/` ≈ 외부 호출 계층)
- 처음 나오는 개념(훅, props, 상태 등)은 한두 문장으로 짧게 설명해 줘. 같은 설명을 반복하지는 마.

## 3. 기술 스택 (확정)

- React 19 + **TypeScript** + **Vite** (`react-ts`), 패키지 매니저는 **npm**
- 라우팅: `react-router` (BrowserRouter + `<Routes>`)
- 서버 데이터: **TanStack Query** — 조회는 `useQuery`, 생성/수정/삭제는 `useMutation`. (서버 데이터 전용이며 "전역 상태 라이브러리"가 아니다.)
- 서버 통신: 직접 만든 `fetch` 래퍼(`src/api/client.ts`)만 사용한다. **axios는 쓰지 않는다.**
- 스타일: **Tailwind CSS v4**. 색·폰트 같은 값은 `src/index.css`의 `@theme` 토큰으로만 쓰고, 임의의 hex 값을 className에 직접 쓰지 않는다.
- 린트/포맷: oxlint, Prettier (`npm run lint`, `npx prettier --write src`)
- 위 목록에 없는 라이브러리를 추가하려면 **이유와 대안을 설명하고 허락**을 받는다. (후보: 그래프 → Recharts, 날짜 → date-fns, 목업 → MSW)
- Redux/Zustand 등 전역 상태 라이브러리는 쓰지 않는다. 로그인 상태는 `AuthProvider`, 서버 데이터는 TanStack Query가 맡는다.

## 4. 프로젝트 구조

```
src/
  main.tsx        # 진입점. QueryClient / Router / AuthProvider 를 감싼다
  App.tsx         # URL ↔ 화면(page) 연결표
  index.css       # Tailwind + 디자인 토큰(@theme)
  pages/          # 화면 단위 (URL 하나 = 페이지 하나)           ≈ Controller + View
  components/     # 재사용 UI 조각 (버튼, 카드, 체크리스트 항목 …)  ≈ 뷰 조각
  layouts/        # 공통 틀(AppLayout)과 로그인 검사(RequireAuth)
  providers/      # 앱 전체 상태 (AuthProvider)                  ≈ SecurityContext
  hooks/          # 상태+로직 묶음 (useAuth, useTasks, useAutoSave …)
  api/            # 백엔드 호출 함수 모음 (화면에서 fetch 직접 사용 금지)
  types/          # 데이터 모양 정의 (백엔드 DTO와 맞춘다)         ≈ DTO
  lib/            # 환경변수, 토큰 저장, 구글 OAuth 같은 작은 도구
docs/             # 계획서 등 문서
```

- 폴더를 추가하거나 구조를 바꾸려면 먼저 이유를 설명하고 물어봐.
- 파일 하나는 한 가지 역할만 맡게 하고, 너무 길어지면 나눠 줘.

## 5. 백엔드 연동 규칙 (코드로 확인된 사실)

- 백엔드는 별도 서버(Spring)이고, 모든 응답은 `{ success, errorCode?, message, data }` 형식이다. `apiFetch<T>()`가 `data`만 꺼내 주고, 실패하면 `ApiError(status, errorCode, message)`를 던진다.
- API 함수는 `src/api/` 에 도메인별 파일로 만든다. (`auth.ts`, `users.ts`, 이후 `tasks.ts`, `records.ts`, `insights.ts`) 요청/응답 타입은 `src/types/` 에 둔다.
- **인증**: Access Token(30분)은 **메모리에만** 둔다(`lib/token.ts`). localStorage/sessionStorage에 토큰을 저장하지 않는다. Refresh Token(14일)은 HttpOnly 쿠키라 JS에서 읽을 수 없고, `credentials: 'include'`로 자동 전송된다. 만료(401) 시 `apiFetch`가 `/api/auth/reissue`로 재발급받아 한 번 재시도한다. 이 동작을 우회하는 코드를 만들지 않는다.
- **로그인**: 구글 인가 코드 방식. 프론트는 구글 로그인 화면으로 보내고(`lib/googleOAuth.ts`), 돌아온 `code`를 `POST /api/auth/login/google`에 보낸다. 응답이 `SIGNUP_REQUIRED`면 가입 화면(`/signup`)으로 이동한다. client secret은 프론트에 절대 두지 않는다.
- 개발 중에는 `/api` 요청을 Vite proxy가 백엔드(`VITE_PROXY_TARGET`, 기본 `localhost:8080`)로 넘긴다. API 주소를 코드에 직접 쓰지 않는다.
- 백엔드 PR에서 "프론트 영향 있음"이면 백엔드 저장소의 `FRONT_NOTICE.md`에 변경이 기록된다. API 작업 전에 확인하고, 명세가 없거나 모호하면 **추측해서 필드를 만들지 말고** 나에게 물어봐.
- 서버 호출이 있는 화면은 **로딩 중 / 실패(재시도) / 빈 데이터** 상태를 항상 같이 처리한다. 에러는 `ApiError.message`를 사용자에게 보여주고, 분기가 필요하면 `errorCode`를 쓴다.

## 6. 코딩 규칙

- 컴포넌트 이름은 PascalCase, 파일명도 컴포넌트 이름과 같게 한다. (`ChecklistItem.tsx`) 변수·함수는 camelCase, 줄임말은 피한다.
- 함수형 컴포넌트와 훅만 쓴다. 클래스형 컴포넌트는 쓰지 않는다.
- `any` 금지. **`enum`과 클래스 생성자 파라미터 프로퍼티는 쓰지 않는다**(tsconfig `erasableSyntaxOnly`) → 문자열 유니온 타입을 쓴다. 타입은 `type`/`interface`로 단순하게 쓰고 어려운 제네릭 기법은 피한다.
- 주석은 한국어로, "무엇을"보다 "왜"를 적는다. 초보자가 읽는 코드이므로 핵심 흐름에는 짧은 주석을 달아 준다.
- 날짜는 `YYYY-MM-DD`, 시간은 `HH:mm` 문자열로 다룬다. (서버 시간대는 Asia/Seoul)
- **자동 저장**(체크리스트·업무별 메모): 입력 후 약 0.8초 디바운스로 저장하고, 포커스를 잃거나 화면을 떠날 때 즉시 저장한다. 화면에 "저장 중… / 저장됨 / 저장 실패(재시도)"를 항상 보여준다. 하루 회고와 확장 질문 답변은 "임시저장" 버튼으로 저장한다.
- AI 응답(확장 질문 생성, 분석)은 오래 걸리거나 실패할 수 있다(`AI_TIMEOUT` 504, `AI_GENERATION_FAILED` 502). 대기 화면, 실패 안내, 재시도 버튼을 반드시 만든다.
- 사용자의 기록 원문, 토큰, 이메일을 `console.log` 하지 않는다.
- `.env.local`, 키, 토큰을 커밋하지 않는다. 환경변수는 `src/lib/env.ts`에서만 읽는다.

## 7. 작업 방식

- 한 번에 **한 기능만** 구현한다. 요청하지 않은 기능, 리팩터링, 라이브러리 추가는 하지 않는다.
- 과한 설계(추상화, 범용 유틸)를 하지 않는다. 지금 필요한 만큼만 만든다.
- 기존 코드를 수정할 때는 먼저 관련 파일을 읽고, 기존 스타일과 구조에 맞춘다.
- 요구사항이 모호하면 추측하지 말고 짧게 물어봐. 선택지와 추천안을 함께 제시해 줘.
- 파일 삭제, 대규모 변경, 설정 파일(`vite.config.ts`, `tsconfig*.json`) 수정은 먼저 확인받는다.
- 코드를 바꾼 뒤에는 `npm run lint`와 `npm run build`가 통과하는지 확인한다. 화면 변경은 가능하면 모바일(390px)과 PC(1280px) 모두 확인한다.
- 에러가 나면 원인을 쉬운 말로 먼저 설명하고, 어디를 고쳤는지 알려 준다.
- 백엔드 API가 아직 없으면 임시 mock으로 화면부터 만들 수 있지만, mock 코드는 `// MOCK:` 주석으로 표시하고 실제 API와 같은 타입을 쓴다.

## 8. Git 규칙 (백엔드와 동일하게 맞춤)

- 브랜치: `main`(배포) ← `develop`(통합) ← `feature/<작업명>`. 작업은 feature 브랜치에서 하고 `develop`으로 PR을 보낸다.
- PR은 `.github/PULL_REQUEST_TEMPLATE.md`를 채운다. CI(`lint` + `build`)가 통과해야 한다.
- **커밋과 푸시는 내가 요청할 때만** 한다. 커밋 메시지는 한국어로 `feat: …`, `fix: …`, `chore: …` 형식.

## 9. 디자인 반영

- 디자이너의 하이파이 디자인(피그마)을 기준으로 구현한다. 임의로 색·간격·폰트를 바꾸지 않는다. 현재 `index.css`의 색은 임시값이다.
- 화면별로 **기본 / 로딩 / 빈 상태 / 오류** 상태를 구분해 구현한다.
- 모바일: 하단 탭, PC: 왼쪽 사이드바 (`AppLayout`). 새 화면은 모바일 레이아웃을 먼저 만들고 `md:` 이상에서 PC를 다듬는다.
- 이 서비스는 인턴이 **회사에서** 쓴다. 눈에 띄지 않고 가볍고 빠르게 열리는 화면을 우선한다.

## 10. 응답 스타일

- 한국어로 답한다.
- 결과는 간결하게. 변경 내용은 파일 단위로 요약하고, 다음에 해볼 일은 한 가지만 제안한다.
