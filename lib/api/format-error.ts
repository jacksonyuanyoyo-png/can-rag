import { ApiError } from './api-error'

export function formatApiErrorMessage(error: unknown): string {
  if (ApiError.isApiError(error)) {
    const base = error.message
    return error.requestId ? `${base} (requestId: ${error.requestId})` : base
  }
  if (error instanceof Error) {
    return error.message
  }
  return '请求失败，请稍后重试'
}
