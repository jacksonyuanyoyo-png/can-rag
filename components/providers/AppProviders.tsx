'use client'

import type { ReactNode } from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { LocaleProvider } from '@/components/LocaleProvider'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/components/providers/AuthProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <LocaleProvider>
        <AuthProvider>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  )
}
