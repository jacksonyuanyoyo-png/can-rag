"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Plus,
  Search,
  Target,
} from "lucide-react"
import { useLocale } from "./LocaleProvider"
import { deleteKnowledgeBase, listKnowledgeBases } from "@/lib/api/knowledge-bases"
import { formatApiErrorMessage } from "@/lib/api/format-error"
import {
  PAGE_SIZE_OPTIONS,
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
  libraryTag,
  libraryTagMuted,
  libraryPaginationActive,
  libraryPaginationBtn,
  truncateId,
} from "./libraryUi"
import { cls } from "./utils"
import { UI_VISIBILITY } from "@/lib/ui-visibility"

function KnowledgeBaseIcon() {
  return (
    <div className={libraryIconBox}>
      <FileText className="h-4 w-4" strokeWidth={1.5} />
    </div>
  )
}

export default function LibraryPage({ embedded = false }) {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [items, setItems] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const result = await listKnowledgeBases({
        page,
        pageSize,
        q: debouncedQuery || undefined,
      })
      setItems(result.data)
      setTotal(result.pagination.total)
    } catch (err) {
      setError(formatApiErrorMessage(err))
      setItems([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, debouncedQuery])

  useEffect(() => {
    if (pathname === "/library") {
      fetchList()
    }
  }, [pathname, fetchList])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(page, totalPages)

  const resourceLabel = (type) =>
    type === "team" ? t("kbResourceTeam") : t("kbResourcePersonal")

  const isTeamKnowledgeBase = (kb) => kb.resourceType === "team"

  const handleDelete = async (id) => {
    if (!confirm(t("kbDeleteConfirm"))) return
    setDeletingId(id)
    setError("")
    try {
      await deleteKnowledgeBase(id)
      if (items.length === 1 && page > 1) {
        setPage((p) => Math.max(1, p - 1))
      } else {
        await fetchList()
      }
    } catch (err) {
      setError(t("kbDeleteError", { message: formatApiErrorMessage(err) }))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className={embedded ? libraryPageRoot : libraryPageRootStandalone}>
      <div
        className={embedded ? libraryEmbeddedShell : libraryStandaloneShell}
      >
        {!embedded && (
          <div className="mb-6 flex shrink-0 items-center gap-3">
            <Link
              href="/"
              className="theme-focus-ring rounded-full p-2 text-slate-500 transition-colors hover:bg-white hover:text-slate-800"
              aria-label={t("back")}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
            </Link>
          </div>
        )}

        <header className="mb-5 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
            {t("knowledgeBaseSection")}
          </h1>
          {UI_VISIBILITY.kbHitTest ? (
            <button type="button" className={cls("inline-flex items-center gap-2 px-4 py-2", surfaceBtn)}>
              <Target className="h-4 w-4 text-slate-500" strokeWidth={1.5} />
              {t("kbHitTest")}
            </button>
          ) : null}
        </header>

        <div className="mb-4 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              strokeWidth={1.5}
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder={t("kbSearchPlaceholder")}
              className={cls("w-full pl-9 pr-4", surfaceInput)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.push("/library/create")}
              className={cls("inline-flex items-center gap-1.5", primaryBtn)}
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t("kbCreate")}
            </button>
          </div>
        </div>

        {error ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className={libraryCard}>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className={libraryTableHead}>
                  <th className="whitespace-nowrap px-4 py-3">{t("kbColNameId")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("kbColDescription")}</th>
                  <th className="whitespace-nowrap px-4 py-3">{t("kbColFileCount")}</th>
                  <th className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {t("kbColResources")}
                      <Filter className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
                    </span>
                  </th>
                  <th className="whitespace-nowrap px-4 py-3">{t("kbColActions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500">
                      {t("kbLoading")}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-sm text-slate-500">
                      {t("kbNoResults")}
                    </td>
                  </tr>
                ) : (
                  items.map((kb) => (
                    <tr
                      key={kb.id}
                      className={libraryTableRow}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <KnowledgeBaseIcon />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => router.push(`/library/${kb.id}`)}
                              className="truncate text-left text-sm font-medium tracking-tight text-slate-800 transition hover:text-[var(--fi-primary)] hover:underline"
                            >
                              {kb.name}
                            </button>
                            <div className="truncate text-[11px] text-slate-500" title={kb.id}>
                              {truncateId(kb.id)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[140px] truncate px-4 py-3 text-slate-600">
                        {kb.description ?? ""}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                        {kb.fileCount ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={cls(
                            "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                            isTeamKnowledgeBase(kb) ? libraryTagMuted : libraryTag,
                          )}
                        >
                          {resourceLabel(kb.resourceType)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {isTeamKnowledgeBase(kb) ? (
                          <span
                            className="text-sm text-slate-400"
                            title={t("kbTeamNoEdit")}
                          >
                            —
                          </span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              className="theme-link text-sm"
                            >
                              {t("kbEdit")}
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === kb.id}
                              onClick={() => handleDelete(kb.id)}
                              className="text-sm text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                            >
                              {t("kbDelete")}
                            </button>
                          </div>
                        )}
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
                disabled={currentPage <= 1 || loading}
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
                disabled={currentPage >= totalPages || loading}
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
                className={cls(
                  "appearance-none py-1.5 pl-3 pr-8",
                  surfaceInput,
                )}
                aria-label={t("kbPageSize")}
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {t("kbPerPage", { size })}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
