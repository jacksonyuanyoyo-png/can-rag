"use client"

import { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { getApiBaseUrl } from "@/lib/api/config"
import { prepareAssistantMarkdown } from "@/lib/api/markdown-content"
import { isUploadAssetImageHref, resolveUploadAssetUrl } from "@/lib/api/upload-assets"
import { cls } from "./utils"

function CitationRef({ index }) {
  return (
    <sup className="ml-0.5 inline-flex align-super">
      <a
        href={`#cite-${index}`}
        className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-slate-100 px-1 text-[10px] font-medium leading-none text-slate-600 no-underline transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
      >
        {index}
      </a>
    </sup>
  )
}

export default function ChatMarkdown({ content, className = "" }) {
  const apiBase = getApiBaseUrl()
  const prepared = useMemo(() => prepareAssistantMarkdown(content ?? ""), [content])

  const components = useMemo(
    () => ({
      img: ({ src, alt }) => {
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
            className="my-3 block max-w-full rounded-lg border border-slate-200 dark:border-slate-700"
          />
        )
      },
      p: ({ children }) => (
        <p className="mb-3 last:mb-0 leading-7 text-slate-800 dark:text-slate-200">{children}</p>
      ),
      h1: ({ children }) => (
        <h1 className="mb-3 mt-5 text-xl font-semibold text-slate-900 first:mt-0 dark:text-slate-50">
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 className="mb-2 mt-5 text-lg font-semibold text-slate-900 first:mt-0 dark:text-slate-50">
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 className="mb-2 mt-4 text-base font-semibold text-slate-900 first:mt-0 dark:text-slate-50">
          {children}
        </h3>
      ),
      ul: ({ children }) => (
        <ul className="mb-3 list-disc space-y-1.5 pl-5 leading-7 text-slate-800 dark:text-slate-200">
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol className="mb-3 list-decimal space-y-1.5 pl-5 leading-7 text-slate-800 dark:text-slate-200">
          {children}
        </ol>
      ),
      li: ({ children }) => <li className="leading-7">{children}</li>,
      strong: ({ children }) => (
        <strong className="font-semibold text-slate-900 dark:text-slate-100">{children}</strong>
      ),
      a: ({ href, children }) => {
        const citeMatch = href?.match(/^#cite-(\d+)$/)
        if (citeMatch) {
          return <CitationRef index={citeMatch[1]} />
        }
        const imageUrl = resolveUploadAssetUrl(apiBase, href)
        if (imageUrl && isUploadAssetImageHref(href)) {
          const alt =
            typeof children === "string"
              ? children
              : Array.isArray(children)
                ? children.join("")
                : "图片"
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={alt || "图片"}
              loading="lazy"
              className="my-3 block max-w-full rounded-lg border border-slate-200 dark:border-slate-700"
            />
          )
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--fi-primary)] underline underline-offset-2 hover:text-[var(--fi-primary-hover)]"
          >
            {children}
          </a>
        )
      },
      blockquote: ({ children }) => (
        <blockquote className="mb-3 border-l-2 border-slate-200 pl-4 text-slate-600 dark:border-slate-600 dark:text-slate-400">
          {children}
        </blockquote>
      ),
      code: ({ className: codeClassName, children, ...props }) => {
        const isBlock = codeClassName?.includes("language-")
        if (isBlock) {
          return (
            <code
              className={cls(
                "block overflow-x-auto rounded-lg bg-slate-100 p-3 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100",
                codeClassName,
              )}
              {...props}
            >
              {children}
            </code>
          )
        }
        return (
          <code
            className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.9em] text-slate-800 dark:bg-slate-800 dark:text-slate-100"
            {...props}
          >
            {children}
          </code>
        )
      },
      pre: ({ children }) => (
        <pre className="mb-3 overflow-x-auto rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-800">
          {children}
        </pre>
      ),
      hr: () => <hr className="my-5 border-slate-200 dark:border-slate-700" />,
      table: ({ children }) => (
        <div className="mb-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">{children}</table>
        </div>
      ),
      th: ({ children }) => (
        <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold dark:border-slate-700 dark:bg-slate-800">
          {children}
        </th>
      ),
      td: ({ children }) => (
        <td className="border border-slate-200 px-3 py-2 dark:border-slate-700">{children}</td>
      ),
    }),
    [apiBase],
  )

  if (!content?.trim()) return null

  return (
    <div className={cls("chat-markdown text-[15px]", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {prepared}
      </ReactMarkdown>
    </div>
  )
}
