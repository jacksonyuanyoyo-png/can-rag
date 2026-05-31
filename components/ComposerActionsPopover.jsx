"use client"

import { useEffect, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Checkbox } from "./ui/checkbox"
import { useLocale } from "./LocaleProvider"
import { knowledgeBasesService } from "@/lib/api/services"
import { cls } from "./utils"

const SURFACE_CHECKBOX =
  "border-slate-200 bg-white shadow-sm data-[state=checked]:border-[var(--fi-primary)] data-[state=checked]:bg-[var(--fi-primary)] data-[state=checked]:text-white focus-visible:ring-[color:color-mix(in_srgb,var(--fi-primary)_35%,transparent)]"

export default function ComposerActionsPopover({
  children,
  selectedIds = [],
  onSelectedIdsChange,
  disabled = false,
}) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    const timer = window.setTimeout(async () => {
      setLoading(true)
      try {
        const result = await knowledgeBasesService.list({
          page: 1,
          pageSize: 20,
          q: query.trim() || undefined,
        })
        if (!cancelled) setItems(result.data)
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, query.trim() ? 300 : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, query])

  const toggleId = (id) => {
    if (disabled || !onSelectedIdsChange) return
    onSelectedIdsChange(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    )
  }

  const handleOpenChange = (nextOpen) => {
    if (disabled) return
    setOpen(nextOpen)
    if (!nextOpen) setQuery("")
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <div className="relative inline-flex">
        <PopoverTrigger asChild disabled={disabled}>
          {children}
        </PopoverTrigger>
        {selectedIds.length > 0 ? (
          <span
            className="pointer-events-none absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--fi-primary)] px-1 text-[10px] font-semibold leading-none text-white"
            aria-hidden
          >
            {selectedIds.length}
          </span>
        ) : null}
      </div>
      <PopoverContent className="w-auto p-0" align="start" side="top">
        <div className="flex w-[280px] flex-col">
          <div className="border-b border-slate-200/80 px-3 py-2.5 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
              {t("composerKbTitle")}
            </p>
            {selectedIds.length > 0 ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {t("composerKbSelected", { count: selectedIds.length })}
              </p>
            ) : null}
          </div>

          <div className="border-b border-slate-200/80 px-3 py-2 dark:border-slate-700">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 dark:border-slate-600 dark:bg-slate-900/40">
              <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("composerKbSearch")}
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="max-h-[240px] overflow-y-auto overscroll-contain p-2">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("composerKbLoading")}
              </div>
            ) : items.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {t("composerKbEmpty")}
              </p>
            ) : (
              <ul className="space-y-0.5">
                {items.map((kb) => {
                  const checked = selectedIds.includes(kb.id)
                  return (
                    <li key={kb.id}>
                      <button
                        type="button"
                        onClick={() => toggleId(kb.id)}
                        className={cls(
                          "flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                          checked && "bg-[color:color-mix(in_srgb,var(--fi-primary)_8%,white)]",
                        )}
                      >
                        <Checkbox
                          className={cls(SURFACE_CHECKBOX, "mt-0.5")}
                          checked={checked}
                          tabIndex={-1}
                          aria-hidden
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                            {kb.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                            {t("composerKbFileCount", { count: kb.fileCount ?? 0 })}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
