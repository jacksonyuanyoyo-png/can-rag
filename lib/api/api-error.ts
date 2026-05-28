import type { ApiErrorBody } from './types'
import { getErrorMessage } from './error-codes'

export class ApiError extends Error {
  readonly code: string
  readonly details?: Record<string, unknown>
  readonly requestId?: string
  readonly status?: number

  constructor(
    body: ApiErrorBody,
    options?: { requestId?: string; status?: number },
  ) {
    super(getErrorMessage(body.code, body.message))
    this.name = 'ApiError'
    this.code = body.code
    this.details = body.details
    this.requestId = options?.requestId
    this.status = options?.status
  }

  static fromResponse(
    error: ApiErrorBody,
    requestId?: string,
    status?: number,
  ): ApiError {
    return new ApiError(error, { requestId, status })
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError
  }
}
