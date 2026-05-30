"use client"

import CustomChunkMethodRadio from "./CustomChunkMethodRadio"
import CustomChunkLengthDelimiterFields from "./CustomChunkLengthDelimiterFields"
import CustomChunkParagraphFields from "./CustomChunkParagraphFields"

export default function CustomChunkSettings({
  mode,
  onModeChange,
  values,
  onValuesChange,
  disabled,
  t,
}) {
  return (
    <div className="theme-border-primary-40 space-y-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs leading-relaxed text-slate-500">{t("kbImportChunkCustomPanelDesc")}</p>
      <hr className="border-slate-100" aria-hidden />
      <CustomChunkMethodRadio
        mode={mode}
        onModeChange={onModeChange}
        disabled={disabled}
        t={t}
      />
      <CustomChunkParagraphFields
        mode={mode}
        values={values}
        onChange={onValuesChange}
        disabled={disabled}
        t={t}
      />
      <CustomChunkLengthDelimiterFields
        mode={mode}
        values={values}
        onChange={onValuesChange}
        disabled={disabled}
        t={t}
      />
    </div>
  )
}
