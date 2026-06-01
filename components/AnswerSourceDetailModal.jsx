"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Crosshair, ExternalLink } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import KbMarkdownPreview from "./KbMarkdownPreview"
import { useLocale } from "./LocaleProvider"
import { getKnowledgeBaseFileChunkDetail } from "@/lib/api/knowledge-bases"

function citationFileName(citation) {
  const name = citation?.fileName?.trim()
  if (name) return name
  if (citation?.fileId) return citation.fileId
  return ""
}

function resolveKnowledgeBaseId(citation, knowledgeBaseIds) {
  if (citation?.knowledgeBaseId) return citation.knowledgeBaseId
  if (Array.isArray(knowledgeBaseIds) && knowledgeBaseIds.length === 1) {
    return knowledgeBaseIds[0]
  }
  return undefined
}

function resolveChunkDataId(citation) {
  return citation?.dataId ?? citation?.chunkId
}

export default function AnswerSourceDetailModal({
  citation,
  knowledgeBaseIds,
  open,
  onOpenChange,
}) {
  const { t } = useLocale()
  const [markdown, setMarkdown] = useState("")
  const [charCount, setCharCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const kbId = useMemo(
    () => (citation ? resolveKnowledgeBaseId(citation, knowledgeBaseIds) : undefined),
    [citation, knowledgeBaseIds],
  )
  const dataId = useMemo(
    () => (citation ? resolveChunkDataId(citation) : undefined),
    [citation],
  )
  const fileHref =
    kbId && citation?.fileId
      ? `/library/${encodeURIComponent(kbId)}/files/${encodeURIComponent(citation.fileId)}`
      : null

  useEffect(() => {
    if (!open || !citation) {
      setMarkdown("")
      setCharCount(0)
      setLoading(false)
      return
    }

    let cancelled = false
    const inline = citation.content?.trim()
    if (inline) {
      setMarkdown(inline)
      setCharCount(inline.length)
      setLoading(false)
      return
    }

    async function load() {
      if (kbId && citation.fileId && dataId) {
        setLoading(true)
        try {
          const { data } = await getKnowledgeBaseFileChunkDetail(
            kbId,
            citation.fileId,
            dataId,
            0,
          )
          if (cancelled) return
          const text = data?.target?.text?.trim() ?? ""
          setMarkdown(text || citation.snippet?.trim() || "")
          setCharCount(data?.target?.charCount ?? text.length)
        } catch {
          if (cancelled) return
          const fallback = citation.snippet?.trim() || ""
          setMarkdown(fallback)
          setCharCount(fallback.length)
        } finally {
          if (!cancelled) setLoading(false)
        }
        return
      }

      const fallback = citation.snippet?.trim() || ""
      setMarkdown(fallback)
      setCharCount(fallback.length)
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, citation, kbId, dataId])

  const fileName = citation ? citationFileName(citation) : ""
  const scoreLabel =
    citation?.score != null && Number.isFinite(citation.score)
      ? t("answerSourceScore", { score: citation.score.toFixed(2) })
      : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-0 border-b border-slate-200/90 px-6 py-4 text-left dark:border-slate-700">
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">
            {t("answerSourceDetailTitle")}
          </DialogTitle>
          {fileName ? (
            <div className="mt-3 flex items-start justify-between gap-3">
              <p className="min-w-0 flex-1 text-sm leading-snug text-slate-600 dark:text-slate-400">
                {fileName}
              </p>
              {fileHref ? (
                <Link
                  href={fileHref}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--fi-primary)] hover:text-[var(--fi-primary-hover)]"
                  onClick={() => onOpenChange(false)}
                >
                  {t("answerSourceCompareOriginal")}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </Link>
              ) : null}
            </div>
          ) : null}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
            <div className="mb-4 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>{t("answerSourceCharCount", { count: charCount })}</span>
              {scoreLabel ? (
                <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                  <Crosshair className="h-3.5 w-3.5" aria-hidden />
                  {scoreLabel}
                </span>
              ) : null}
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-[var(--fi-primary)]" />
              </div>
            ) : markdown ? (
              <KbMarkdownPreview markdown={markdown} className="text-sm" />
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("answerSourceNoContent")}
              </p>
            )}
          </div>

          {fileHref ? (
            <p className="mt-4 text-center">
              <Link
                href={fileHref}
                className="text-sm font-medium text-[var(--fi-primary)] hover:text-[var(--fi-primary-hover)]"
                onClick={() => onOpenChange(false)}
              >
                {t("answerSourceViewFile")}
              </Link>
            </p>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}
