"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Search,
  Settings,
  Target,
} from "lucide-react"
import { useLocale } from "./LocaleProvider"
import {
  getKnowledgeBaseFile,
  getKnowledgeBaseFileChunkDetail,
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
import { cls } from "./utils"

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
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">{chunk.text}</p>
          ) : null}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 text-[11px] text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t("kbFileDetailChunkEnabled")}
        </span>
      </button>
      {expanded ? (
        <div className="border-t border-slate-100 px-3 py-2.5">
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{chunk.text}</p>
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

function OriginalTextPanel({ chunkDetail, loading, t }) {
  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
        {t("kbLoading")}
      </div>
    )
  }

  if (!chunkDetail) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
        {t("kbFileDetailNoChunks")}
      </div>
    )
  }

  const { target, context } = chunkDetail

  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mx-auto max-w-2xl space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {context.before.map((item) => (
          <p
            key={item.dataId}
            className="whitespace-pre-wrap text-sm leading-relaxed text-slate-500"
          >
            {item.text}
          </p>
        ))}
        <p className="whitespace-pre-wrap rounded-lg bg-violet-50 px-3 py-2 text-sm leading-relaxed text-slate-800 ring-1 ring-violet-100">
          {target.text}
        </p>
        {context.after.map((item) => (
          <p
            key={item.dataId}
            className="whitespace-pre-wrap text-sm leading-relaxed text-slate-500"
          >
            {item.text}
          </p>
        ))}
      </div>
    </div>
  )
}

export default function KnowledgeBaseFileDetailPage({ embedded = false }) {
  const { t } = useLocale()
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
  const [chunkDetail, setChunkDetail] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState("")

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

  useEffect(() => {
    if (!kbId || !fileId || !selectedDataId) {
      setChunkDetail(null)
      return
    }
    let cancelled = false
    ;(async () => {
      setDetailLoading(true)
      try {
        const { data } = await getKnowledgeBaseFileChunkDetail(kbId, fileId, selectedDataId, 2)
        if (!cancelled) setChunkDetail(data)
      } catch (err) {
        if (!cancelled) {
          setChunkDetail(null)
          setError(t("kbLoadError", { message: formatApiErrorMessage(err) }))
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [kbId, fileId, selectedDataId, t])

  const selectedChunk = chunks.find((c) => c.dataId === selectedDataId)
  const indexes = chunkDetail?.target?.indexes ?? selectedChunk?.indexes ?? []

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
            <button type="button" disabled className={cls("inline-flex items-center gap-1.5 px-3 py-2", surfaceBtn, "opacity-50")}>
              <Download className="h-4 w-4" strokeWidth={1.5} />
              {t("kbFileDetailDownload")}
            </button>
            <button type="button" disabled className={cls("inline-flex items-center gap-1.5 px-3 py-2", surfaceBtn, "opacity-50")}>
              <Settings className="h-4 w-4" strokeWidth={1.5} />
              {t("kbFileDetailConfig")}
            </button>
            <button type="button" disabled className={cls("inline-flex items-center gap-1.5 px-3 py-2", primaryBtn, "opacity-50")}>
              <Target className="h-4 w-4" strokeWidth={1.5} />
              {t("kbHitTest")}
            </button>
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
            <section className="flex min-h-[280px] flex-col border-b border-slate-100 lg:col-span-5 lg:border-b-0 lg:border-r">
              <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">{t("kbFileDetailOriginal")}</h2>
                <Info className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.5} />
              </div>
              <div className="shrink-0 bg-sky-50 px-4 py-2 text-xs leading-relaxed text-sky-800">
                {t("kbFileDetailOriginalHint")}
              </div>
              <OriginalTextPanel chunkDetail={chunkDetail} loading={detailLoading} t={t} />
            </section>

            {/* 切片信息 */}
            <section className="flex min-h-[280px] flex-col border-b border-slate-100 lg:col-span-4 lg:border-b-0 lg:border-r">
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

            {/* 切片知识点 */}
            <section className="flex min-h-[240px] flex-col lg:col-span-3">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-slate-800">
                  {t("kbFileDetailIndexes")} ({indexes.length})
                </h2>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {indexes.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">{t("kbFileDetailNoIndexes")}</p>
                ) : (
                  indexes.map((index) => (
                    <div
                      key={index.indexId}
                      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                    >
                      <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
                        {index.text}
                      </p>
                      <p className="mt-2 text-[11px] text-slate-400">{t("kbFileDetailIndexType")}</p>
                    </div>
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
