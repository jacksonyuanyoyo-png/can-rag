/** Markdown 图片 src → 可请求的 URL */
export function resolveUploadAssetUrl(
  apiBase: string,
  src: string | undefined | null,
): string | null {
  if (!src?.trim()) return null
  const trimmed = src.trim()
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed === 'placeholder' || trimmed === '{placeholder}') return null
  const key = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  if (!key.startsWith('kb_images/') && !key.startsWith('kb/')) return null
  const base = apiBase.replace(/\/$/, '')
  const encoded = key.split('/').map((seg) => encodeURIComponent(seg)).join('/')
  return `${base}/v1/uploads/assets/${encoded}`
}

/** 列表折叠预览：去掉 Markdown 语法，避免显示 ![...](kb_images/...) 原文 */
export function markdownPreviewText(text: string | undefined | null): string {
  if (!text) return ''
  return text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt: string) => (alt ? `[${alt}]` : '[图片]'))
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\n+/g, ' ')
    .trim()
}
