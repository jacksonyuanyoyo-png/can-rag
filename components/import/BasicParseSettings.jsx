"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { cls } from "../utils"

/** 与工程主色一致，覆盖 ui/checkbox 默认 primary 蓝色 */
const SURFACE_CHECKBOX =
  "border-slate-200 bg-white shadow-sm data-[state=checked]:border-[var(--fi-primary)] data-[state=checked]:bg-[var(--fi-primary)] data-[state=checked]:text-white focus-visible:ring-[color:color-mix(in_srgb,var(--fi-primary)_35%,transparent)]"

function ParseBasicOption({ id, label, description, checked, onChange, disabled, hint }) {
  return (
    <label
      htmlFor={id}
      className={cls(
        "flex min-w-[8rem] flex-1 gap-2.5",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      )}
    >
      <Checkbox
        id={id}
        className={SURFACE_CHECKBOX}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onChange(v === true)}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
          {disabled && hint ? hint : description}
        </span>
      </span>
    </label>
  )
}

function ParseWebOption({ label, description }) {
  return (
    <label className="flex min-w-[8rem] flex-1 gap-2.5 cursor-default">
      <input
        type="radio"
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--fi-primary)]"
        checked
        disabled
        readOnly
        aria-label={label}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{description}</span>
      </span>
    </label>
  )
}

export default function BasicParseSettings({
  sourceType = "file",
  layout,
  onLayoutChange,
  layoutDisabled = false,
  disabled = false,
  t,
}) {
  if (sourceType === "url") {
    return (
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start">
        <ParseWebOption
          label={t("kbImportBasicWebText")}
          description={t("kbImportBasicWebTextDesc")}
        />
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-start">
      <ParseBasicOption
        id="parse-text"
        label={t("kbImportBasicText")}
        description={t("kbImportBasicTextDesc")}
        checked
        disabled
        onChange={() => {}}
      />
      <ParseBasicOption
        id="parse-layout"
        label={t("kbImportBasicLayout")}
        description={t("kbImportBasicLayoutDesc")}
        hint={t("kbImportBasicLayoutPdfOnly")}
        checked={layout}
        disabled={disabled || layoutDisabled}
        onChange={onLayoutChange}
      />
    </div>
  )
}
