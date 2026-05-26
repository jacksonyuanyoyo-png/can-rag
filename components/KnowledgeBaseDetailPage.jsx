"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Target,
} from "lucide-react"
import { useLocale } from "./LocaleProvider"
import { getKnowledgeBaseById } from "./mockKnowledgeBases"
import { getFilesForKnowledgeBase } from "./mockKnowledgeBaseFiles"
import {
  PAGE_SIZE_OPTIONS,
  formatDateTime,
  primaryBtn,
  surfaceBtn,
  surfaceInput,
  libraryEmbeddedShell,
  libraryStandaloneShell,
  truncateId,
} from "./libraryUi"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cls } from "./utils"

function FileIcon() {
  return (
    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/55 bg-white/55 text-gray-600 shadow-inner backdrop-blur-xl">
      <FileText className="h-4 w-4" strokeWidth={1.5} />
    </div>
  )
}

export default function KnowledgeBaseDetailPage({ embedded = false }) {
  const { t, locale } = useLocale()
  const router = useRouter()
  const params = useParams()
  const kbId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""

  const knowledgeBase = getKnowledgeBaseById(kbId)
  const allFiles = useMemo(() => getFilesForKnowledgeBase(kbId), [kbId])

  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [copied, setCopied] = useState(false)

  const resourceLabel =
    knowledgeBase?.resourceType === "team" ? t("kbResourceTeam") : t("kbResourcePersonal")

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return allFiles
    return allFiles.filter(
      (f) => f.name.toLowerCase().includes(q) || f.id.toLowerCase().includes(q),
    )
  }, [allFiles, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, currentPage, pageSize])

  const copyId = async () => {
    if (!knowledgeBase?.id) return
    try {
      await navigator.clipboard.writeText(knowledgeBase.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (!knowledgeBase) {
    return (
      <div
        className={cls(
          embedded
            ? "flex min-h-0 flex-1 flex-col items-center justify-center text-gray-950"
            : "apple-surface flex h-dvh flex-col items-center justify-center text-gray-950",
        )}
      >
        <p className="text-sm text-gray-500">{t("kbDetailNotFound")}</p>
        <Link href="/library" className="mt-4 text-sm text-gray-700 underline hover:text-gray-950">
          {t("kbBackToList")}
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cls(
        embedded
          ? "flex min-h-0 flex-1 flex-col overflow-hidden text-gray-950"
          : "apple-surface flex h-dvh w-full flex-col overflow-hidden text-gray-950",
      )}
    >
      <div
        className={embedded ? libraryEmbeddedShell : libraryStandaloneShell}
      >
        <nav className="mb-3 shrink-0 text-sm text-gray-500">
          <Link href="/library" className="transition hover:text-gray-950">
            {t("knowledgeBaseSection")}
          </Link>
          <span className="mx-1.5 text-gray-400">/</span>
        </nav>

        <header className="mb-5 shrink-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden pr-2 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl">
                {knowledgeBase.name}
              </h1>
              <div className="mt-3 flex w-full max-w-full flex-wrap items-center gap-x-5 gap-y-2 text-left text-sm text-gray-600">
                <div className="flex min-w-0 max-w-full items-center gap-1.5">
                  <span className="shrink-0 text-gray-500">{t("kbDetailId")}</span>
                  <code
                    className="truncate text-xs text-gray-700"
                    title={knowledgeBase.id}
                  >
                    {truncateId(knowledgeBase.id, 28)}
                  </code>
                  <button
                    type="button"
                    onClick={copyId}
                    className="shrink-0 rounded-full p-1 text-gray-500 transition hover:bg-white/55 hover:text-gray-950"
                    title={copied ? t("kbDetailCopied") : t("kbDetailCopy")}
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
                <span className="shrink-0">
                  <span className="text-gray-500">{t("kbDetailResource")}</span> {resourceLabel}
                </span>
                <span className="shrink-0">
                  <span className="text-gray-500">{t("kbDetailUpdated")}</span>{" "}
                  {formatDateTime(knowledgeBase.updatedAt, locale)}
                </span>
              </div>
              {knowledgeBase.description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="mt-2 block w-full min-w-0 cursor-default truncate text-left text-sm text-gray-600">
                      {knowledgeBase.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="max-w-md border border-white/55 bg-white/95 px-3 py-2 text-left text-xs leading-relaxed font-normal text-gray-800 shadow-lg backdrop-blur-xl"
                  >
                    {knowledgeBase.description}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="rounded-full p-2 text-gray-600 transition hover:bg-white/55"
                aria-label={t("more")}
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button type="button" className={cls("inline-flex items-center gap-2 px-4 py-2", surfaceBtn)}>
                <Target className="h-4 w-4 text-gray-500" strokeWidth={1.5} />
                {t("kbHitTest")}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-4 flex shrink-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative min-w-0 flex-1 lg:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder={t("kbFileSearchPlaceholder")}
              className={cls("w-full pl-9 pr-4", surfaceInput)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-2xl border border-white/55 bg-white/55 p-2.5 text-gray-700 shadow-inner backdrop-blur-xl transition hover:bg-white/70"
              aria-label={t("kbDetailRefresh")}
            >
              <RefreshCw className="h-4 w-4" strokeWidth={1.5} />
            </button>
            <button type="button" className={cls("px-4 py-2", surfaceBtn)}>
              {t("kbDetailBatch")}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/library/${kbId}/import`)}
              className={cls("inline-flex items-center gap-1.5", primaryBtn)}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t("kbDetailImport")}
            </button>
          </div>
        </div>

        <div className="glass-panel flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/45 text-[11px] font-semibold tracking-wide text-gray-500">
                  <th className="whitespace-nowrap px-4 py-3">{t("kbFileColNameId")}</th>
                  <th className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {t("kbFileColStatus")}
                      <Filter className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">{t("kbFileColVolume")}</th>
                  <th className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {t("kbFileColFormat")}
                      <Filter className="h-3.5 w-3.5 text-gray-400" strokeWidth={1.5} />
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">{t("kbFileColUploaded")}</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-gray-500">
                      {t("kbFileNoResults")}
                    </td>
                  </tr>
                ) : (
                  paginated.map((file) => (
                    <tr
                      key={file.id}
                      className="border-b border-white/35 transition-colors hover:bg-white/55"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium tracking-tight text-gray-950">
                              {file.name}
                            </div>
                            <div className="truncate text-[11px] text-gray-500" title={file.id}>
                              {truncateId(file.id)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {t("kbFileStatusAvailable")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {t("kbFileCharCount", { count: file.charCount })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{file.format}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatDateTime(file.uploadedAt, locale)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-white/45 px-4 py-3 text-sm text-gray-500">
            <span>{t("kbTotalItems", { count: filtered.length })}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-full p-1.5 text-gray-600 transition hover:bg-white/55 disabled:opacity-30"
                aria-label={t("kbPrevPage")}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <span className="grid h-8 min-w-8 place-items-center rounded-2xl bg-white/70 px-2 text-sm font-medium text-gray-950 shadow-sm">
                {currentPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-full p-1.5 text-gray-600 transition hover:bg-white/55 disabled:opacity-30"
                aria-label={t("kbNextPage")}
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className={cls("appearance-none py-1.5 pl-3 pr-8", surfaceInput)}
                aria-label={t("kbPageSize")}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {t("kbPerPage", { size })}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
