"use client"

import { HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cls } from "../utils"

const RADIO_NAME = "kb-custom-chunk-method"

const OPTIONS = [
  {
    value: "paragraph",
    labelKey: "kbImportCustomModeParagraph",
    helpKey: "kbImportCustomModeParagraphHelp",
    helpPlaceholder: "按段落换行或空行将文档切分为多个块。",
  },
  {
    value: "length",
    labelKey: "kbImportCustomModeLength",
  },
  {
    value: "delimiter",
    labelKey: "kbImportCustomModeDelimiter",
    helpKey: "kbImportCustomModeDelimiterHelp",
    helpPlaceholder: "使用自定义分隔符（例如 ###）将文本切分为多个块。",
  },
]

function tWithFallback(t, key, fallback) {
  const value = t(key)
  return value === key ? fallback : value
}

function OptionHelp({ t, helpKey, placeholder, ariaLabel }) {
  const text = tWithFallback(t, helpKey, placeholder)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--fi-primary)]"
          aria-label={ariaLabel}
        >
          <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

export default function CustomChunkMethodRadio({ mode, onModeChange, disabled, t }) {
  return (
    <div
      className="flex flex-wrap gap-4 sm:gap-6"
      role="radiogroup"
      aria-label={t("kbImportChunkCustomPanelDesc")}
    >
      {OPTIONS.map((option) => (
        <label
          key={option.value}
          className={cls(
            "inline-flex items-center gap-2 text-sm text-slate-800",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          )}
        >
          <input
            type="radio"
            name={RADIO_NAME}
            value={option.value}
            checked={mode === option.value}
            disabled={disabled}
            onChange={() => onModeChange(option.value)}
            className="h-4 w-4 accent-[var(--fi-primary)]"
          />
          <span className="inline-flex items-center gap-1">
            {t(option.labelKey)}
            {option.helpKey ? (
              <OptionHelp
                t={t}
                helpKey={option.helpKey}
                placeholder={option.helpPlaceholder}
                ariaLabel={tWithFallback(t, option.helpKey, option.helpPlaceholder)}
              />
            ) : null}
          </span>
        </label>
      ))}
    </div>
  )
}
