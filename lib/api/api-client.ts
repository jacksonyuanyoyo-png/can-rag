import { API_PREFIX, buildApiUrl } from './config'
import { ApiError } from './api-error'
import { tokenStore } from './token-store'
import type {
  ApiErrorEnvelope,
  ListQuery,
  PaginatedResult,
  Pagination,
  SuccessResult,
} from './types'

type QueryValue = string | number | boolean | undefined | null

export type ApiRequestOptions = {
  method?: string
  body?: unknown
  query?: Record<string, QueryValue> | ListQuery
  credentials?: RequestCredentials
  skipAuth?: boolean
  skipRefresh?: boolean
  idempotencyKey?: string
  headers?: Record<string, string>
}

let refreshPromise: Promise<string | null> | null = null

function buildQueryString(query?: Record<string, QueryValue> | ListQuery): string {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.set(key, String(value))
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `req_${crypto.randomUUID()}`
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text()
  if (!text) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new ApiError(
      {
        code: 'INTERNAL_ERROR',
        message: `Invalid JSON response (HTTP ${response.status})`,
      },
      { status: response.status },
    )
  }
}

function throwApiError(payload: unknown, status: number): never {
  const envelope = payload as ApiErrorEnvelope
  if (envelope?.error?.code) {
    throw ApiError.fromResponse(envelope.error, envelope.requestId, status)
  }
  throw new ApiError(
    {
      code: 'INTERNAL_ERROR',
      message: `Request failed (HTTP ${status})`,
    },
    { status },
  )
}

/** Silent cookie refresh; returns null on 401 without throwing. */
export async function trySilentRefresh(): Promise<string | null> {
  return refreshAccessToken()
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await fetch(buildApiUrl(`${API_PREFIX}/auth/refresh`), {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-Request-Id': createRequestId(),
          },
          body: '{}',
        })
        const payload = await parseJsonResponse(response)
        if (!response.ok) {
          tokenStore.clear()
          return null
        }
        const data = (payload as { data?: { accessToken?: string } }).data
        const nextToken = data?.accessToken ?? null
        tokenStore.set(nextToken)
        return nextToken
      } catch {
        tokenStore.clear()
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

async function executeRequest<T>(
  path: string,
  options: ApiRequestOptions,
  retryAfterRefresh: boolean,
): Promise<{ payload: Record<string, unknown>; status: number }> {
  const {
    method = 'GET',
    body,
    query,
    credentials,
    skipAuth = false,
    idempotencyKey,
    headers: extraHeaders,
  } = options

  const resolvedIdempotencyKey =
    idempotencyKey ??
    (method !== 'GET' && method !== 'HEAD'
      ? createRequestId().replace(/^req_/, 'idem_')
      : undefined)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Request-Id': createRequestId(),
    ...extraHeaders,
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  if (!skipAuth) {
    const token = tokenStore.get()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  if (resolvedIdempotencyKey) {
    headers['X-Idempotency-Key'] = resolvedIdempotencyKey
  }

  const response = await fetch(`${buildApiUrl(path)}${buildQueryString(query)}`, {
    method,
    credentials,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const payload = (await parseJsonResponse(response)) as Record<string, unknown>

  if (
    response.status === 401 &&
    !options.skipAuth &&
    !options.skipRefresh &&
    retryAfterRefresh
  ) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return executeRequest<T>(
        path,
        { ...options, skipRefresh: true, idempotencyKey: resolvedIdempotencyKey },
        false,
      )
    }
  }

  if (!response.ok) {
    const envelope = payload as unknown as ApiErrorEnvelope
    const authCode = envelope?.error?.code
    if (
      response.status === 401 &&
      authCode &&
      ['AUTH_TOKEN_MISSING', 'AUTH_TOKEN_EXPIRED', 'AUTH_TOKEN_INVALID', 'AUTH_REFRESH_EXPIRED'].includes(
        authCode,
      )
    ) {
      tokenStore.clear()
    }
    throwApiError(payload, response.status)
  }

  return { payload, status: response.status }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<SuccessResult<T>> {
  const { payload } = await executeRequest<T>(path, options, true)
  return {
    data: payload.data as T,
    requestId: payload.requestId as string | undefined,
  }
}

function defaultPagination<T>(items: T[]): Pagination {
  const total = items.length
  return {
    page: 1,
    pageSize: total > 0 ? total : 1,
    total,
    hasMore: false,
  }
}

export async function apiPaginatedRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<PaginatedResult<T>> {
  const { payload } = await executeRequest<T[]>(path, options, true)
  const data = (payload.data as T[]) ?? []
  const pagination = payload.pagination as Pagination | undefined
  return {
    data,
    pagination: pagination ?? defaultPagination(data),
    requestId: payload.requestId as string | undefined,
  }
}

export async function apiVoidRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<{ requestId?: string }> {
  const { payload } = await executeRequest<unknown>(path, options, true)
  return { requestId: payload.requestId as string | undefined }
}
