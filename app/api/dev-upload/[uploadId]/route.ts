import { createHash } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { resolveDevUploadRoot } from '@/lib/api/dev-upload-root'
import { getApiProxyTarget } from '@/lib/api/proxy-target'
import { normalizePresignUploadTarget } from '@/lib/api/upload-url'

export const runtime = 'nodejs'

type DevUploadMode = 'auto' | 'proxy' | 'local'

function devUploadMode(): DevUploadMode {
  const mode = process.env.DEV_UPLOAD_MODE?.trim().toLowerCase()
  if (mode === 'local' || mode === 'proxy' || mode === 'auto') {
    return mode
  }
  return 'auto'
}

function normalizeStorageKey(storageKey: string): string | null {
  const normalized = path.normalize(storageKey.replace(/\\/g, '/'))
  if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
    return null
  }
  return normalized
}

function resolveProxyTargets(request: NextRequest, uploadId: string): string[] {
  const targets: string[] = []
  const original = request.headers.get('x-original-upload-url')
  if (original) {
    const normalized = normalizePresignUploadTarget(original)
    if (normalized) {
      targets.push(appendSearch(normalized, request.nextUrl.search))
    }
  }

  const proxyBase = getApiProxyTarget()
  targets.push(`${proxyBase}/v1/_dev/uploads/${uploadId}${request.nextUrl.search}`)

  return [...new Set(targets)]
}

function appendSearch(url: string, search: string): string {
  if (!search || url.includes('?')) return url
  return `${url}${search}`
}

function buildForwardHeaders(request: NextRequest, storageKey: string): Headers {
  const headers = new Headers()
  headers.set('X-Storage-Key', storageKey)

  const presignHeader = request.headers.get('x-original-upload-url')
  if (presignHeader) {
    try {
      const presignUrl = new URL(presignHeader)
      for (const [key, value] of presignUrl.searchParams) {
        if (!headers.has(key)) headers.set(key, value)
      }
    } catch {
      // ignore
    }
  }

  const contentType = request.headers.get('content-type')
  if (contentType) headers.set('Content-Type', contentType)

  return headers
}

async function writePutToLocalDisk(
  body: Buffer,
  storageKey: string,
): Promise<NextResponse> {
  const safeKey = normalizeStorageKey(storageKey)
  if (!safeKey) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid storage key',
        },
      },
      { status: 400 },
    )
  }

  const destination = path.join(resolveDevUploadRoot(), safeKey)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, body)

  const etag = `"${createHash('md5').update(body).digest('hex')}"`
  return new NextResponse(null, {
    status: 200,
    headers: { ETag: etag },
  })
}

async function proxyPutToBackend(
  request: NextRequest,
  uploadId: string,
  storageKey: string,
): Promise<NextResponse> {
  const headers = buildForwardHeaders(request, storageKey)
  const body = await request.arrayBuffer()
  const targets = resolveProxyTargets(request, uploadId)
  let lastTarget = targets[0] ?? ''
  let saw404 = false

  for (const target of targets) {
    lastTarget = target
    try {
      const backendResponse = await fetch(target, { method: 'PUT', headers, body })
      if (backendResponse.status === 404) {
        saw404 = true
        continue
      }

      const responseHeaders = new Headers()
      const etag =
        backendResponse.headers.get('etag') ?? backendResponse.headers.get('ETag')
      if (etag) responseHeaders.set('ETag', etag)

      if (!backendResponse.ok) {
        const detail = await backendResponse.text().catch(() => '')
        return NextResponse.json(
          {
            error: {
              code: 'UPLOAD_BACKEND_ERROR',
              message: `Backend upload failed (HTTP ${backendResponse.status}) at ${target}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
            },
          },
          { status: backendResponse.status, headers: responseHeaders },
        )
      }

      return new NextResponse(backendResponse.body, {
        status: backendResponse.status,
        headers: responseHeaders,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Backend upload proxy failed'
      return NextResponse.json(
        {
          error: {
            code: 'UPLOAD_PROXY_FAILED',
            message: `${message} (target: ${target})`,
          },
        },
        { status: 502 },
      )
    }
  }

  if (saw404 && devUploadMode() === 'auto') {
    return writePutToLocalDisk(Buffer.from(body), storageKey)
  }

  return NextResponse.json(
    {
      error: {
        code: 'UPLOAD_NOT_FOUND',
        message: `Backend PUT /v1/_dev/uploads/{uploadId} returned 404 (last: ${lastTarget}). Restart backend with dev upload route, or set DEV_UPLOAD_MODE=local and DEV_UPLOAD_ROOT to backend uploads directory.`,
      },
    },
    { status: 404 },
  )
}

/** Dev shim: proxy PUT to backend _dev/uploads, or write to backend uploads dir (auto/local). */
export async function PUT(
  request: NextRequest,
  context: { params: { uploadId: string } },
) {
  const uploadId = decodeURIComponent(context.params.uploadId)
  const storageKey = request.headers.get('x-storage-key')
  if (!storageKey) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'X-Storage-Key header is required for dev upload',
        },
      },
      { status: 400 },
    )
  }

  const mode = devUploadMode()
  if (mode === 'local') {
    const body = Buffer.from(await request.arrayBuffer())
    return writePutToLocalDisk(body, storageKey)
  }

  return proxyPutToBackend(request, uploadId, storageKey)
}
