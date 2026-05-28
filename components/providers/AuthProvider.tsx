'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authService } from '@/lib/api/auth-service'
import { tokenStore } from '@/lib/api/token-store'
import type { LoginCredentials } from '@/lib/api/auth-service'
import type { User } from '@/lib/api/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginCredentials) => Promise<User>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
  /** Clear local session and send the user to login (e.g. after 401). */
  redirectToLogin: (nextPath?: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const me = await authService.getMe()
      setUser(me)
      return me
    } catch {
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    authService
      .restoreSession()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials)
    setUser(result.user)
    return result.user
  }, [])

  const redirectToLogin = useCallback((nextPath?: string) => {
    tokenStore.clear()
    setUser(null)
    if (typeof window === 'undefined') return
    const next = encodeURIComponent(nextPath && nextPath.startsWith('/') ? nextPath : '/')
    window.location.replace(`/login?next=${next}`)
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    setUser(null)
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
      refreshUser,
      redirectToLogin,
    }),
    [user, isLoading, login, logout, refreshUser, redirectToLogin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
