"use client"

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Loader2, Plus, Mic } from "./icons/FidelityIcons"
import ComposerActionsPopover from "./ComposerActionsPopover"
import ModelSelector from "./ModelSelector"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"

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
  { onSend, busy, landing = false, landingReveal = false, selectedModel, onModelChange },
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
    if (!value.trim() || sending) return
    setSending(true)
    try {
      await onSend?.(value)
      setValue("")
      inputRef.current?.focus()
    } finally {
      setSending(false)
    }
  }

  const hasContent = value.trim().length > 0
  const useLandingReveal = landing && landingReveal
  const RevealSection = useLandingReveal ? motion.div : "div"
  const revealProps = useLandingReveal ? { variants: landingRevealItem } : {}

  const pillClass = cls(
    "glass-pill mx-auto flex w-full flex-col transition-all duration-200",
    landing ? "max-w-[620px] rounded-[2rem]" : "max-w-3xl rounded-[1.35rem]",
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
              "w-full resize-none bg-transparent text-sm outline-none placeholder:text-zinc-400 transition-all duration-200 dark:placeholder:text-slate-500",
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
            <ComposerActionsPopover>
              <button
                className="inline-flex shrink-0 items-center justify-center rounded-full p-2 text-gray-500 transition-colors hover:bg-white/65 hover:text-gray-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-300"
                title={t("addAttachment")}
              >
                <Plus className="h-5 w-5" />
              </button>
            </ComposerActionsPopover>
            <ModelSelector selectedModel={selectedModel} onSelect={onModelChange} />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              className="inline-flex items-center justify-center rounded-full p-2 text-gray-400 transition-colors hover:bg-white/65 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-slate-300"
              title={t("voiceInput")}
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              onClick={handleSend}
              disabled={sending || busy || !hasContent}
              className={cls(
                "inline-flex shrink-0 items-center justify-center rounded-full p-2.5 transition-colors",
                hasContent
                  ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                  : "cursor-not-allowed bg-black/8 text-gray-400 dark:bg-white/10 dark:text-slate-500",
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
    <div className={cls("shrink-0 p-4", landing ? "w-full border-0" : "border-t border-white/50 dark:border-white/10")}>
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
