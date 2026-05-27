export const PAGE_SIZE_OPTIONS = [10, 20, 50]

/** CHAT A.I+ 风格：浅蓝灰底 #F0F4F9、主色 #5C7CFA、白卡片 */

export const libraryEmbeddedShell =
  "flex h-full min-h-0 w-full flex-col px-3 py-4 sm:px-5 md:px-6"

export const libraryStandaloneShell =
  "mx-auto max-w-[1400px] flex h-full min-h-0 w-full flex-col px-3 py-4 sm:px-5 sm:py-6 md:px-6"

export const libraryPageRoot =
  "flex min-h-0 flex-1 flex-col overflow-hidden text-slate-800"

export const libraryPageRootStandalone =
  "apple-surface flex h-dvh w-full flex-col overflow-hidden text-slate-800"

export const libraryCard =
  "theme-card flex min-h-0 flex-1 flex-col overflow-hidden"

export const libraryFormCard =
  "theme-card p-5 sm:p-6 md:p-8"

export const surfaceInput =
  "theme-input"

export const surfaceBtn =
  "theme-btn-surface theme-focus-ring"

export const primaryBtn =
  "theme-btn-primary theme-focus-ring"

export const libraryIconBox =
  "theme-text-primary grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-slate-50"

export const libraryTableHead =
  "border-b border-slate-100 text-[11px] font-semibold tracking-wide text-slate-500"

export const libraryTableRow =
  "border-b border-slate-50 transition-colors hover:theme-bg-primary-soft"

export const libraryTag =
  "theme-bg-primary-soft theme-text-primary inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"

export const libraryTagMuted =
  "inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600"

export const libraryPaginationActive =
  "theme-bg-primary grid h-8 min-w-8 place-items-center rounded-xl px-2 text-sm font-medium text-white shadow-sm"

export const libraryPaginationBtn =
  "rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:theme-text-primary disabled:opacity-30"

export const libraryLink =
  "theme-link"

export const librarySectionAccent = "theme-accent-bar shrink-0"

export const libraryStepActive =
  "grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--fi-primary)] text-xs font-semibold text-white shadow-sm"

export const libraryStepInactive =
  "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-400"

export const libraryDropZone =
  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center transition-colors"

export const libraryDropZoneActive =
  "theme-border-primary-50 theme-bg-primary-soft"

export const libraryChunkRadioChecked =
  "theme-border-primary-40 theme-bg-primary-soft shadow-sm"

export const libraryChunkRadio =
  "border-slate-200 bg-white hover:theme-border-primary-30 hover:bg-slate-50"

export function truncateId(id, max = 22) {
  if (id.length <= max + 2) return id
  return `${id.slice(0, max)}...`
}

export function formatDateTime(iso, locale = "zh") {
  const d = new Date(iso)
  return d.toLocaleString(locale === "zh" ? "zh-CN" : "en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}
