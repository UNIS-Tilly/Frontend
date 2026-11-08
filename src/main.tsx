import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { ApiError } from './api/client.ts'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './providers/AuthProvider.tsx'

// 서버에서 가져온 데이터(할 일, 기록, 인사이트 등)를 캐시하고 로딩/에러 상태를 관리해 주는 도구
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // 4xx(요청이 잘못됨)는 다시 시도해도 같은 결과라 재시도하지 않는다. 네트워크/서버 오류만 1번 재시도.
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.status >= 400 && error.status < 500) &&
        failureCount < 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
