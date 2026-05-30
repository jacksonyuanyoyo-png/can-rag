const DEV_UPLOAD_PATH = '/api/dev-upload/'

/** Dev presign URLs point at the backend host; rewrite to same-origin dev upload route. */
export function resolveStorageUploadUrl(uploadUrl: string): string {
  if (typeof window === 'undefined') {
    return rewriteLocalBackendUploadUrl(uploadUrl)
  }

  try {
    const parsed = new URL(uploadUrl, window.location.origin)
    if (isLocalDevUploadPath(parsed.pathname) && isLocalBackendHost(parsed.hostname, parsed.port)) {
      const uploadId = parsed.pathname.split('/').pop()
      if (uploadId) {
        return `${DEV_UPLOAD_PATH}${uploadId}${parsed.search}`
      }
    }
  } catch {
    // Relative or opaque URL — use as-is.
  }

  return uploadUrl
}

export function isLocalDevUploadPath(pathname: string): boolean {
  return pathname.startsWith('/v1/_dev/uploads/')
}

function isLocalBackendHost(hostname: string, port: string): boolean {
  return (
    (hostname === '127.0.0.1' || hostname === 'localhost') &&
    (port === '8000' || port === '')
  )
}

function rewriteLocalBackendUploadUrl(uploadUrl: string): string {
  try {
    const parsed = new URL(uploadUrl)
    if (isLocalDevUploadPath(parsed.pathname) && isLocalBackendHost(parsed.hostname, parsed.port)) {
      const uploadId = parsed.pathname.split('/').pop()
      if (uploadId) {
        return `${DEV_UPLOAD_PATH}${uploadId}${parsed.search}`
      }
    }
  } catch {
    // ignore
  }
  return uploadUrl
}
