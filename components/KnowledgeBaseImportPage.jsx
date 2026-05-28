"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"
import { useLocale } from "./LocaleProvider"
import { getKnowledgeBase } from "@/lib/api/knowledge-bases"
import {
  cancelImportJob,
  isImportJobTerminal,
  pollImportJob,
  retryImportJob,
  uploadAndImportFiles,
} from "@/lib/api/uploads"
import { formatApiErrorMessage } from "@/lib/api/format-error"
import { ApiError } from "@/lib/api/api-error"
import { ErrorCodes } from "@/lib/api/error-codes"
import {
  libraryEmbeddedShell,
  libraryPageRoot,
  libraryPageRootStandalone,
  libraryFormCard,
  librarySectionAccent,
  libraryStepActive,
  libraryStepInactive,
  libraryDropZone,
  libraryDropZoneActive,
  libraryChunkRadio,
  libraryChunkRadioChecked,
  libraryLink,
  primaryBtn,
  surfaceBtn,
} from "./libraryUi"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { cls } from "./utils"

const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_FILE_COUNT = 100

const FORM_GRID =
  "grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-[minmax(0,max-content)_minmax(0,1fr)] sm:gap-x-8 sm:gap-y-6"

/** 与工程主色一致，覆盖 ui/checkbox 默认 primary 蓝色 */
const SURFACE_CHECKBOX =
  "border-slate-200 bg-white shadow-sm data-[state=checked]:border-[var(--fi-primary)] data-[state=checked]:bg-[var(--fi-primary)] data-[state=checked]:text-white focus-visible:ring-[color:color-mix(in_srgb,var(--fi-primary)_35%,transparent)]"

function StepIndicator({ step, label, active, completed }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cls(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
          active || completed ? libraryStepActive : libraryStepInactive,
        )}
      >
        {completed ? <Check className="h-4 w-4" strokeWidth={2} /> : step}
      </span>
      <span
        className={cls(
          "truncate text-sm font-medium",
          active || completed ? "text-slate-800" : "text-slate-400",
        )}
      >
        {label}
      </span>
    </div>
  )
}

function SectionTitle({ children, badge }) {
  return (
    <div className="col-span-full mb-1 flex flex-wrap items-center gap-2 sm:mb-2">
      <span className={librarySectionAccent} aria-hidden />
      <h2 className="text-sm font-semibold tracking-tight text-slate-800">{children}</h2>
      {badge}
    </div>
  )
}

