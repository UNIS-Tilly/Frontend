# TILLY Frontend

인턴 경험 기록 서비스 **TILLY**의 웹 프론트엔드입니다. (React + TypeScript + Vite)

## 시작하기

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev                  # http://localhost:3000
```

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (포트 3000, `/api`는 백엔드로 프록시) |
| `npm run build` | 타입 검사 + 배포용 빌드 |
| `npm run lint` | 코드 검사 (oxlint) |
| `npx prettier --write src` | 코드 포맷 |

## 환경변수 (`.env.local`)

| 이름 | 설명 |
| --- | --- |
| `VITE_API_BASE_URL` | 비워두면 같은 주소의 `/api` 로 요청 (개발 중 권장) |
| `VITE_PROXY_TARGET` | 개발 서버가 `/api`를 넘길 백엔드 주소 (기본 `http://localhost:8080`) |
| `VITE_GOOGLE_CLIENT_ID` | 구글 OAuth 클라이언트 ID (백엔드와 동일) |
| `VITE_GOOGLE_REDIRECT_URI` | 구글 콘솔에 등록한 Redirect URI (개발: `http://localhost:3000/auth/callback/google`) |

## 로컬에서 백엔드와 함께 실행

1. 백엔드를 `local` 프로파일로 실행 (`http://localhost:8080`) — [UNIS-Tilly/Backend](https://github.com/UNIS-Tilly/Backend)의 `.env.example`, `docker-compose.yml` 참고 (MySQL·Redis 필요)
2. 이 프로젝트에서 `npm run dev`
3. 로그인 화면의 **개발용 로그인(dev-login)** 으로 구글 설정 없이 테스트 계정 로그인 가능 (백엔드 `local` 프로파일 전용)

## 폴더 구조와 개발 계획

- 구조/규칙: [`CLAUDE.md`](./CLAUDE.md)
- 기술 선택 이유, 백엔드 연동 정리, 로드맵: [`docs/FRONTEND_PLAN.md`](./docs/FRONTEND_PLAN.md)
