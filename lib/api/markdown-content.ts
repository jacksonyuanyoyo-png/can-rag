import { getApiBaseUrl } from './config'
import { getApiProxyTarget } from './proxy-target'
import { isUploadAssetImageHref } from './upload-assets'

/** Placeholder emitted by the RAG backend in markdown image/link URLs. */
const BACKEND_URL_PLACEHOLDER = /<\$\^backend-url\^\$>/gi

/**
 * Origin used to expand `<$^backend-url^$>` in assistant markdown.
 * Browser: `NEXT_PUBLIC_API_BASE_URL` if set, else `''` so `/v1/...` uses the Next.js proxy.
 * Server: proxy target (e.g. http://localhost:8000).
 */
export function getBackendOriginForMarkdown(): string {
  const explicit = process.env.NEXT_PUBLIC_API_BASE_URL?.trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  if (typeof window !== 'undefined') {
    return getApiBaseUrl()
  }

  return getApiProxyTarget()
}

/** `[图1](.../kb_images/...)` → `![图1](...)` so ReactMarkdown renders `<img>`. */
function promoteImageLinksToMarkdown(text: string): string {
  return text.replace(/(?<!!)\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    if (!isUploadAssetImageHref(url)) return match
    return `![${alt}](${url})`
  })
}

/** Replace backend URL placeholder and normalize citation markers for rendering. */
export function prepareAssistantMarkdown(content: string): string {
  if (!content) return content

  const origin = getBackendOriginForMarkdown()
  let text = content.replace(BACKEND_URL_PLACEHOLDER, origin)

  text = promoteImageLinksToMarkdown(text)

  // Inline citation bubbles: 【1】、[^1^]、^1^
  text = text
    .replace(/【(\d+)】/g, '[$1](#cite-$1)')
    .replace(/\[\^(\d+)\^\]/g, '[$1](#cite-$1)')
    .replace(/(?<!\w)\^(\d+)\^(?!\w)/g, '[$1](#cite-$1)')

  return text
}
