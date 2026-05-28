const DEFAULT_API_BASE_URL = 'http://localhost:8000'

function readEnv(name: string): string | undefined {
  return process.env[name]
}

/**
 * Browser (dev): empty base → same-origin `/v1/*`, proxied by Next.js to avoid CORS.
 * Node/scripts: `API_PROXY_TARGET` or default backend URL.
 */
export function getApiBaseUrl(): string {
  const explicit = readEnv('NEXT_PUBLIC_API_BASE_URL')
  if (explicit !== undefined && explicit.trim() !== '') {
    return explicit.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    return ''
  }

  const serverTarget = readEnv('API_PROXY_TARGET') ?? DEFAULT_API_BASE_URL
  return serverTarget.replace(/\/+$/, '')
}

export function isSseEnabled(): boolean {
  const raw = readEnv('NEXT_PUBLIC_ENABLE_SSE')
  if (raw === undefined) return true
  return raw === 'true' || raw === '1'
}

export const API_PREFIX = '/v1'

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${normalizedPath}`
}
