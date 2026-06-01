import { getApiProxyTarget } from './proxy-target'

const DEV_UPLOAD_PATH = '/api/dev-upload/'

/** Presign PUT paths that should go through the Next.js upload proxy */
const BACKEND_UPLOAD_PATH_RE = /^\/v1\/(?:_dev\/)?uploads\/[^/]+/

export function isProxiedBackendUploadPath(pathname: string): boolean {
  return BACKEND_UPLOAD_PATH_RE.test(pathname)
}

/** @deprecated Use isProxiedBackendUploadPath */
export function isDevBackendUploadPath(pathname: string): boolean {
  return isProxiedBackendUploadPath(pathname)
}

export function extractUploadIdFromUploadPath(pathname: string): string | null {
  const match = pathname.match(/\/uploads\/([^/?#]+)/)
  return match?.[1] ?? null
}

/**
 * Normalize presign uploadUrl to the configured backend origin (API_PROXY_TARGET).
 */
export function normalizePresignUploadTarget(uploadUrl: string): string | null {
  try {
    const parsed = new URL(uploadUrl)
    if (!isProxiedBackendUploadPath(parsed.pathname)) {
      return null
    }
    const proxy = new URL(getApiProxyTarget())
    parsed.protocol = proxy.protocol
    parsed.host = proxy.host
    return parsed.toString()
  } catch {
    return null
  }
}

/**
 * Presign URLs pointing at the backend are rewritten to same-origin `/api/dev-upload`
 * so the browser PUT is proxied (avoids CORS). Pass the original URL via
 * `X-Original-Upload-Url` on PUT.
 */
export function resolveStorageUploadUrl(uploadUrl: string): string {
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
    const parsed = new URL(uploadUrl, base)
    if (!isProxiedBackendUploadPath(parsed.pathname)) {
      return uploadUrl
    }
    const uploadId = extractUploadIdFromUploadPath(parsed.pathname)
    if (!uploadId) return uploadUrl
    return `${DEV_UPLOAD_PATH}${encodeURIComponent(uploadId)}${parsed.search}`
  } catch {
    return uploadUrl
  }
}

export function usesUploadProxy(resolvedUrl: string): boolean {
  return resolvedUrl.includes(DEV_UPLOAD_PATH)
}

/** @deprecated Use isProxiedBackendUploadPath */
export function isLocalDevUploadPath(pathname: string): boolean {
  return isProxiedBackendUploadPath(pathname)
}
