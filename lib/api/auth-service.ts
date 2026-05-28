import { apiRequest, trySilentRefresh } from './api-client'
import { API_PREFIX } from './config'
import { ApiError } from './api-error'
import { tokenStore } from './token-store'
import type { LoginResult, RefreshResult, User } from './types'

export interface LoginCredentials {
  email: string
  password: string
}

const SESSION_AUTH_CODES = new Set([
  'AUTH_TOKEN_MISSING',
  'AUTH_TOKEN_EXPIRED',
  'AUTH_TOKEN_INVALID',
  'AUTH_REFRESH_EXPIRED',
])

function isSessionAuthError(code: string): boolean {
  return SESSION_AUTH_CODES.has(code)
}

async function login(credentials: LoginCredentials): Promise<LoginResult> {
  const result = await apiRequest<LoginResult>(`${API_PREFIX}/auth/login`, {
    method: 'POST',
    body: credentials,
    skipAuth: true,
    credentials: 'include',
    skipRefresh: true,
  })
  tokenStore.set(result.data.accessToken)
  return result.data
}

async function refresh(): Promise<RefreshResult | null> {
  const accessToken = await trySilentRefresh()
  if (!accessToken) return null
  return { accessToken, expiresIn: 1800 }
}

async function getMe(): Promise<User> {
  const result = await apiRequest<User>(`${API_PREFIX}/auth/me`)
  return result.data
}

async function logout(): Promise<void> {
  try {
    await apiRequest<{ success: boolean }>(`${API_PREFIX}/auth/logout`, {
      method: 'POST',
      body: {},
      credentials: 'include',
      skipRefresh: true,
    })
  } finally {
    tokenStore.clear()
  }
}

async function restoreSession(): Promise<User | null> {
  if (!tokenStore.hasToken()) {
    const token = await trySilentRefresh()
    if (!token) return null
  }

  try {
    return await getMe()
  } catch (error) {
    if (ApiError.isApiError(error) && isSessionAuthError(error.code)) {
      const token = await trySilentRefresh()
      if (token) {
        try {
          return await getMe()
        } catch {
          // fall through
        }
      }
    }
    tokenStore.clear()
    return null
  }
}

export const authService = {
  login,
  refresh,
  getMe,
  logout,
  restoreSession,
}
