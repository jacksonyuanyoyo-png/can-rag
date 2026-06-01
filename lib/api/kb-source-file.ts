import { API_PREFIX, buildApiUrl } from './config'
import { tokenStore } from './token-store'

export type KbSourceFileUrlOptions = {
  download?: boolean
}

/** GET /v1/knowledge-bases/{kbId}/files/{fileId}/raw — inline preview or attachment download */
export function kbSourceFileUrl(
  kbId: string,
  fileId: string,
  options?: KbSourceFileUrlOptions,
): string {
  const path = `${API_PREFIX}/knowledge-bases/${encodeURIComponent(kbId)}/files/${encodeURIComponent(fileId)}/raw`
  const q = options?.download ? '?disposition=attachment' : ''
  return buildApiUrl(`${path}${q}`)
}

/** Prefer API `sourceFileUrl`; fall back to constructed raw path */
export function resolveKbSourceFileUrl(
  kbId: string,
  fileId: string,
  sourceFileUrl?: string | null,
  options?: KbSourceFileUrlOptions,
): string {
  if (sourceFileUrl?.trim()) {
    const trimmed = sourceFileUrl.trim()
    if (/^https?:\/\//i.test(trimmed)) {
      return appendDisposition(trimmed, options?.download)
    }
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
    return appendDisposition(buildApiUrl(path), options?.download)
  }
  return kbSourceFileUrl(kbId, fileId, options)
}

function appendDisposition(url: string, download?: boolean): string {
  if (!download) return url
  const sep = url.includes('?') ? '&' : '?'
  return `${url}${sep}disposition=attachment`
}

export function kbSourceFileFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = tokenStore.get()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

export async function fetchKbSourceFile(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    credentials: init?.credentials ?? 'include',
    headers: {
      ...kbSourceFileFetchHeaders(),
      ...init?.headers,
    },
  })
}

export type KbSourceFileFormat = 'pdf' | 'docx' | 'markdown' | 'text' | 'iframe'

export function detectKbSourceFileFormat(file: {
  format?: string | null
  mimeType?: string | null
  name?: string | null
}): KbSourceFileFormat {
  const fmt = (file.format ?? '').toLowerCase()
  const mime = (file.mimeType ?? '').toLowerCase()
  const ext = file.name?.split('.').pop()?.toLowerCase() ?? ''

  if (fmt === 'pdf' || mime === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (
    fmt === 'docx' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    return 'docx'
  }
  if (fmt === 'md' || fmt === 'markdown' || ext === 'md' || ext === 'markdown') {
    return 'markdown'
  }
  if (fmt === 'txt' || mime === 'text/plain' || ext === 'txt') return 'text'
  return 'iframe'
}
