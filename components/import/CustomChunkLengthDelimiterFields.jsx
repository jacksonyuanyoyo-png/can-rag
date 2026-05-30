"use client"

import { HelpCircle } from "lucide-react"
import { surfaceInput } from "../libraryUi"
import { cls } from "../utils"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const CHUNK_SIZE_MIN = 100
const CHUNK_SIZE_MAX = 4000
const CHUNK_SIZE_DEFAULT = 1000
const CHUNK_OVERLAP_MIN = 0
const CHUNK_OVERLAP_MAX = 500
const INDEX_SIZE_DEFAULT = 512
const INDEX_SIZE_OPTIONS = [256, 512, 1024]

const DELIMITER_OPTIONS = [
  { value: "none", store: null },
  { value: "newline", store: "\n" },
  { value: "double_newline", store: "\n\n" },
  { value: "space", store: " " },
]

const DELIMITER_LABEL_KEYS = {
  none: "kbImportDelimiterNone",
  newline: "kbImportDelimiterNewline",
  double_newline: "kbImportDelimiterDoubleNewline",
  space: "kbImportDelimiterSpace",
}

const labelClass = "text-sm font-medium text-slate-800"

function clampInt(value, min, max, fallback) {
  const n = Number.parseInt(String(value), 10)
  if (Number.isNaN(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function delimiterToSelectValue(delimiter) {
  if (delimiter == null || delimiter === "") return "none"
  const hit = DELIMITER_OPTIONS.find((o) => o.store === delimiter)
  return hit?.value ?? "none"
}

function FieldLabel({ children, htmlFor, help }) {
  return (
    <div className="mb-1.5 flex items-center gap-1.5">
      <label htmlFor={htmlFor} className={labelClass}>
        {children}
      </label>
      {help ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="rounded-full p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-[var(--fi-primary)]"
              aria-label={help}
            >
              <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            {help}
          </TooltipContent>
        </Tooltip>
      ) : null}
    </div>
  )
}

function SliderNumberRow({
  id,
  label,
  value,
  min,
  max,
  defaultValue,
  disabled,
  onChange,
}) {
  const current = clampInt(value, min, max, defaultValue)

  const setValue = (next) => {
    onChange(clampInt(next, min, max, defaultValue))
  }

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <Slider
          id={id}
          className="min-w-0 flex-1 [&_[data-slot=slider-range]]:bg-[var(--fi-primary)] [&_[data-slot=slider-thumb]]:border-[var(--fi-primary)]"
          min={min}
          max={max}
          step={1}
          value={[current]}
          disabled={disabled}
          onValueChange={([v]) => setValue(v)}
        />
        <Input
          type="number"
          min={min}
          max={max}
          step={1}
          value={current}
          disabled={disabled}
          className={cls("h-9 w-20 shrink-0 text-right tabular-nums", surfaceInput)}
          onChange={(e) => setValue(e.target.value)}
          onBlur={(e) => setValue(e.target.value)}
          aria-label={label}
        />
      </div>
    </div>
  )
}

function IndexSizeSelect({ id, label, help, value, disabled, onChange }) {
  const current = INDEX_SIZE_OPTIONS.includes(Number(value))
    ? String(value)
    : String(INDEX_SIZE_DEFAULT)

  return (
    <div>
      <FieldLabel htmlFor={id} help={help}>
        {label}
      </FieldLabel>
      <Select
        value={current}
        disabled={disabled}
        onValueChange={(v) => onChange(Number(v))}
      >
        <SelectTrigger
          id={id}
          className={cls("w-full", surfaceInput)}
          aria-label={label}
        >
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
  )
}

function DelimiterSelect({ id, label, value, disabled, onChange, t }) {
  const selectValue = delimiterToSelectValue(value)

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={selectValue}
        disabled={disabled}
        onValueChange={(v) => {
          const opt = DELIMITER_OPTIONS.find((o) => o.value === v)
          onChange(opt?.store ?? null)
        }}
      >
        <SelectTrigger
          id={id}
          className={cls("w-full", surfaceInput)}
          aria-label={label}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DELIMITER_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {t(DELIMITER_LABEL_KEYS[opt.value])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export default function CustomChunkLengthDelimiterFields({
  mode,
  values,
  onChange,
  disabled = false,
  t,
}) {
  if (mode !== "length" && mode !== "delimiter") {
    return null
  }

  const patch = (partial) => onChange({ ...values, ...partial })

  if (mode === "length") {
    return (
      <div className="space-y-4">
        <SliderNumberRow
          id="kb-import-chunk-size"
          label={t("kbImportChunkSize")}
          value={values.chunkSize}
          min={CHUNK_SIZE_MIN}
          max={CHUNK_SIZE_MAX}
          defaultValue={CHUNK_SIZE_DEFAULT}
          disabled={disabled}
          onChange={(chunkSize) => patch({ chunkSize })}
        />
        <SliderNumberRow
          id="kb-import-chunk-overlap"
          label={t("kbImportChunkOverlap")}
          value={values.chunkOverlap}
          min={CHUNK_OVERLAP_MIN}
          max={CHUNK_OVERLAP_MAX}
          defaultValue={0}
          disabled={disabled}
          onChange={(chunkOverlap) => patch({ chunkOverlap })}
        />
        <IndexSizeSelect
          id="kb-import-index-size-length"
          label={t("kbImportIndexSize")}
          help={t("kbImportIndexSizeHelp")}
          value={values.indexSize}
          disabled={disabled}
          onChange={(indexSize) => patch({ indexSize })}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <DelimiterSelect
        id="kb-import-delimiter"
        label={t("kbImportDelimiter")}
        value={values.delimiter}
        disabled={disabled}
        onChange={(delimiter) => patch({ delimiter })}
        t={t}
      />
      <IndexSizeSelect
        id="kb-import-index-size-delimiter"
        label={t("kbImportIndexSize")}
        help={t("kbImportIndexSizeHelp")}
        value={values.indexSize}
        disabled={disabled}
        onChange={(indexSize) => patch({ indexSize })}
      />
    </div>
  )
}
