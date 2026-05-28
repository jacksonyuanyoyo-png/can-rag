'use client'

import { useCallback } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api/api-error'

const SILENT_AUTH_CODES = new Set([
  'AUTH_TOKEN_MISSING',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_TOKEN_INVALID',
  'AUTH_REFRESH_EXPIRED',
])

export function useApiError() {
  const showApiError = useCallback((error: unknown) => {
    if (ApiError.isApiError(error)) {
      if (SILENT_AUTH_CODES.has(error.code)) {
        return
      }
      toast.error(error.message, {
        description: error.requestId ? `Request ID: ${error.requestId}` : undefined,
      })
      return
    }

    if (error instanceof Error) {
      toast.error(error.message)
      return
    }

    toast.error('操作失败，请稍后重试')
  }, [])

  return { showApiError, showError: showApiError }
}
