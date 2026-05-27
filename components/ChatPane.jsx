"use client"

import { useState, forwardRef, useImperativeHandle, useRef, useCallback } from "react"
import { ThumbsUp, ThumbsDown, Copy } from "lucide-react"
import { ChevronDown, RefreshCw, Pencil, Check, X, Square, MoreHorizontal } from "./icons/FidelityIcons"
import Composer from "./Composer"
import LandingHero from "./LandingHero"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"

function ThinkingBlock({ onPause }) {
  const { t } = useLocale()
  return (
    <div className="mx-auto mt-8 max-w-3xl">
      <div className="flex items-center gap-1 text-sm font-medium text-[var(--fi-primary)] dark:text-[var(--fi-primary)]">
        <span>{t("landingTitle")}</span>
        <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s] dark:bg-slate-600" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s] dark:bg-slate-600" />
          <div className="h-2 w-2 animate-bounce rounded-full bg-slate-300 dark:bg-slate-600" />
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">{t("aiThinking")}</span>
        <button
          type="button"
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 text-xs text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Square className="h-3 w-3" /> {t("pause")}
        </button>
      </div>
    </div>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking, selectedModel, onModelChange },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const composerRef = useRef(null)
  const { t, formatTimeAgo } = useLocale()

  const clearCopiedTimer = useRef(null)
  const flashCopied = useCallback((id) => {
    if (clearCopiedTimer.current) window.clearTimeout(clearCopiedTimer.current)
    setCopiedId(id)
    clearCopiedTimer.current = window.setTimeout(() => setCopiedId(null), 2000)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        composerRef.current?.insertTemplate(templateContent)
      },
    }),
    [],
  )

  if (!conversation) return null

  const messages = Array.isArray(conversation.messages) ? conversation.messages : []
  const count = messages.length || conversation.messageCount || 0

  function startEdit(m) {
    setEditingId(m.id)
    setDraft(m.content)
  }
  function cancelEdit() {
    setEditingId(null)
    setDraft("")
  }
  function saveEdit() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    cancelEdit()
  }
  function saveAndResend() {
    if (!editingId) return
    onEditMessage?.(editingId, draft)
    onResendMessage?.(editingId)
    cancelEdit()
  }

  function regenerateFromAssistant(assistantIndex) {
    for (let j = assistantIndex - 1; j >= 0; j -= 1) {
      if (messages[j]?.role === "user") {
        onResendMessage?.(messages[j].id)
        return
      }
    }
  }

  async function copyAssistantText(text, id) {
    try {
      await navigator.clipboard.writeText(text)
      flashCopied(id)
    } catch {
      // ignore
    }
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <LandingHero
          composerRef={composerRef}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          onSend={onSend}
          busy={busy}
          setBusy={setBusy}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 sm:px-8">
        <>
          <div className="mx-auto mb-8 max-w-3xl border-b border-slate-200/80 pb-8 dark:border-slate-700/80">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-3xl">
              {conversation.title}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("updatedMeta", { time: formatTimeAgo(conversation.updatedAt), count })}
            </p>
          </div>

          {messages.map((m, i) => {
            if (editingId === m.id) {
              return (
                <div key={m.id} className="mx-auto mb-8 max-w-3xl">
                  <div className={cls("rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-xl bg-transparent p-2 text-sm text-slate-800 outline-none dark:text-slate-100"
                      rows={3}
                    />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-full bg-[var(--fi-primary)] px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[var(--fi-primary-hover)]"
                      >
                        <Check className="h-3.5 w-3.5" /> {t("save")}
                      </button>
                      <button
                        type="button"
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> {t("saveAndResend")}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <X className="h-3.5 w-3.5" /> {t("cancel")}
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            if (m.role === "user") {
              return (
                <div key={m.id} className={cls("group mx-auto max-w-3xl", i > 0 && "mt-10")}>
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-[11px] font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-100"
                      aria-hidden
                    >
                      JD
                    </div>
                    <p className="min-w-0 flex-1 pt-1 text-[15px] leading-7 text-slate-900 dark:text-slate-100">{m.content}</p>
                    <div className="flex shrink-0 items-center gap-0.5 pt-0.5 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title={t("edit")}
                        onClick={() => startEdit(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        title={t("resend")}
                        onClick={() => onResendMessage?.(m.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            }

            const showTurnDivider = i < messages.length - 1 || isThinking
            return (
              <div
                key={m.id}
                className={cls(
                  "mx-auto max-w-3xl",
                  i === 0 ? "mt-4" : "mt-10",
                  showTurnDivider && "border-b border-slate-200/80 pb-10 dark:border-slate-700/80",
                )}
              >
                <div className="flex items-center gap-1 text-sm font-medium text-[var(--fi-primary)] dark:text-[var(--fi-primary)]">
                  <span>{t("landingTitle")}</span>
                  <ChevronDown className="h-4 w-4 opacity-70" aria-hidden />
                </div>
                <div className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-slate-800 dark:text-slate-200">{m.content}</div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title={t("feedbackPositive")}
                      aria-label={t("feedbackPositive")}
                    >
                      <ThumbsUp className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title={t("feedbackNegative")}
                      aria-label={t("feedbackNegative")}
                    >
                      <ThumbsDown className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title={copiedId === m.id ? t("copiedAnswer") : t("copyAnswer")}
                      onClick={() => copyAssistantText(m.content, m.id)}
                    >
                      <Copy className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                      title={t("more")}
                      aria-label={t("more")}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => regenerateFromAssistant(i)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    {t("regenerate")}
                  </button>
                </div>
              </div>
            )
          })}

          {isThinking && <ThinkingBlock onPause={onPauseThinking} />}
        </>
      </div>

      <Composer
        ref={composerRef}
        selectedModel={selectedModel}
        onModelChange={onModelChange}
        onSend={async (text) => {
          if (!text.trim()) return
          setBusy(true)
          await onSend?.(text)
          setBusy(false)
        }}
        busy={busy}
      />
    </div>
  )
})

export default ChatPane
