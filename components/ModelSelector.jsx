"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "./icons/FidelityIcons"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"

const DEFAULT_MODEL_ICON = "/models/openai.svg"

export const MODELS = [
  { id: "gpt-5", name: "GPT-5", icon: "/models/openai.svg" },
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", icon: "/models/claude.svg" },
  { id: "gemini", name: "Gemini", icon: "/models/gemini.svg" },
  { id: "assistant", name: "Assistant", icon: "/models/anthropic.svg" },
]

export default function ModelSelector({ selectedModel, onSelect, compact = false, models }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const list = models?.length ? models : MODELS
  const current = list.find((m) => m.id === selectedModel) ?? list[0]

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cls(
          "inline-flex items-center gap-1.5 rounded-full transition-colors hover:bg-white/70 dark:hover:bg-white/10",
          compact ? "px-2 py-1.5" : "px-2.5 py-1.5",
        )}
        aria-label={t("selectModel")}
        title={current.name}
      >
        <img src={current.icon ?? DEFAULT_MODEL_ICON} alt="" className="h-5 w-5 shrink-0 rounded-full object-contain" draggable={false} />
        {!compact && <span className="max-w-[120px] truncate text-xs font-medium text-slate-600 dark:text-slate-300">{current.name}</span>}
        <ChevronDown className={cls("h-3.5 w-3.5 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="glass-panel absolute bottom-full left-0 z-50 mb-2 w-52 overflow-hidden rounded-2xl py-1 shadow-lg">
          {list.map((model) => (
            <button
              key={model.id}
              type="button"
              onClick={() => {
                onSelect?.(model.id)
                setOpen(false)
              }}
              className={cls(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-white/55 dark:hover:bg-white/10",
                model.id === selectedModel &&
                  "bg-[color:color-mix(in_srgb,var(--fi-primary)_12%,white)] text-[var(--fi-primary)] dark:bg-[color:color-mix(in_srgb,var(--fi-primary)_24%,transparent)] dark:text-slate-100",
              )}
            >
              <img src={model.icon ?? DEFAULT_MODEL_ICON} alt="" className="h-5 w-5 shrink-0 rounded-full object-contain" draggable={false} />
              <span className="flex-1 truncate">{model.name}</span>
              {model.id === selectedModel && (
                <Check className="h-3.5 w-3.5 shrink-0 text-[var(--fi-primary)] dark:text-slate-200" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
