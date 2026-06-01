const DEFAULT_API_PROXY_TARGET = 'http://localhost:8000'

/**
 * Backend origin for Next.js rewrites, dev-upload proxy, and SSE passthrough.
 * Set `API_PROXY_TARGET` (server) or `NEXT_PUBLIC_API_BASE_URL` (also used when server env is unset).
 */
export function getApiProxyTarget(): string {
  const raw =
    process.env.API_PROXY_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    DEFAULT_API_PROXY_TARGET
  return raw.replace(/\/+$/, '')
}
