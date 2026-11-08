// 백엔드의 모든 응답은 이 모양으로 감싸져 온다. (백엔드 ApiResponse 와 동일)
// 성공: { success: true, message, data }  /  실패: { success: false, errorCode, message }
export type ApiResponse<T> = {
  success: boolean
  errorCode?: string
  message: string
  data: T
}
