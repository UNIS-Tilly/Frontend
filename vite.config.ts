import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일의 값을 읽는다. ('' = VITE_ 접두사가 없는 값도 읽겠다는 뜻)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      // 백엔드 .env 의 구글 Redirect URI(http://localhost:5173/auth/callback/google)와 맞추기 위해 5173번 사용
      // strictPort: 5173 이 이미 쓰이고 있으면 다른 번호로 몰래 바꾸지 않고 실행을 멈춘다. (번호가 바뀌면 구글 로그인이 실패하므로)
      port: 5173,
      strictPort: true,
      proxy: {
        // 개발 중 /api 로 시작하는 요청을 백엔드로 대신 전달한다.
        // 브라우저 입장에서는 같은 주소(localhost:5173)로 요청하는 것이라 CORS 문제와 쿠키 문제가 생기지 않는다.
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
