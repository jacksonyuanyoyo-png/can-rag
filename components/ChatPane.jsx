"use client"

import { useState, forwardRef, useImperativeHandle, useRef } from "react"
import { Pencil, RefreshCw, Check, X, Square } from "./icons/FidelityIcons"
import Message from "./Message"
import Composer from "./Composer"
import LandingHero from "./LandingHero"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"

function ThinkingMessage({ onPause }) {
  const { t } = useLocale()
  return (
    <Message role="assistant">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.3s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300 [animation-delay:-0.15s]"></div>
          <div className="h-2 w-2 animate-bounce rounded-full bg-gray-300"></div>
        </div>
        <span className="text-sm text-gray-500">{t("aiThinking")}</span>
        <button
          onClick={onPause}
          className="ml-auto inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Square className="h-3 w-3" /> {t("pause")}
        </button>
      </div>
    </Message>
  )
}

const ChatPane = forwardRef(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking, selectedModel, onModelChange },
  ref,
) {
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const composerRef = useRef(null)
  const { t, formatTimeAgo } = useLocale()

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
            <div className="mx-auto mb-6 max-w-3xl">
              <div className="mb-2 text-3xl font-serif tracking-tight sm:text-4xl md:text-5xl">
                <span className="block font-sans text-2xl leading-[1.05]">{conversation.title}</span>
              </div>
              <div className="mb-6 text-sm text-gray-500 dark:text-slate-400">
                {t("updatedMeta", { time: formatTimeAgo(conversation.updatedAt), count })}
              </div>
            </div>
            {messages.map((m) => (
              <div key={m.id} className="mx-auto max-w-3xl space-y-2 py-1.5">
                {editingId === m.id ? (
                  <div className={cls("rounded-lg border p-2", "border-gray-200 dark:border-slate-800")}>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="w-full resize-y rounded-lg bg-transparent p-2 text-sm outline-none"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={saveEdit}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white dark:bg-blue-600"
                      >
                        <Check className="h-3.5 w-3.5" /> {t("save")}
                      </button>
                      <button
                        onClick={saveAndResend}
                        className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> {t("saveAndResend")}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs"
                      >
                        <X className="h-3.5 w-3.5" /> {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <Message role={m.role}>
                    <div className="whitespace-pre-wrap">{m.content}</div>
                    {m.role === "user" && (
                      <div className="mt-1 flex gap-2 text-[11px] text-gray-500">
                        <button className="inline-flex items-center gap-1 hover:underline" onClick={() => startEdit(m)}>
                          <Pencil className="h-3.5 w-3.5" /> {t("edit")}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 hover:underline"
                          onClick={() => onResendMessage?.(m.id)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" /> {t("resend")}
                        </button>
                      </div>
                    )}
                  </Message>
                )}
              </div>
            ))}
            {isThinking && (
              <div className="mx-auto max-w-3xl py-1.5">
                <ThinkingMessage onPause={onPauseThinking} />
              </div>
            )}
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
