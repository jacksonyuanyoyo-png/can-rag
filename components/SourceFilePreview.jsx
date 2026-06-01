"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  detectKbSourceFileFormat,
  fetchKbSourceFile,
  resolveKbSourceFileUrl,
} from "@/lib/api/kb-source-file"
import { formatApiErrorMessage } from "@/lib/api/format-error"
import KbMarkdownPreview from "./KbMarkdownPreview"
import { cls } from "./utils"

function PreviewViewport({ children, contentRef, ready, measureSelector, className }) {
  const viewportRef = useRef(null)
  const [dims, setDims] = useState({ scale: 1, w: 0, h: 0 })

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    const root = contentRef?.current
    if (!viewport) return

    let w = 0
    let h = 0
    if (root) {
      const target =
        (measureSelector && root.querySelector(measureSelector)) ||
        root.firstElementChild ||
        root
      w = target.scrollWidth || target.offsetWidth || 0
      h = target.scrollHeight || target.offsetHeight || 0
    }

    const pad = 8
    const vpW = Math.max(viewport.clientWidth - pad * 2, 1)
    const scale = w > 0 ? Math.min(1, vpW / w) : 1
    setDims({ scale, w, h })
  }, [contentRef, measureSelector])

  useEffect(() => {
    if (!ready) return undefined

    let raf1 = 0
    let raf2 = 0
    raf1 = requestAnimationFrame(() => {
      measure()
      raf2 = requestAnimationFrame(measure)
    })

    const viewport = viewportRef.current
    if (!viewport) {
      return () => {
        cancelAnimationFrame(raf1)
        cancelAnimationFrame(raf2)
      }
    }

    const ro = new ResizeObserver(() => measure())
    ro.observe(viewport)
    const root = contentRef?.current
    if (root) ro.observe(root)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      ro.disconnect()
    }
  }, [ready, measure, contentRef])

  const { scale, w, h } = dims
  const scaledW = w > 0 ? w * scale : undefined
  const scaledH = h > 0 ? h * scale : undefined

  return (
    <div
      ref={viewportRef}
      className={cls(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-2",
        className,
      )}
    >
      <div
        className="mx-auto"
        style={{
          width: scaledW ?? "100%",
          height: scaledH,
        }}
      >
        <div
          style={{
            transform: scale < 1 ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
            width: w > 0 ? w : "100%",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

let pdfJsWorkerConfigured = false

async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
  if (!pdfJsWorkerConfigured && typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
    pdfJsWorkerConfigured = true
  }
  return pdfjs
}

function PdfPreview({ previewUrl, t }) {
  const viewportRef = useRef(null)
  const pagesRef = useRef(null)
  const [state, setState] = useState({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    let pdfDoc = null

    async function waitForContainer() {
      for (let i = 0; i < 30; i += 1) {
        if (pagesRef.current && viewportRef.current) {
          return { container: pagesRef.current, viewport: viewportRef.current }
        }
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      return null
    }

    async function renderPages(pdf, container, viewportEl) {
      container.innerHTML = ""
      const pad = 16
      const targetWidth = Math.max(viewportEl.clientWidth - pad, 200)

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
        if (cancelled) return
        const page = await pdf.getPage(pageNum)
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = targetWidth / baseViewport.width
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        if (!context) continue

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.className = "block w-full bg-white"

        const renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
        if (cancelled) return

        const pageWrap = document.createElement("div")
        pageWrap.className =
          "w-full overflow-hidden rounded-sm bg-white shadow-sm ring-1 ring-slate-200/80"
        pageWrap.appendChild(canvas)
        container.appendChild(pageWrap)
      }
    }

    async function load() {
      setState({ status: "loading" })
      try {
        const mounts = await waitForContainer()
        if (!mounts) {
          throw new Error(t("kbSourcePreviewError"))
        }

        const response = await fetchKbSourceFile(previewUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()
        if (cancelled) return

        const pdfjs = await getPdfJs()
        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) })
        pdfDoc = await loadingTask.promise
        if (cancelled) return

        await renderPages(pdfDoc, mounts.container, mounts.viewport)
        if (!cancelled) setState({ status: "ready" })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: formatApiErrorMessage(err) || t("kbSourcePreviewError"),
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
      pdfDoc?.destroy()
    }
  }, [previewUrl, t])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        ref={viewportRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-2"
      >
        <div
          ref={pagesRef}
          className={cls(
            "mx-auto flex w-full flex-col gap-3",
            state.status !== "ready" && "min-h-[120px]",
          )}
        />
      </div>
      {state.status === "loading" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-slate-500">
          {t("kbLoading")}
        </div>
      ) : null}
      {state.status === "error" ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-6 text-sm text-red-600"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}
    </div>
  )
}

function DocxPreview({ previewUrl, t }) {
  const contentRef = useRef(null)
  const [state, setState] = useState({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    async function waitForContainer() {
      for (let i = 0; i < 30; i += 1) {
        if (contentRef.current) return contentRef.current
        await new Promise((resolve) => requestAnimationFrame(resolve))
      }
      return null
    }

    async function load() {
      setState({ status: "loading" })
      try {
        const response = await fetchKbSourceFile(previewUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const buffer = await response.arrayBuffer()
        if (cancelled) return

        const container = await waitForContainer()
        if (!container) {
          throw new Error(t("kbSourcePreviewError"))
        }

        const { renderAsync } = await import("docx-preview")
        container.innerHTML = ""
        await renderAsync(buffer, container, null, {
          className: "docx-preview",
          inWrapper: true,
        })
        if (!cancelled) setState({ status: "ready" })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: formatApiErrorMessage(err) || t("kbSourcePreviewError"),
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [previewUrl, t])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <PreviewViewport
        contentRef={contentRef}
        ready={state.status === "ready"}
        measureSelector=".docx-preview-wrapper"
        className={state.status !== "ready" ? "invisible" : undefined}
      >
        <div
          ref={contentRef}
          className="docx-preview-root bg-white shadow-sm ring-1 ring-slate-200/80 [&_.docx-preview-wrapper]:!max-w-none"
        />
      </PreviewViewport>
      {state.status === "loading" ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 text-sm text-slate-500">
          {t("kbLoading")}
        </div>
      ) : null}
      {state.status === "error" ? (
        <div
          className="absolute inset-0 z-10 flex items-center justify-center bg-white/95 p-6 text-sm text-red-600"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}
    </div>
  )
}

function MarkdownOrTextPreview({ file, previewUrl, t }) {
  const [state, setState] = useState({ status: "loading" })
  const format = detectKbSourceFileFormat(file)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ status: "loading" })
      try {
        const response = await fetchKbSourceFile(previewUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const text = await response.text()
        if (!cancelled) setState({ status: "ready", text })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: formatApiErrorMessage(err) || t("kbSourcePreviewError"),
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [previewUrl, t])

  if (state.status === "loading") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
        {t("kbLoading")}
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-red-600" role="alert">
        {state.message}
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-3">
      {format === "markdown" ? (
        <div className="mx-auto max-w-none rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
          <KbMarkdownPreview markdown={state.text} />
        </div>
      ) : (
        <pre className="mx-auto max-w-none overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-white p-4 font-mono text-xs leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-200/80">
          {state.text}
        </pre>
      )}
    </div>
  )
}

function IframePreview({ file, previewUrl, t }) {
  const [state, setState] = useState({ status: "loading" })
  const wrapRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let objectUrl = null

    async function load() {
      setState({ status: "loading" })
      try {
        const response = await fetchKbSourceFile(previewUrl)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        if (!cancelled) setState({ status: "ready", objectUrl })
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            message: formatApiErrorMessage(err) || t("kbSourcePreviewError"),
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [previewUrl, t])

  if (state.status === "loading" || state.status === "error") {
    return state.status === "error" ? (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-red-600" role="alert">
        {state.message}
      </div>
    ) : (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-slate-500">
        {t("kbLoading")}
      </div>
    )
  }

  return (
    <PreviewViewport contentRef={wrapRef} ready>
      <div ref={wrapRef} className="w-full min-w-[320px] bg-white">
        <iframe
          src={state.objectUrl}
          title={file.name ?? t("kbFileDetailOriginal")}
          className="block w-full min-h-[480px] border-0"
        />
      </div>
    </PreviewViewport>
  )
}

export default function SourceFilePreview({ kbId, fileId, file, t }) {
  const format = file ? detectKbSourceFileFormat(file) : null
  const previewUrl = resolveKbSourceFileUrl(kbId, fileId, file?.sourceFileUrl, {
    download: false,
  })

  if (!file) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center p-6 text-sm text-slate-500">
        {t("kbFileDetailNotFound")}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      {format === "docx" ? (
        <DocxPreview previewUrl={previewUrl} t={t} />
      ) : format === "pdf" ? (
        <PdfPreview previewUrl={previewUrl} t={t} />
      ) : format === "markdown" || format === "text" ? (
        <MarkdownOrTextPreview file={file} previewUrl={previewUrl} t={t} />
      ) : (
        <IframePreview file={file} previewUrl={previewUrl} t={t} />
      )}
    </div>
  )
}

export async function downloadKbSourceFile(kbId, fileId, file) {
  const url = resolveKbSourceFileUrl(kbId, fileId, file?.sourceFileUrl, { download: true })
  const response = await fetchKbSourceFile(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = file?.name || "download"
  anchor.rel = "noopener"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
