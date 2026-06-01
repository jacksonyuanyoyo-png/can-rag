/** Shared backend URL for next.config rewrites (cannot import TS from next.config). */
export function getApiProxyTarget() {
  const raw =
    process.env.API_PROXY_TARGET?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    'http://localhost:8000'
  return raw.replace(/\/+$/, '')
}
