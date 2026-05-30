import { createHash } from 'crypto'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

function getUploadRoot(): string {
  const configured = process.env.DEV_UPLOAD_ROOT?.trim()
  if (configured) {
    return path.isAbsolute(configured)
      ? configured
      : path.join(process.cwd(), configured)
  }
  return path.join(process.cwd(), '../CAN-RAG-BackEnd/app/storage/uploads')
}

function normalizeStorageKey(storageKey: string): string | null {
  const normalized = path.normalize(storageKey.replace(/\\/g, '/'))
  if (path.isAbsolute(normalized) || normalized.startsWith('..')) {
    return null
  }
  return normalized
}

/** Local dev shim: write presigned bytes to backend LOCAL_UPLOAD_ROOT before :complete. */
export async function PUT(
  request: NextRequest,
  context: { params: { uploadId: string } },
) {
  void context.params.uploadId

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

  const body = Buffer.from(await request.arrayBuffer())
  const destination = path.join(getUploadRoot(), safeKey)
  await mkdir(path.dirname(destination), { recursive: true })
  await writeFile(destination, body)

  const etag = `"${createHash('md5').update(body).digest('hex')}"`
  return new NextResponse(null, {
    status: 200,
    headers: { ETag: etag },
  })
}
