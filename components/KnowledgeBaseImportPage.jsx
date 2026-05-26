"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check } from "lucide-react"
import { useLocale } from "./LocaleProvider"
import { getKnowledgeBaseById } from "./mockKnowledgeBases"
import { libraryEmbeddedShell, primaryBtn, surfaceBtn } from "./libraryUi"
import { Checkbox } from "@/components/ui/checkbox"
import { cls } from "./utils"

const FORM_GRID =
  "grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-[minmax(0,max-content)_minmax(0,1fr)] sm:gap-x-8 sm:gap-y-6"

/** 与工程主色一致，覆盖 ui/checkbox 默认 primary 蓝色 */
const SURFACE_CHECKBOX =
  "border-white/55 bg-white/55 shadow-inner data-[state=checked]:border-gray-950 data-[state=checked]:bg-gray-950 data-[state=checked]:text-white focus-visible:ring-black/20"

function StepIndicator({ step, label, active, completed }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cls(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
          active || completed
            ? "bg-gray-950 text-white shadow-sm"
            : "border border-white/55 bg-white/55 text-gray-400 shadow-inner backdrop-blur-xl",
        )}
      >
        {completed ? <Check className="h-4 w-4" strokeWidth={2} /> : step}
      </span>
      <span
        className={cls(
          "truncate text-sm font-medium",
          active || completed ? "text-gray-950" : "text-gray-400",
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
      <span className="h-4 w-1 shrink-0 rounded-sm bg-gray-950" aria-hidden />
      <h2 className="text-sm font-semibold tracking-tight text-gray-950">{children}</h2>
      {badge}
    </div>
  )
}

function FormLabel({ children, required, htmlFor }) {
  return (
    <div
      className={cls(
        "text-sm font-medium leading-snug text-gray-950 sm:pt-0.5",
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

function ChunkRadio({ id, name, label, description, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className={cls(
        "flex min-w-[8.5rem] flex-1 cursor-pointer gap-2.5 rounded-2xl border p-3 transition-colors",
        checked
          ? "border-gray-950/25 bg-white/55 shadow-inner"
          : "border-white/55 bg-white/25 hover:bg-white/40",
      )}
    >
      <input
        id={id}
        type="radio"
        name={name}
        className="mt-1 h-4 w-4 shrink-0 accent-gray-950"
        checked={checked}
        onChange={onChange}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-950">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{description}</span>
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

  const knowledgeBase = getKnowledgeBaseById(kbId)

  const [chunkStrategy, setChunkStrategy] = useState("default")
  const [metaFilename, setMetaFilename] = useState(true)
  const [metaHeadings, setMetaHeadings] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pickedFiles, setPickedFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const ACCEPT =
    ".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,.csv,.xls,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain"

  const mergeFiles = (incoming) => {
    if (!incoming?.length) return
    setPickedFiles((prev) => {
      const map = new Map()
      const key = (f) => `${f.name}:${f.size}:${f.lastModified}`
      for (const f of prev) map.set(key(f), f)
      for (const f of incoming) map.set(key(f), f)
      return Array.from(map.values())
    })
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

  const handleConfirm = () => {
    setSubmitting(true)
    router.push(`/library/${kbId}`)
    setSubmitting(false)
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
        <p className="text-sm text-gray-500">{t("kbImportNotFound")}</p>
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
                className="shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white/55 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                aria-label={t("kbBackToList")}
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              <h1 className="min-w-0 text-lg font-semibold tracking-tight text-gray-950 sm:text-xl">
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
              <div className="h-px w-6 shrink-0 bg-gray-200 sm:w-10" aria-hidden />
              <StepIndicator step={2} label={t("kbImportStepActive")} active completed={false} />
            </nav>
          </header>

          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            {/* 上传区域 */}
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
              />
              <div
                className={cls(
                  "flex min-w-0 flex-1 flex-col items-center justify-center rounded-3xl border border-dashed bg-white/30 px-4 py-8 text-center shadow-inner transition-colors",
                  dragActive
                    ? "border-gray-950/40 bg-white/50"
                    : "border-white/60",
                )}
                onDragEnter={onDropZoneDragEnter}
                onDragLeave={onDropZoneDragLeave}
                onDragOver={onDropZoneDragOver}
                onDrop={onDropZoneDrop}
              >
                <p
                  className="cursor-pointer text-sm font-medium text-gray-950 hover:underline"
                  onClick={openFilePicker}
                >
                  {t("kbImportUploadHint")}
                </p>
                <p
                  className="mt-1 max-w-md cursor-pointer text-xs leading-relaxed text-gray-500 hover:text-gray-700"
                  onClick={openFilePicker}
                >
                  {t("kbImportUploadFormats")}
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      openFilePicker()
                    }}
                    className={cls(
                      "inline-flex items-center justify-center px-4 py-2.5",
                      primaryBtn,
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
                      <p className="text-xs font-medium text-gray-700">
                        {t("kbImportUploadSelected", { count: pickedFiles.length })}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPickedFiles([])
                        }}
                        className="text-xs text-gray-500 underline hover:text-gray-950"
                      >
                        {t("kbImportUploadClear")}
                      </button>
                    </div>
                    <ul className="max-h-28 overflow-y-auto rounded-xl border border-white/50 bg-white/40 px-2 py-1.5 text-xs text-gray-700">
                      {pickedFiles.map((f) => (
                        <li key={`${f.name}-${f.size}-${f.lastModified}`} className="truncate py-0.5">
                          {f.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <p className="mt-3 text-[11px] text-gray-400">{t("kbImportUploadLimit")}</p>
              </div>
            </section>

            {/* 配置切片策略 */}
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
                    onChange={() => setChunkStrategy("default")}
                  />
                  <ChunkRadio
                    id="chunk-custom"
                    name="chunk-strategy"
                    label={t("kbImportChunkCustom")}
                    description={t("kbImportChunkCustomDesc")}
                    checked={chunkStrategy === "custom"}
                    onChange={() => setChunkStrategy("custom")}
                  />
                  <ChunkRadio
                    id="chunk-whole"
                    name="chunk-strategy"
                    label={t("kbImportChunkWhole")}
                    description={t("kbImportChunkWholeDesc")}
                    checked={chunkStrategy === "whole"}
                    onChange={() => setChunkStrategy("whole")}
                  />
                  <ChunkRadio
                    id="chunk-page"
                    name="chunk-strategy"
                    label={t("kbImportChunkPage")}
                    description={t("kbImportChunkPageDesc")}
                    checked={chunkStrategy === "page"}
                    onChange={() => setChunkStrategy("page")}
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
                  <FormLabel>{t("kbImportChunkMeta")}</FormLabel>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-950">
                      <Checkbox
                        className={SURFACE_CHECKBOX}
                        checked={metaFilename}
                        onCheckedChange={(v) => setMetaFilename(v === true)}
                      />
                      {t("kbImportChunkMetaFilename")}
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-950">
                      <Checkbox
                        className={SURFACE_CHECKBOX}
                        checked={metaHeadings}
                        onCheckedChange={(v) => setMetaHeadings(v === true)}
                      />
                      {t("kbImportChunkMetaHeadings")}
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* 底部操作按钮 */}
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
                <button
                  type="button"
                  onClick={() => router.push(`/library/${kbId}`)}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    surfaceBtn,
                  )}
                >
                  {t("kbImportPrev")}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/library")}
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
