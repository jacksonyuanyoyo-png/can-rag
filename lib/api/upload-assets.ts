const UPLOAD_ASSETS_PREFIX = '/v1/uploads/assets/'
const BACKEND_URL_PLACEHOLDER = /<\$\^backend-url\^\$>/gi
const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|bmp)(\?|#|$)/i

/** 判断 href 是否指向知识库上传的图片资源（后端常用 `[图1](url)` 而非 `![]()`） */
export function isUploadAssetImageHref(href: string | undefined | null): boolean {
  if (!href?.trim()) return false
  const u = href.trim().replace(BACKEND_URL_PLACEHOLDER, '')
  if (IMAGE_EXT.test(u)) return true
  if (u.includes(UPLOAD_ASSETS_PREFIX) && /kb_images\//i.test(u)) return true
  if (/^(?:\/)?v1\/uploads\/assets\/kb/i.test(u)) return true
  if (/^kb_images?\//i.test(u)) return true
  return false
}

/** Markdown 图片 src → 可请求的 URL */
export function resolveUploadAssetUrl(
  apiBase: string,
  src: string | undefined | null,
): string | null {
  if (!src?.trim()) return null
  let trimmed = src.trim().replace(/<\$\^backend-url\^\$>/gi, apiBase.replace(/\/$/, ''))
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed === 'placeholder' || trimmed === '{placeholder}') return null

  const base = apiBase.replace(/\/$/, '')

  if (trimmed.includes(UPLOAD_ASSETS_PREFIX)) {
    const pathStart = trimmed.indexOf(UPLOAD_ASSETS_PREFIX)
    const path = trimmed.slice(pathStart)
    return `${base}${path}`
  }

  const key = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  if (key.startsWith('v1/uploads/assets/')) {
    return `${base}/${key}`
  }
  if (!key.startsWith('kb_images/') && !key.startsWith('kb/')) return null
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
