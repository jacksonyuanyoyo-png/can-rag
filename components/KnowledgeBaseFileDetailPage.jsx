"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Search,
  Settings,
  Target,
  Trash2,
} from "lucide-react"
import { useLocale } from "./LocaleProvider"
import {
  deleteKnowledgeBaseFile,
  getKnowledgeBaseFile,
  listKnowledgeBaseFileChunks,
} from "@/lib/api/knowledge-bases"
import { formatApiErrorMessage } from "@/lib/api/format-error"
import { ApiError } from "@/lib/api/api-error"
import { ErrorCodes } from "@/lib/api/error-codes"
import {
  libraryCard,
  libraryEmbeddedShell,
  libraryLink,
  libraryPageRoot,
  libraryPageRootStandalone,
  primaryBtn,
  surfaceBtn,
  surfaceInput,
} from "./libraryUi"
import { UI_VISIBILITY } from "@/lib/ui-visibility"
import { cls } from "./utils"
import KbMarkdownPreview, { markdownPreviewText } from "./KbMarkdownPreview"
import SourceFilePreview, { downloadKbSourceFile } from "./SourceFilePreview"

function ChunkListItem({ chunk, selected, expanded, onSelect, onToggle, t }) {
  return (
    <div
      className={cls(
        "rounded-xl border transition-colors",
        selected ? "theme-border-primary-40 theme-bg-primary-soft" : "border-slate-200 bg-white",
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(chunk.dataId)}
        className="flex w-full items-start gap-2 px-3 py-2.5 text-left"
      >
        <span className="shrink-0 text-xs font-semibold text-slate-500">
          #{chunk.chunkIndex + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-700">{t("kbFileDetailChunkOriginal")}</span>
            <span className="text-[11px] text-slate-400">
              {t("kbFileDetailChunkChars", { count: chunk.charCount ?? 0 })}
            </span>
            {chunk.page != null ? (
              <span className="text-[11px] text-slate-400">
                {t("kbFileDetailPage", { page: chunk.page })}
              </span>
            ) : null}
          </div>
          {!expanded ? (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
              {markdownPreviewText(chunk.text)}
            </p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("kbFileDetailChunkEnabled")}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-slate-100 px-3 py-2.5">
          <KbMarkdownPreview markdown={chunk.text} className="text-xs" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="mt-2 inline-flex items-center text-slate-500 hover:text-[var(--fi-primary)]"
            aria-label="Collapse"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onToggle()
            }}
            className="inline-flex items-center text-slate-500 hover:text-[var(--fi-primary)]"
            aria-label="Expand"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default function KnowledgeBaseFileDetailPage({ embedded = false }) {
  const { t } = useLocale()
  const router = useRouter()
  const params = useParams()
  const kbId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""
  const fileId =
    typeof params?.fileId === "string"
      ? params.fileId
      : Array.isArray(params?.fileId)
        ? params.fileId[0]
        : ""

  const [file, setFile] = useState(null)
  const [chunks, setChunks] = useState([])
  const [selectedDataId, setSelectedDataId] = useState(null)
  const [expandedDataId, setExpandedDataId] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const filteredChunks = useMemo(() => {
    const needle = searchQuery.trim().toLowerCase()
    if (!needle) return chunks
    return chunks.filter((chunk) => chunk.text.toLowerCase().includes(needle))
  }, [chunks, searchQuery])

  const loadFileAndChunks = useCallback(async () => {
    if (!kbId || !fileId) return false
    try {
      const [fileResult, chunksResult] = await Promise.all([
        getKnowledgeBaseFile(kbId, fileId),
        listKnowledgeBaseFileChunks(kbId, fileId, { page: 1, pageSize: 100 }),
      ])
      setFile(fileResult.data)
      setChunks(chunksResult.data ?? [])
      setNotFound(false)
      const first = chunksResult.data?.[0]
      if (first) {
        setSelectedDataId(first.dataId)
      }
      return true
    } catch (err) {
      if (ApiError.isApiError(err) && err.code === ErrorCodes.FILE_NOT_FOUND) {
        setNotFound(true)
        setFile(null)
      } else {
        setError(t("kbLoadError", { message: formatApiErrorMessage(err) }))
      }
      return false
    }
  }, [kbId, fileId, t])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError("")
      await loadFileAndChunks()
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loadFileAndChunks])

  const handleDownloadSource = async () => {
    if (!kbId || !fileId || !file) return
    setDownloading(true)
    setError("")
    try {
      await downloadKbSourceFile(kbId, fileId, file)
    } catch (err) {
      setError(t("kbDownloadError", { message: formatApiErrorMessage(err) }))
    } finally {
      setDownloading(false)
    }
  }

  const handleDeleteFile = async () => {
    if (!kbId || !fileId || !file) return
    if (!confirm(t("kbFileDeleteConfirm", { name: file.name }))) return
    setDeleting(true)
    setError("")
    try {
      await deleteKnowledgeBaseFile(kbId, fileId)
      router.push(`/library/${kbId}`)
    } catch (err) {
      setError(t("kbDeleteError", { message: formatApiErrorMessage(err) }))
    } finally {
      setDeleting(false)
    }
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

  if (notFound || !file) {
    return (
      <div
        className={cls(
          embedded
            ? "flex min-h-0 flex-1 flex-col items-center justify-center text-slate-800"
            : "apple-surface flex h-dvh flex-col items-center justify-center text-slate-800",
        )}
      >
        <p className="text-sm text-slate-500">{t("kbFileDetailNotFound")}</p>
        <Link href={`/library/${kbId}`} className={cls("mt-4 text-sm", libraryLink)}>
          {t("kbFileDetailBack")}
        </Link>
      </div>
    )
  }

  return (
    <div className={embedded ? libraryPageRoot : libraryPageRootStandalone}>
      <div className={cls(libraryEmbeddedShell, "min-h-0 flex-1")}>
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href={`/library/${kbId}`}
              className="theme-focus-ring shrink-0 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-[var(--fi-primary)]"
              aria-label={t("kbFileDetailBack")}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
            </Link>
            <h1 className="truncate text-base font-semibold tracking-tight text-slate-800 sm:text-lg">
              {file.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={handleDeleteFile}
              className={cls(
                "inline-flex items-center gap-1.5 px-3 py-2 text-red-600",
                surfaceBtn,
                deleting && "opacity-50",
              )}
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
              {t("kbFileDelete")}
            </button>
            <button
              type="button"
              disabled={downloading}
              onClick={handleDownloadSource}
              className={cls(
                "inline-flex items-center gap-1.5 px-3 py-2",
                surfaceBtn,
                downloading && "opacity-50",
              )}
            >
              <Download className="h-4 w-4" strokeWidth={1.5} />
              {t("kbFileDetailDownload")}
            </button>
            <button type="button" disabled className={cls("inline-flex items-center gap-1.5 px-3 py-2", surfaceBtn, "opacity-50")}>
              <Settings className="h-4 w-4" strokeWidth={1.5} />
              {t("kbFileDetailConfig")}
            </button>
            {UI_VISIBILITY.kbHitTest ? (
              <button type="button" disabled className={cls("inline-flex items-center gap-1.5 px-3 py-2", primaryBtn, "opacity-50")}>
                <Target className="h-4 w-4" strokeWidth={1.5} />
                {t("kbHitTest")}
              </button>
            ) : null}
          </div>
        </header>

        {error ? (
          <p className="mb-3 text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className={cls(libraryCard, "min-h-0 flex-1")}>
          <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-12">
            {/* 原文对照 */}
            <section className="flex min-h-[280px] flex-col overflow-hidden border-b border-slate-100 lg:col-span-6 lg:h-full lg:min-h-0 lg:border-b-0 lg:border-r">
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">{t("kbFileDetailOriginal")}</h2>
                <Info className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
              </div>
              <div className="shrink-0 bg-sky-50 px-4 py-2 text-xs leading-relaxed text-sky-800">
                {t("kbFileDetailOriginalHint")}
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <SourceFilePreview kbId={kbId} fileId={fileId} file={file} t={t} />
              </div>
            </section>

            {/* 切片信息 */}
            <section className="flex min-h-[280px] flex-col border-b border-slate-100 lg:col-span-6 lg:border-b-0">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">{t("kbFileDetailChunks")}</h2>
                <div className="relative min-w-[10rem] flex-1 sm:max-w-xs">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("kbFileDetailChunkSearch")}
                    className={cls("w-full py-1.5 pl-8 pr-3 text-xs", surfaceInput)}
                  />
                </div>
              </div>
              <div className="shrink-0 border-b border-slate-100 px-4 py-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="theme-bg-primary-soft theme-text-primary rounded-full px-2.5 py-0.5 font-medium">
                    {t("kbFileDetailChunkAll")} ({chunks.length})
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600">
                    {t("kbFileDetailChunkOriginal")} ({chunks.length})
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-400">
                    {t("kbFileDetailChunkCustom")} (0)
                  </span>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {filteredChunks.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">{t("kbFileDetailNoChunks")}</p>
                ) : (
                  filteredChunks.map((chunk) => (
                    <ChunkListItem
                      key={chunk.dataId}
                      chunk={chunk}
                      selected={selectedDataId === chunk.dataId}
                      expanded={expandedDataId === chunk.dataId}
                      onSelect={setSelectedDataId}
                      onToggle={() =>
                        setExpandedDataId((prev) =>
                          prev === chunk.dataId ? null : chunk.dataId,
                        )
                      }
                      t={t}
                    />
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
