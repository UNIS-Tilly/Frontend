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
      // 백엔드의 구글 Redirect URI 예시(http://localhost:3000/auth/callback/google)와 맞추기 위해 3000번 사용
      port: 3000,
      proxy: {
        // 개발 중 /api 로 시작하는 요청을 백엔드로 대신 전달한다.
        // 브라우저 입장에서는 같은 주소(localhost:3000)로 요청하는 것이라 CORS 문제와 쿠키 문제가 생기지 않는다.
        '/api': {
          target: env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  }
})
