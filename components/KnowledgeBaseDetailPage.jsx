"use client"

import { useCallback, useEffect, useState } from "react"
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
import {
  getKnowledgeBase,
  getKnowledgeBaseIndexStats,
  listKnowledgeBaseFiles,
} from "@/lib/api/knowledge-bases"
import { getFileStatusDotClass, getFileStatusLabel, getIndexStatusLabel } from "@/lib/api/kb-display"
import { formatApiErrorMessage } from "@/lib/api/format-error"
import { ApiError } from "@/lib/api/api-error"
import { ErrorCodes } from "@/lib/api/error-codes"
import {
  PAGE_SIZE_OPTIONS,
  formatDateTime,
  primaryBtn,
  surfaceBtn,
  surfaceInput,
  libraryEmbeddedShell,
  libraryStandaloneShell,
  libraryPageRoot,
  libraryPageRootStandalone,
  libraryCard,
  libraryIconBox,
  libraryTableHead,
  libraryTableRow,
  libraryPaginationActive,
  libraryPaginationBtn,
  libraryLink,
  truncateId,
} from "./libraryUi"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cls } from "./utils"

function FileIcon() {
  return (
    <div className={libraryIconBox}>
      <FileText className="h-4 w-4" strokeWidth={1.5} />
    </div>
  )
}

