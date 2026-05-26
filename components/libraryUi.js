export const PAGE_SIZE_OPTIONS = [10, 20, 50]

/** 嵌入主区域时的外边距（列表页 / 详情页共用） */
export const libraryEmbeddedShell =
  "flex h-full min-h-0 w-full flex-col px-2 py-3 sm:px-3 md:px-4"

export const libraryStandaloneShell =
  "mx-auto max-w-[1400px] flex h-full min-h-0 w-full flex-col px-2 py-3 sm:px-3 sm:py-5 md:px-4"

export const surfaceInput =
  "rounded-2xl border border-white/55 bg-white/55 py-2.5 text-sm text-gray-950 shadow-inner backdrop-blur-xl outline-none placeholder:text-gray-400 focus:border-white/80 focus:ring-2 focus:ring-black/10"

export const surfaceBtn =
  "rounded-2xl border border-white/55 bg-white/55 text-sm font-medium text-gray-700 shadow-inner backdrop-blur-xl transition hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"

export const primaryBtn =
  "rounded-2xl bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"

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
