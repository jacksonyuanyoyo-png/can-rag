"use client"

import { HelpCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { surfaceInput } from "../libraryUi"
import { cls } from "../utils"

const INDEX_SIZE_OPTIONS = [256, 512, 1024]

function FieldLabel({ children, htmlFor, helpText }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium text-slate-800">
          {children}
        </label>
      ) : (
        <span className="text-sm font-medium text-slate-800">{children}</span>
      )}
      {helpText ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--fi-primary)]"
              aria-label={helpText}
            >
              <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {helpText}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function parsePositiveInt(raw, fallback) {
  if (raw === "") return fallback
  const n = parseInt(raw, 10)
  if (Number.isNaN(n)) return fallback
  return Math.max(1, n)
}

export default function CustomChunkParagraphFields({ mode, values, onChange, disabled, t }) {
  if (mode !== "paragraph") return null

  const modelParagraph = values.modelParagraph ?? "disabled"
  const maxParagraphDepth = values.maxParagraphDepth ?? 5
  const maxChunkSize = values.maxChunkSize ?? 1000
  const indexSize = values.indexSize ?? 512

  const patch = (partial) => onChange({ ...values, ...partial })

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="kb-import-model-paragraph">{t("kbImportModelParagraph")}</FieldLabel>
        <Select
          value={modelParagraph}
          onValueChange={(v) => patch({ modelParagraph: v })}
          disabled={disabled}
        >
          <SelectTrigger
            id="kb-import-model-paragraph"
            className={cls("w-full", surfaceInput)}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disabled">{t("kbImportModelParagraphDisabled")}</SelectItem>
            <SelectItem value="enabled">{t("kbImportModelParagraphEnabled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <FieldLabel htmlFor="kb-import-max-paragraph-depth">
          {t("kbImportMaxParagraphDepth")}
        </FieldLabel>
        <Input
          id="kb-import-max-paragraph-depth"
          type="number"
          min={1}
          disabled={disabled}
          value={maxParagraphDepth}
          onChange={(e) =>
            patch({ maxParagraphDepth: parsePositiveInt(e.target.value, 5) })
          }
          className={cls("w-full", surfaceInput)}
        />
      </div>

      <div>
        <FieldLabel htmlFor="kb-import-max-chunk-size">{t("kbImportMaxChunkSize")}</FieldLabel>
        <Input
          id="kb-import-max-chunk-size"
          type="number"
          min={1}
          disabled={disabled}
          value={maxChunkSize}
          onChange={(e) =>
            patch({ maxChunkSize: parsePositiveInt(e.target.value, 1000) })
          }
          className={cls("w-full", surfaceInput)}
        />
      </div>

      <div>
        <FieldLabel helpText={t("kbImportIndexSizeHelp")}>{t("kbImportIndexSize")}</FieldLabel>
        <Select
          value={String(indexSize)}
          onValueChange={(v) => patch({ indexSize: Number(v) })}
          disabled={disabled}
        >
          <SelectTrigger className={cls("w-full", surfaceInput)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INDEX_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