function FormLabel({ children, required, htmlFor }) {
  return (
    <div
      className={cls(
        "text-sm font-medium leading-snug text-slate-800 sm:pt-0.5",
        htmlFor && "sm:min-h-[2.625rem] sm:flex sm:items-center",
      )}
    >
      {htmlFor ? (
        <label htmlFor={htmlFor} className="min-w-0 break-words">
          {children}
          {required ? (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : (
        <span className="min-w-0 break-words">
          {children}
          {required ? (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          ) : null}
        </span>
      )}
    </div>
  )
}

function ChunkRadio({ id, name, label, description, checked, onChange, disabled }) {
  return (
    <label
      htmlFor={id}
      className={cls(
        "flex min-w-[8.5rem] flex-1 gap-2.5 rounded-2xl border p-3 transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        checked ? libraryChunkRadioChecked : libraryChunkRadio,
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        className="mt-1 h-4 w-4 shrink-0 accent-[var(--fi-primary)]"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
      </span>
    </label>
  )
}

export default function KnowledgeBaseImportPage({ embedded = false }) {
  const { t } = useLocale()
  const router = useRouter()
  const params = useParams()
  const kbId =
    typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : ""

  const [knowledgeBase, setKnowledgeBase] = useState(null)
  const [kbLoading, setKbLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [chunkStrategy, setChunkStrategy] = useState("default")
  const [metaFilename, setMetaFilename] = useState(true)
  const [metaHeadings, setMetaHeadings] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pickedFiles, setPickedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState("")
  const [uploadProgress, setUploadProgress] = useState({ completed: 0, total: 0 })
  const [importJob, setImportJob] = useState(null)
  const [failedJobId, setFailedJobId] = useState(null)
  const fileInputRef = useRef(null)
  const abortRef = useRef(null)

  const ACCEPT =
    ".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.xls,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"

  useEffect(() => {
    if (!kbId) return
    let cancelled = false
    ;(async () => {
      setKbLoading(true)
      try {
        const { data } = await getKnowledgeBase(kbId)
        if (!cancelled) {
          setKnowledgeBase(data)
          setNotFound(false)
        }
      } catch (err) {
        if (!cancelled) {
          if (ApiError.isApiError(err) && err.code === ErrorCodes.KB_NOT_FOUND) {
            setNotFound(true)
          } else {
            setError(t("kbLoadError", { message: formatApiErrorMessage(err) }))
          }
          setKnowledgeBase(null)
        }
      } finally {
        if (!cancelled) setKbLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [kbId, t])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const validateFiles = (files) => {
    if (files.length === 0) {
      setError(t("kbImportNoFiles"))
      return false
    }
    if (files.length > MAX_FILE_COUNT) {
      setError(t("kbImportUploadLimit"))
      return false
    }
    const oversized = files.find((f) => f.size > MAX_FILE_BYTES)
    if (oversized) {
      setError(t("kbImportFailed", { message: `${oversized.name} > 20MB` }))
      return false
    }
    return true
  }

  const mergeFiles = (incoming) => {
    if (!incoming?.length) return
    setPickedFiles((prev) => {
      const map = new Map()
      const key = (f) => `${f.name}:${f.size}:${f.lastModified}`
      for (const f of prev) map.set(key(f), f)
      for (const f of incoming) map.set(key(f), f)
      return Array.from(map.values())
    })
    setError("")
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const onFileInputChange = (e) => {
    const list = e.target.files ? Array.from(e.target.files) : []
    mergeFiles(list)
    e.target.value = ""
  }

  const onDropZoneDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onDropZoneDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const onDropZoneDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) setDragActive(false)
  }

  const onDropZoneDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const list = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : []
    mergeFiles(list)
  }

  const importOptions = () => ({
    chunkStrategy,
    metaFilename,
    metaHeadings,
  })

  const runImport = async (files, existingJobId = null) => {
    setSubmitting(true)
    setError("")
    setImportJob(null)
    setFailedJobId(null)
    setUploadProgress({ completed: 0, total: files.length })

    const controller = new AbortController()
    abortRef.current = controller

    try {
      let finalJob
      if (existingJobId) {
        const { data: retriedJob } = await retryImportJob(existingJobId, importOptions())
        setImportJob(retriedJob)
        finalJob = await pollImportJob(retriedJob.id, {
          onUpdate: setImportJob,
          signal: controller.signal,
        })
      } else {
        finalJob = await uploadAndImportFiles(kbId, files, importOptions(), {
          onUploadProgress: (completed, total) => setUploadProgress({ completed, total }),
          onImportUpdate: setImportJob,
          signal: controller.signal,
        })
      }

      if (finalJob.status === "completed") {
        router.push(`/library/${kbId}`)
        return
      }

      const failMessage =
        finalJob.errorMessage ||
        finalJob.errorCode ||
        t("kbImportFailed", { message: finalJob.status })
      setFailedJobId(finalJob.id)
      setError(t("kbImportFailed", { message: failMessage }))
    } catch (err) {
      setError(t("kbImportFailed", { message: formatApiErrorMessage(err) }))
    } finally {
      setSubmitting(false)
      abortRef.current = null
    }
  }

  const handleConfirm = async () => {
    if (!validateFiles(pickedFiles)) return
    await runImport(pickedFiles)
  }

  const handleRetry = async () => {
    if (!failedJobId) return
    await runImport(pickedFiles, failedJobId)
  }

  const handleLeave = async (destination) => {
    if (submitting) {
      abortRef.current?.abort()
      if (importJob?.id && !isImportJobTerminal(importJob.status)) {
        try {
          await cancelImportJob(importJob.id)
        } catch {
          // User is leaving; best-effort cancel
        }
      }
    }
    router.push(destination)
  }

  if (kbLoading) {
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
        <p className="text-sm text-slate-500">{t("kbImportNotFound")}</p>
        <Link href="/library" className={cls("mt-4 text-sm", libraryLink)}>
          {t("kbBackToList")}
        </Link>
      </div>
    )
  }

  const showUploadProgress = submitting && uploadProgress.total > 0 && !importJob
  const showImportProgress = submitting && importJob

  return (
    <div className={embedded ? libraryPageRoot : libraryPageRootStandalone}>
      <div
        className={cls(
          libraryEmbeddedShell,
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
      >
        <div className="mx-auto w-full max-w-[920px] px-2 py-4 sm:px-4 sm:py-6">
          <header className="mb-8 flex flex-col gap-5 md:gap-6">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href={`/library/${kbId}`}
                className="theme-focus-ring shrink-0 rounded-full p-1.5 text-slate-500 transition-colors hover:bg-white hover:text-[var(--fi-primary)]"
                aria-label={t("kbBackToList")}
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              <h1 className="min-w-0 text-lg font-semibold tracking-tight text-slate-800 sm:text-xl">
                {t("kbImportTitle")}
              </h1>
            </div>

            <nav
              className="flex flex-wrap items-center justify-center gap-3 sm:justify-start md:justify-center"
              aria-label={t("kbImportTitle")}
            >
              <StepIndicator
                step={1}
                label={t("kbImportStepDone")}
                completed
                active={false}
              />
              <div className="h-px w-6 shrink-0 bg-slate-200 sm:w-10" aria-hidden />
              <StepIndicator step={2} label={t("kbImportStepActive")} active completed={false} />
            </nav>
          </header>

          {error ? (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}

          {(showUploadProgress || showImportProgress) ? (
            <div className="mb-6 space-y-2 rounded-2xl border border-slate-200 bg-white p-4">
              {showUploadProgress ? (
                <p className="text-sm text-slate-600">
                  {t("kbImportUploading", {
                    completed: uploadProgress.completed,
                    total: uploadProgress.total,
                  })}
                </p>
              ) : null}
              {showImportProgress ? (
                <>
                  <p className="text-sm text-slate-600">
                    {t("kbImportProgress", {
                      progress: importJob.progress ?? 0,
                      stage: importJob.stage ?? "—",
                    })}
                  </p>
                  <Progress value={importJob.progress ?? 0} className="h-2" />
                </>
              ) : null}
            </div>
          ) : null}

          <form className={cls(libraryFormCard, "space-y-10")} onSubmit={(e) => e.preventDefault()}>
            <section className={FORM_GRID}>
              <SectionTitle>{t("kbImportUploadSection")}</SectionTitle>

              <div className="hidden sm:block" aria-hidden />

              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                multiple
                accept={ACCEPT}
                aria-label={t("kbImportUploadSelect")}
                onChange={onFileInputChange}
                disabled={submitting}
              />
              <div
                className={cls(
                  libraryDropZone,
                  dragActive && libraryDropZoneActive,
                )}
                onDragEnter={onDropZoneDragEnter}
                onDragLeave={onDropZoneDragLeave}
                onDragOver={onDropZoneDragOver}
                onDrop={onDropZoneDrop}
              >
                <p
                  className="theme-link cursor-pointer text-sm font-medium"
                  onClick={openFilePicker}
                >
                  {t("kbImportUploadHint")}
                </p>
                <p
                  className="mt-1 max-w-md cursor-pointer text-xs leading-relaxed text-slate-500 hover:text-slate-700"
                  onClick={openFilePicker}
                >
                  {t("kbImportUploadFormats")}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={(e) => {
                      e.stopPropagation()
                      openFilePicker()
                    }}
                    className={cls(
                      "inline-flex items-center justify-center px-4 py-2.5",
                      primaryBtn,
                      "disabled:opacity-60",
                    )}
                  >
                    {t("kbImportUploadSelect")}
                  </button>
                </div>
                {pickedFiles.length > 0 ? (
                  <div
                    className="mt-4 w-full max-w-md text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-700">
                        {t("kbImportUploadSelected", { count: pickedFiles.length })}
                      </p>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={(e) => {
                          e.stopPropagation()
                          setPickedFiles([])
                        }}
                        className="text-xs text-slate-500 underline hover:text-[var(--fi-primary)] disabled:opacity-50"
                      >
                        {t("kbImportUploadClear")}
                      </button>
                    </div>
                    <ul className="max-h-28 overflow-y-auto rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700">
                      {pickedFiles.map((f) => (
                        <li key={`${f.name}-${f.size}-${f.lastModified}`} className="truncate py-0.5">
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="mt-3 text-[11px] text-slate-400">{t("kbImportUploadLimit")}</p>
              </div>
            </section>

            <section className={FORM_GRID}>
              <SectionTitle>{t("kbImportChunkTitle")}</SectionTitle>

              <FormLabel required>{t("kbImportChunkStrategy")}</FormLabel>
              <div className="space-y-4">
                <div
                  className="flex min-w-0 flex-col gap-2 lg:flex-row lg:flex-wrap"
                  role="radiogroup"
                  aria-label={t("kbImportChunkStrategy")}
                >
                  <ChunkRadio
                    id="chunk-default"
                    name="chunk-strategy"
                    label={t("kbImportChunkDefault")}
                    description={t("kbImportChunkDefaultDesc")}
                    checked={chunkStrategy === "default"}
                    disabled={submitting}
                    onChange={() => setChunkStrategy("default")}
                  />
                  <ChunkRadio
                    id="chunk-custom"
                    name="chunk-strategy"
                    label={t("kbImportChunkCustom")}
                    description={t("kbImportChunkCustomDesc")}
                    checked={chunkStrategy === "custom"}
                    disabled={submitting}
                    onChange={() => setChunkStrategy("custom")}
                  />
                  <ChunkRadio
                    id="chunk-whole"
                    name="chunk-strategy"
                    label={t("kbImportChunkWhole")}
                    description={t("kbImportWholeDisabled")}
                    checked={chunkStrategy === "whole"}
                    disabled
                    onChange={() => setChunkStrategy("whole")}
                  />
                  <ChunkRadio
                    id="chunk-page"
                    name="chunk-strategy"
                    label={t("kbImportChunkPage")}
                    description={t("kbImportChunkPageDesc")}
                    checked={chunkStrategy === "page"}
                    disabled={submitting}
                    onChange={() => setChunkStrategy("page")}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <FormLabel>{t("kbImportChunkMeta")}</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                      <Checkbox
                        className={SURFACE_CHECKBOX}
                        checked={metaFilename}
                        disabled={submitting}
                        onCheckedChange={(v) => setMetaFilename(v === true)}
                      />
                      {t("kbImportChunkMetaFilename")}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-800">
                      <Checkbox
                        className={SURFACE_CHECKBOX}
                        checked={metaHeadings}
                        disabled={submitting}
                        onCheckedChange={(v) => setMetaHeadings(v === true)}
                      />
                      {t("kbImportChunkMetaHeadings")}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            <div className={FORM_GRID}>
              <div className="col-span-full flex flex-wrap items-center gap-2 sm:col-start-2 sm:gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirm}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    primaryBtn,
                    "disabled:opacity-60",
                  )}
                >
                  {t("kbImportSubmit")}
                </button>
                {failedJobId ? (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={handleRetry}
                    className={cls(
                      "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                      surfaceBtn,
                      "disabled:opacity-60",
                    )}
                  >
                    {t("kbImportRetry")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleLeave(`/library/${kbId}`)}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    surfaceBtn,
                  )}
                >
                  {t("kbImportPrev")}
                </button>
                <button
                  type="button"
                  onClick={() => handleLeave("/library")}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    surfaceBtn,
                  )}
                >
                  {t("kbImportCancel")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
