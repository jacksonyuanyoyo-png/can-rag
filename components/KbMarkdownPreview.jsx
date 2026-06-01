"use client"

import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getApiBaseUrl } from "@/lib/api/config"
import { prepareAssistantMarkdown } from "@/lib/api/markdown-content"
import { isUploadAssetImageHref, resolveUploadAssetUrl } from "@/lib/api/upload-assets"
import { cls } from "./utils"

export { markdownPreviewText } from "@/lib/api/upload-assets"

function renderUploadImage(apiBase, src, alt, className) {
  const url = resolveUploadAssetUrl(apiBase, src)
  if (!url) {
    return (
      <span className="text-slate-400 dark:text-slate-500" title={src ?? ""}>
        [{alt ?? "图片"}]
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt ?? ""}
      loading="lazy"
      className={className}
    />
  )
}

export default function KbMarkdownPreview({
  markdown,
  className = "",
  highlight = false,
  muted = false,
}) {
  const apiBase = getApiBaseUrl()
  const prepared = useMemo(() => prepareAssistantMarkdown(markdown ?? ""), [markdown])

  const components = useMemo(
    () => ({
      img: ({ src, alt }) =>
        renderUploadImage(
          apiBase,
          src,
          alt,
          "my-2 block max-w-full rounded-lg border border-slate-200 dark:border-slate-700",
        ),
      a: ({ href, children }) => {
        const imageUrl = resolveUploadAssetUrl(apiBase, href)
        if (imageUrl && isUploadAssetImageHref(href)) {
          const alt =
            typeof children === "string"
              ? children
              : Array.isArray(children)
                ? children.join("")
                : "图片"
          return renderUploadImage(
            apiBase,
            href,
            alt,
            "my-2 block max-w-full rounded-lg border border-slate-200 dark:border-slate-700",
          )
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--fi-primary)] underline underline-offset-2"
          >
            {children}
          </a>
        )
      },
      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
      strong: ({ children }) => (
        <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
      ),
    }),
    [apiBase],
  )

  if (!markdown?.trim()) return null

  return (
    <div
      className={cls(
        "kb-markdown text-sm leading-relaxed",
        muted ? "text-slate-500" : "text-slate-700",
        highlight && "rounded-lg bg-violet-50 px-3 py-2 text-slate-800 ring-1 ring-violet-100",
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {prepared}
      </ReactMarkdown>
    </div>
  )
}
