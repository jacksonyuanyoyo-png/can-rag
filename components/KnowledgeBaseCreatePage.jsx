"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, HelpCircle } from "lucide-react"
import { useLocale } from "./LocaleProvider"
import { addKnowledgeBase } from "./mockKnowledgeBases"
import {
  libraryEmbeddedShell,
  primaryBtn,
  surfaceBtn,
  surfaceInput,
} from "./libraryUi"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cls } from "./utils"

const NAME_MAX = 50
const REMARKS_MAX = 400
const NAME_PATTERN = /^[\u4e00-\u9fa5a-zA-Z0-9_\-.]*$/

const VECTOR_MODELS = [
  { id: "multilingual-embedding", label: "multilingual-embedding" },
]

/** 标签列随文案伸缩，控件列占满剩余宽度 */
const FORM_GRID =
  "grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-[minmax(0,max-content)_minmax(0,1fr)] sm:gap-x-8 sm:gap-y-6"

function SectionTitle({ children }) {
  return (
    <div className="col-span-full mb-1 flex items-center gap-2.5 sm:mb-2">
      <span className="h-4 w-1 shrink-0 rounded-sm bg-gray-950" aria-hidden />
      <h2 className="text-sm font-semibold tracking-tight text-gray-950">{children}</h2>
    </div>
  )
}

function StepIndicator({ step, label, active }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cls(
          "grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold",
          active
            ? "bg-gray-950 text-white shadow-sm"
            : "border border-white/55 bg-white/55 text-gray-400 shadow-inner backdrop-blur-xl",
        )}
      >
        {step}
      </span>
      <span
        className={cls(
          "truncate text-sm font-medium",
          active ? "text-gray-950" : "text-gray-400",
        )}
      >
        {label}
      </span>
    </div>
  )
}

function CharCounter({ current, max, className }) {
  return (
    <span
      className={cls(
        "pointer-events-none absolute text-xs text-gray-400",
        className,
      )}
    >
      {current}/{max}
    </span>
  )
}

function FormLabel({ label, required, labelExtra, htmlFor }) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex min-w-0 items-start gap-1.5 text-sm font-medium leading-snug text-gray-950 sm:items-center"
    >
      <span className="min-w-0 break-words">
        {label}
        {required ? (
          <span className="ml-0.5 text-red-500" aria-hidden>
            *
          </span>
        ) : null}
      </span>
      {labelExtra ? (
        <span className="inline-flex shrink-0 items-center">{labelExtra}</span>
      ) : null}
    </label>
  )
}

function FormRow({ label, required, labelExtra, htmlFor, children, className }) {
  return (
    <>
      <FormLabel
        label={label}
        required={required}
        labelExtra={labelExtra}
        htmlFor={htmlFor}
      />
      <div className={cls("min-w-0", className)}>{children}</div>
    </>
  )
}

function FormActions({ children }) {
  return (
    <div className="col-span-full flex flex-wrap items-center gap-2 pt-1 sm:col-start-2 sm:gap-3 sm:pt-2">
      {children}
    </div>
  )
}

