'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLocale } from '@/components/LocaleProvider'
import { useAuth } from '@/components/providers/AuthProvider'
import { useApiError } from '@/hooks/useApiError'
import { primaryBtn, surfaceInput } from '@/components/libraryUi'
import { cls } from '@/components/utils'

export default function LoginForm() {
  const { t } = useLocale()
  const { login, isAuthenticated, isLoading } = useAuth()
  const { showApiError } = useApiError()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = searchParams.get('next')
      router.replace(next && next.startsWith('/') ? next : '/')
    }
  }, [isAuthenticated, isLoading, router, searchParams])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      await login({ email: email.trim(), password })
      const next = searchParams.get('next')
      router.replace(next && next.startsWith('/') ? next : '/')
    } catch (error) {
      showApiError(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="apple-surface flex min-h-dvh w-full items-center justify-center px-4 py-10">
      <div className="theme-card w-full max-w-md p-6 sm:p-8">
        <div className="mb-8 text-center">
          <img
            src="/brand/fidelity-mark.svg"
            alt="Fidelity"
            className="mx-auto mb-4 h-12 w-12"
          />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {t('loginTitle')}
          </h1>
          <p className="mt-2 text-sm text-slate-500">{t('loginSubtitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-slate-800">
              {t('loginEmail')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cls('w-full', surfaceInput)}
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-slate-800">
              {t('loginPassword')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cls('w-full', surfaceInput)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || isLoading}
            className={cls('w-full py-2.5', primaryBtn, 'disabled:opacity-60')}
          >
            {submitting ? t('loginSigningIn') : t('loginSubmit')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">{t('loginDevHint')}</p>
      </div>
    </div>
  )
}
