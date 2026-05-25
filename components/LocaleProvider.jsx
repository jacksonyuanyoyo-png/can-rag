"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { getMessage, formatTimeAgo, LOCALES } from "../lib/locale"

const LocaleContext = createContext({
  locale: "zh",
  setLocale: () => {},
  t: (key) => key,
  formatTimeAgo: (date) => "",
  mounted: false,
})

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState("zh")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem("locale")
      if (saved === "zh" || saved === "en") setLocaleState(saved)
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    const htmlLang = LOCALES.find((l) => l.id === locale)?.htmlLang ?? "zh-CN"
    document.documentElement.lang = htmlLang
    document.documentElement.dataset.locale = locale
  }, [locale, mounted])

  const setLocale = (next) => {
    setLocaleState(next)
    try {
      localStorage.setItem("locale", next)
    } catch {}
  }

  const t = useCallback(
    (key, vars) => getMessage(mounted ? locale : "zh", key, vars),
    [locale, mounted],
  )

  const formatTime = useCallback(
    (date) => formatTimeAgo(date, mounted ? locale : "zh"),
    [locale, mounted],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, formatTimeAgo: formatTime, mounted }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
