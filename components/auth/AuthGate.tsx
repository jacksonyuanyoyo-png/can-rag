'use client'

import { useLayoutEffect, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const pathname = usePathname()

  useLayoutEffect(() => {
    if (isLoading || isAuthenticated) return
    const next = encodeURIComponent(pathname || '/')
    window.location.replace(`/login?next=${next}`)
  }, [isAuthenticated, isLoading, pathname])

  if (isLoading) {
    return (
      <div className="apple-surface flex h-dvh w-full items-center justify-center text-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--fi-primary)]" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="apple-surface flex h-dvh w-full items-center justify-center text-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--fi-primary)]" />
      </div>
    )
  }

  return children
}
