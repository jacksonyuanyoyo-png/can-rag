import type { NextRequest } from 'next/server'
import { getApiProxyTarget } from '@/lib/api/proxy-target'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Passthrough SSE proxy — avoids buffering from Next.js external rewrites. */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await context.params
  const backendUrl = `${getApiProxyTarget()}/v1/conversations/${encodeURIComponent(conversationId)}/messages:stream`

  const headers = new Headers()
  headers.set('Content-Type', request.headers.get('content-type') || 'application/json')
  headers.set('Accept', 'text/event-stream')

  const auth = request.headers.get('authorization')
  if (auth) headers.set('Authorization', auth)

  const requestId = request.headers.get('x-request-id')
  if (requestId) headers.set('X-Request-Id', requestId)

  const backendResponse = await fetch(backendUrl, {
    method: 'POST',
    headers,
    body: await request.arrayBuffer(),
  })

  if (!backendResponse.ok) {
    const text = await backendResponse.text()
    return new Response(text, {
      status: backendResponse.status,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') || 'application/json',
      },
    })
  }

  if (!backendResponse.body) {
    return new Response(
      JSON.stringify({
        error: { code: 'INTERNAL_ERROR', message: 'Empty stream body from backend' },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    )
  }

  return new Response(backendResponse.body, {
    status: backendResponse.status,
    headers: {
      'Content-Type': backendResponse.headers.get('content-type') || 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
