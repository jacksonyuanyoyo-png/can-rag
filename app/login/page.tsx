'use client'

import { Suspense } from 'react'
import LoginForm from '@/components/auth/LoginForm'

function LoginFallback() {
  return (
    <div className="apple-surface flex min-h-dvh w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--fi-primary)]" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  )
}
