"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { ChevronDown } from "./icons/FidelityIcons"
import AnswerSourceDetailModal from "./AnswerSourceDetailModal"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"

function citationTitle(citation, index) {
  const name = citation.fileName?.trim()
  if (name) return name
  if (citation.fileId) return citation.fileId
  return `#${index}`
}

function sourceLabel(citation, t) {
  if (citation.sourceType === "kb_chunk" || citation.chunkId) {
    return t("answerSourceKbChunk")
  }
  return t("answerSourceKbChunk")
}

export default function AnswerSources({ citations, knowledgeBaseIds = [] }) {
  const { t } = useLocale()
  const [expanded, setExpanded] = useState(true)
  const [detailCitation, setDetailCitation] = useState(null)

  if (!Array.isArray(citations) || citations.length === 0) return null

  const sorted = [...citations].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0) || 0,
  )

  return (
    <>
      <div className="mt-6 border-t border-slate-200/80 pt-5 dark:border-slate-700/80">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center gap-2 text-left text-sm font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          aria-expanded={expanded}
        >
          <span>{t("answerSourcesTitle", { count: sorted.length })}</span>
          <ChevronDown
            className={cls(
              "h-4 w-4 shrink-0 transition-transform",
              expanded ? "rotate-180" : "",
            )}
            aria-hidden
          />
        </button>

        {expanded && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sorted.map((citation, i) => {
              const displayIndex = citation.index ?? i + 1
              const title = citationTitle(citation, displayIndex)
              const anchorId = `cite-${displayIndex}`

              return (
                <button
                  key={`${citation.fileId ?? ""}-${citation.chunkId ?? ""}-${displayIndex}`}
                  type="button"
                  id={anchorId}
                  onClick={() => setDetailCitation(citation)}
                  className="flex min-h-[88px] cursor-pointer flex-col rounded-xl border border-slate-200/90 bg-white p-3 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fi-primary)] dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-violet-800"
                >
                  <h4 className="line-clamp-2 text-sm font-medium leading-snug text-slate-900 dark:text-slate-100">
                    {displayIndex}.{title}
                  </h4>
                  {citation.snippet ? (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {citation.snippet}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center gap-1.5 pt-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300">
                      <FileText className="h-3 w-3" strokeWidth={2} />
                    </span>
                    <span>{sourceLabel(citation, t)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <AnswerSourceDetailModal
        citation={detailCitation}
        knowledgeBaseIds={knowledgeBaseIds}
        open={detailCitation != null}
        onOpenChange={(next) => {
          if (!next) setDetailCitation(null)
        }}
      />
    </>
  )
}