export default function KnowledgeBaseCreatePage({ embedded = false }) {
  const { t } = useLocale()
  const router = useRouter()

  const [name, setName] = useState("")
  const [remarks, setRemarks] = useState("")
  const [vectorModel, setVectorModel] = useState(VECTOR_MODELS[0].id)
  const [errors, setErrors] = useState({ name: "", vector: "" })
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const next = { name: "", vector: "" }
    const trimmed = name.trim()
    if (!trimmed) {
      next.name = t("kbCreateNameRequiredError")
    } else if (!NAME_PATTERN.test(trimmed)) {
      next.name = t("kbCreateNameInvalid")
    }
    if (!vectorModel) {
      next.vector = t("kbCreateVectorRequiredError")
    }
    setErrors(next)
    return !next.name && !next.vector
  }

  const handleCreate = async (importAfter) => {
    if (!validate()) return
    setSubmitting(true)
    try {
      const kb = addKnowledgeBase({
        name: name.trim(),
        description: remarks.trim(),
      })
      if (importAfter) {
        router.push(`/library/${kb.id}/import`)
      } else {
        router.push(`/library/${kb.id}`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cls(
        embedded
          ? "flex min-h-0 flex-1 flex-col overflow-hidden text-gray-950"
          : "apple-surface flex h-dvh w-full flex-col overflow-hidden text-gray-950",
      )}
    >
      <div
        className={cls(
          libraryEmbeddedShell,
          "min-h-0 flex-1 overflow-y-auto overscroll-contain",
        )}
      >
        <div className="mx-auto w-full max-w-[920px] px-2 py-4 sm:px-4 sm:py-6">
          <header className="mb-8 flex flex-col gap-5 md:gap-6">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href="/library"
                className="shrink-0 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white/55 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
                aria-label={t("kbBackToList")}
              >
                <ArrowLeft className="h-5 w-5" strokeWidth={1.5} />
              </Link>
              <h1 className="min-w-0 text-lg font-semibold tracking-tight text-gray-950 sm:text-xl">
                {t("kbCreate")}
              </h1>
            </div>

            <nav
              className="flex flex-wrap items-center justify-center gap-3 sm:justify-start md:justify-center"
              aria-label={t("kbCreateStepDefine")}
            >
              <StepIndicator step={1} label={t("kbCreateStepDefine")} active />
              <div className="h-px w-6 shrink-0 bg-gray-200 sm:w-10" aria-hidden />
              <StepIndicator step={2} label={t("kbCreateStepImport")} active={false} />
            </nav>
          </header>

          <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
            <section className={FORM_GRID}>
              <SectionTitle>{t("kbCreateSectionDefine")}</SectionTitle>

              <FormRow label={t("kbCreateNameLabel")} required htmlFor="kb-name">
                <div>
                  <div className="relative">
                    <input
                      id="kb-name"
                      type="text"
                      value={name}
                      maxLength={NAME_MAX}
                      placeholder={t("kbCreateNamePlaceholder")}
                      onChange={(e) => {
                        setName(e.target.value)
                        if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
                      }}
                      className={cls(
                        "w-full pr-14",
                        surfaceInput,
                        errors.name && "border-red-300/80 focus:ring-red-200",
                      )}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby="kb-name-hint kb-name-error"
                    />
                    <CharCounter
                      current={name.length}
                      max={NAME_MAX}
                      className="right-3 top-1/2 -translate-y-1/2"
                    />
                  </div>
                  <p
                    id="kb-name-hint"
                    className="mt-1.5 text-xs leading-relaxed text-gray-500"
                  >
                    {t("kbCreateNameHint")}
                  </p>
                  {errors.name ? (
                    <p id="kb-name-error" className="mt-1 text-xs text-red-600">
                      {errors.name}
                    </p>
                  ) : null}
                </div>
              </FormRow>

              <FormRow label={t("kbCreateRemarksLabel")} htmlFor="kb-remarks">
                <div className="relative">
                  <textarea
                    id="kb-remarks"
                    value={remarks}
                    maxLength={REMARKS_MAX}
                    rows={4}
                    placeholder={t("kbCreateRemarksPlaceholder")}
                    onChange={(e) => setRemarks(e.target.value)}
                    className={cls("w-full resize-y pb-7", surfaceInput)}
                  />
                  <CharCounter
                    current={remarks.length}
                    max={REMARKS_MAX}
                    className="bottom-2.5 right-3"
                  />
                </div>
              </FormRow>
            </section>

            <section className={FORM_GRID}>
              <SectionTitle>{t("kbCreateSectionConfigure")}</SectionTitle>

              <FormRow
                label={t("kbCreateVectorModelLabel")}
                required
                htmlFor="kb-vector-model"
                labelExtra={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="rounded-full p-0.5 text-gray-400 transition hover:bg-white/55 hover:text-gray-600"
                        aria-label={t("kbCreateVectorModelHelp")}
                      >
                        <HelpCircle className="h-4 w-4" strokeWidth={1.5} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs text-xs">
                      {t("kbCreateVectorModelHelp")}
                    </TooltipContent>
                  </Tooltip>
                }
              >
                <div>
                  <div className="relative max-w-xl">
                    <select
                      id="kb-vector-model"
                      value={vectorModel}
                      onChange={(e) => {
                        setVectorModel(e.target.value)
                        if (errors.vector) setErrors((prev) => ({ ...prev, vector: "" }))
                      }}
                      className={cls(
                        "w-full appearance-none py-2.5 pl-3 pr-10",
                        surfaceInput,
                        errors.vector && "border-red-300/80 focus:ring-red-200",
                      )}
                      aria-invalid={Boolean(errors.vector)}
                    >
                      {VECTOR_MODELS.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  </div>
                  {errors.vector ? (
                    <p className="mt-1.5 text-xs text-red-600">{errors.vector}</p>
                  ) : null}
                </div>
              </FormRow>
            </section>

            <div className={FORM_GRID}>
              <FormActions>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreate(true)}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    primaryBtn,
                    "disabled:opacity-60",
                  )}
                >
                  {t("kbCreateSubmitImport")}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleCreate(false)}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    surfaceBtn,
                  )}
                >
                  {t("kbCreateSubmitOnly")}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => router.push("/library")}
                  className={cls(
                    "inline-flex min-w-0 items-center justify-center px-5 py-2.5 sm:min-w-[7.5rem]",
                    surfaceBtn,
                  )}
                >
                  {t("kbCreateCancel")}
                </button>
              </FormActions>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
