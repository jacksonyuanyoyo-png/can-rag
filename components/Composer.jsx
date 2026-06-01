"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Loader2, Plus, Mic } from "./icons/FidelityIcons"
import ComposerActionsPopover from "./ComposerActionsPopover"
import ModelSelector from "./ModelSelector"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"
import { UI_VISIBILITY } from "@/lib/ui-visibility"

const landingRevealContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.14, delayChildren: 0.06 },
  },
}

const landingRevealItem = {
  hidden: { opacity: 0, y: -14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
}

const Composer = forwardRef(function Composer(
  {
    onSend,
    busy,
    landing = false,
    landingReveal = false,
    selectedModel,
    onModelChange,
    models,
    selectedKnowledgeBaseIds = [],
    onKnowledgeBaseIdsChange,
  },
  ref,
) {
  const { t } = useLocale()
  const [value, setValue] = useState("")
  const [sending, setSending] = useState(false)
  const [lineCount, setLineCount] = useState(1)
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current
      const lineHeight = 24
      const minHeight = 24

      textarea.style.height = "auto"
      const scrollHeight = textarea.scrollHeight
      const calculatedLines = Math.max(1, Math.ceil(scrollHeight / lineHeight))

      setLineCount(calculatedLines)

      if (calculatedLines <= 12) {
        textarea.style.height = `${Math.max(minHeight, scrollHeight)}px`
        textarea.style.overflowY = "hidden"
      } else {
        textarea.style.height = `${12 * lineHeight}px`
        textarea.style.overflowY = "auto"
      }
    }
  }, [value])

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent
          setTimeout(() => {
            inputRef.current?.focus()
            const length = newValue.length
            inputRef.current?.setSelectionRange(length, length)
          }, 0)
          return newValue
        })
      },
      focus: () => {
        inputRef.current?.focus()
      },
    }),
    [],
  )

  async function handleSend() {
    const text = value.trim()
    if (!text || sending) return
    setSending(true)
    setValue("")
    inputRef.current?.focus()
    try {
      await onSend?.(text)
    } finally {
      setSending(false)
    }
  }

  const hasContent = value.trim().length > 0
  const useLandingReveal = landing && landingReveal
  const RevealSection = useLandingReveal ? motion.div : "div"
  const revealProps = useLandingReveal ? { variants: landingRevealItem } : {}

  const pillClass = cls(
    "mx-auto flex w-full flex-col transition-all duration-200",
    landing
      ? cls("glass-pill max-w-[620px] rounded-[1.75rem]")
      : cls(
          "max-w-3xl rounded-[1.75rem] border border-slate-200/80 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.07)]",
        ),
  )

  const shell = (
    <>
      <div className={pillClass}>
        <RevealSection {...revealProps} className="flex-1 px-4 pt-4 pb-2">
          <textarea
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={t("composerPlaceholder")}
            rows={1}
            className={cls(
              "w-full resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 transition-all duration-200 dark:text-slate-100 dark:placeholder:text-slate-500",
              "min-h-[24px] text-left leading-6",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
        </RevealSection>

        <RevealSection {...revealProps} className="flex items-center justify-between px-3 pb-3">
          <div className="flex items-center gap-1">
            <ComposerActionsPopover
              selectedIds={selectedKnowledgeBaseIds}
              onSelectedIdsChange={onKnowledgeBaseIdsChange}
              disabled={sending || busy}
            >
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-white/70 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-300"
                title={t("composerKbTitle")}
                type="button"
              >
                <Plus className="h-5 w-5" />
              </button>
            </ComposerActionsPopover>
            <ModelSelector selectedModel={selectedModel} onSelect={onModelChange} models={models} />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {UI_VISIBILITY.composerVoiceInput ? (
              <button
                className="inline-flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:bg-white/70 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
                title={t("voiceInput")}
              >
                <Mic className="h-5 w-5" />
              </button>
            ) : null}
            <button
              onClick={handleSend}
              disabled={sending || busy || !hasContent}
              className={cls(
                "inline-flex shrink-0 items-center justify-center rounded-full p-2.5 transition-colors",
                hasContent
                  ? "bg-[var(--fi-primary)] text-white hover:bg-[var(--fi-primary-hover)] dark:bg-[var(--fi-primary)] dark:text-white dark:hover:bg-[var(--fi-primary-hover)]"
                  : "cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500",
              )}
            >
              {sending || busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
        </RevealSection>
      </div>

      <RevealSection
        {...revealProps}
        className={cls(
          "mx-auto mt-2 w-full max-w-3xl px-1 text-center text-[11px] text-gray-400 dark:text-slate-500",
          landing && "max-w-[620px]",
        )}
      >
        {t("composerDisclaimer")}
      </RevealSection>
    </>
  )

  return (
    <div className={cls("shrink-0 p-4", landing ? "w-full border-0" : "border-0 bg-transparent")}>
      {useLandingReveal ? (
        <motion.div
          variants={landingRevealContainer}
          initial="hidden"
          animate="visible"
          className="flex w-full flex-col"
        >
          {shell}
        </motion.div>
      ) : (
        shell
      )}
    </div>
  )
})

export default Composer