export default function KnowledgeBaseDetailPage({ embedded = false }) {
  const { t, locale } = useLocale()
  const router = useRouter()
  const params = useParams()
  const kbId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""

  const [knowledgeBase, setKnowledgeBase] = useState(null)
  const [indexStats, setIndexStats] = useState(null)
  const [files, setFiles] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filesLoading, setFilesLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchKnowledgeBase = useCallback(async () => {
    if (!kbId) return false
    try {
      const { data } = await getKnowledgeBase(kbId)
      setKnowledgeBase(data)
      setNotFound(false)
      return true
    } catch (err) {
      if (ApiError.isApiError(err) && err.code === ErrorCodes.KB_NOT_FOUND) {
        setNotFound(true)
        setKnowledgeBase(null)
      } else {
        setError(t("kbLoadError", { message: formatApiErrorMessage(err) }))
      }
      return false
    }
  }, [kbId, t])

  const fetchIndexStats = useCallback(async () => {
    if (!kbId) return
    try {
      const { data } = await getKnowledgeBaseIndexStats(kbId)
      setIndexStats(data)
    } catch {
      setIndexStats(null)
    }
  }, [kbId])

  const fetchFiles = useCallback(async () => {
    if (!kbId) return
    setFilesLoading(true)
    try {
      const result = await listKnowledgeBaseFiles(kbId, {
        page,
        pageSize,
        q: debouncedQuery || undefined,
      })
      setFiles(result.data)
      setTotal(result.pagination.total)
    } catch (err) {
      setError(t("kbLoadError", { message: formatApiErrorMessage(err) }))
      setFiles([])
      setTotal(0)
    } finally {
      setFilesLoading(false)
    }
  }, [kbId, page, pageSize, debouncedQuery, t])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      const ok = await fetchKnowledgeBase()
      if (!cancelled && ok) {
        await fetchIndexStats()
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [fetchKnowledgeBase, fetchIndexStats])

  useEffect(() => {
    if (loading || notFound || !knowledgeBase) return
    fetchFiles()
  }, [loading, notFound, knowledgeBase, fetchFiles])

  const handleRefresh = async () => {
    setRefreshing(true)
    setError("")
    await Promise.all([fetchKnowledgeBase(), fetchIndexStats(), fetchFiles()])
    setRefreshing(false)
  }

  const resourceLabel =
    knowledgeBase?.resourceType === "team" ? t("kbResourceTeam") : t("kbResourcePersonal")

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  const copyId = async () => {
    if (!knowledgeBase?.id) return
    try {
      await navigator.clipboard.writeText(knowledgeBase.id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  if (loading) {
    return (
      <div
        className={cls(
          embedded
            ? "flex min-h-0 flex-1 flex-col items-center justify-center text-slate-800"
            : "apple-surface flex h-dvh flex-col items-center justify-center text-slate-800",
        )}
      >
        <p className="text-sm text-slate-500">{t("kbLoading")}</p>
      </div>
    )
  }

  if (notFound || !knowledgeBase) {
    return (
      <div
        className={cls(
          embedded
            ? "flex min-h-0 flex-1 flex-col items-center justify-center text-slate-800"
            : "apple-surface flex h-dvh flex-col items-center justify-center text-slate-800",
        )}
      >
        <p className="text-sm text-slate-500">{t("kbDetailNotFound")}</p>
        <Link href="/library" className={cls("mt-4 text-sm", libraryLink)}>
          {t("kbBackToList")}
        </Link>
      </div>
    )
  }

  return (
    <div className={embedded ? libraryPageRoot : libraryPageRootStandalone}>
      <div
        className={embedded ? libraryEmbeddedShell : libraryStandaloneShell}
      >
        <nav className="mb-3 shrink-0 text-sm text-slate-500">
          <Link href="/library" className={libraryLink}>
            {t("knowledgeBaseSection")}
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
        </nav>

        <header className="mb-5 shrink-0">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden pr-2 text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
                {knowledgeBase.name}
              </h1>
              <div className="mt-3 flex w-full max-w-full flex-wrap items-center gap-x-5 gap-y-2 text-left text-sm text-slate-600">
                <div className="flex min-w-0 max-w-full items-center gap-1.5">
                  <span className="shrink-0 text-slate-500">{t("kbDetailId")}</span>
                  <code
                    className="truncate text-xs text-slate-700"
                    title={knowledgeBase.id}
                  >
                    {truncateId(knowledgeBase.id, 28)}
                  </code>
                  <button
                    type="button"
                    onClick={copyId}
                    className="shrink-0 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-[#5C7CFA]"
                    title={copied ? t("kbDetailCopied") : t("kbDetailCopy")}
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
                <span className="shrink-0">
                  <span className="text-slate-500">{t("kbDetailResource")}</span> {resourceLabel}
                </span>
                <span className="shrink-0">
                  <span className="text-slate-500">{t("kbDetailUpdated")}</span>{" "}
                  {formatDateTime(knowledgeBase.updatedAt, locale)}
                </span>
                {indexStats ? (
                  <span className="shrink-0">
                    <span className="text-slate-500">{t("kbIndexStatus")}</span>{" "}
                    {getIndexStatusLabel(indexStats.status, t)}
                    {" · "}
                    {t("kbIndexStatsSummary", {
                      ready: indexStats.readyFileCount ?? indexStats.fileCount ?? 0,
                      total: indexStats.fileCount ?? 0,
                      chunks: indexStats.chunkCount ?? 0,
                    })}
                  </span>
                ) : null}
              </div>
              {knowledgeBase.description ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="mt-2 block w-full min-w-0 cursor-default truncate text-left text-sm text-slate-600">
                      {knowledgeBase.description}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    sideOffset={6}
                    className="max-w-md border border-slate-200 bg-white px-3 py-2 text-left text-xs leading-relaxed font-normal text-slate-700 shadow-lg"
                  >
                    {knowledgeBase.description}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#5C7CFA]"
                aria-label={t("more")}
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <button type="button" className={cls("inline-flex items-center gap-2 px-4 py-2", surfaceBtn)}>
                <Target className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
                {t("kbHitTest")}
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

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
              disabled={refreshing}
              onClick={handleRefresh}
              className={cls("p-2.5", surfaceBtn, refreshing && "opacity-60")}
              aria-label={t("kbDetailRefresh")}
            >
              <RefreshCw className={cls("h-4 w-4", refreshing && "animate-spin")} strokeWidth={1.5} />
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

        <div className={libraryCard}>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className={libraryTableHead}>
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
                {filesLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500">
                      {t("kbLoading")}
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500">
                      {t("kbFileNoResults")}
                    </td>
                  </tr>
                ) : (
                  files.map((file) => (
                    <tr
                      key={file.id}
                      className={libraryTableRow}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileIcon />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium tracking-tight text-slate-800">
                              {file.name}
                            </div>
                            <div className="truncate text-[11px] text-slate-500" title={file.id}>
                              {truncateId(file.id)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600">
                          <span
                            className={cls("h-1.5 w-1.5 rounded-full", getFileStatusDotClass(file.status))}
                          />
                          {getFileStatusLabel(file.status, t)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {t("kbFileCharCount", { count: file.charCount ?? 0 })}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">{file.format ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {file.uploadedAt ? formatDateTime(file.uploadedAt, locale) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
            <span>{t("kbTotalItems", { count: total })}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1 || filesLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={libraryPaginationBtn}
                aria-label={t("kbPrevPage")}
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <span className={libraryPaginationActive}>
                {currentPage}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages || filesLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className={libraryPaginationBtn}
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
