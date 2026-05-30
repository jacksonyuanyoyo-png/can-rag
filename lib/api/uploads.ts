import { apiRequest } from './api-client'
import { API_PREFIX } from './config'
import {
  buildImportJobPayload,
  buildImportRetryOptions,
  type ImportChunkingPayload,
} from './kb-utils'
import { resolveStorageUploadUrl } from './upload-url'
import type { ImportJob, PresignUploadItem } from './types'

const TERMINAL_IMPORT_STATUSES = new Set(['completed', 'failed', 'cancelled'])

export async function presignUploads(
  knowledgeBaseId: string,
  files: Array<{ fileName: string; mimeType: string; sizeBytes: number }>,
) {
  return apiRequest<{ uploads: PresignUploadItem[] }>(`${API_PREFIX}/uploads/presign`, {
    method: 'POST',
    body: { knowledgeBaseId, files },
    idempotencyKey: `presign-${knowledgeBaseId}-${Date.now()}`,
  })
}

export async function completeUpload(
  uploadId: string,
  body: { fileId: string; storageKey: string; etag?: string },
) {
  return apiRequest<{ fileId: string; status: string }>(
    `${API_PREFIX}/uploads/${uploadId}:complete`,
    {
      method: 'POST',
      body,
    },
  )
}

export async function createImportJob(
  kbId: string,
  options: {
    fileIds: string[]
    chunking: ImportChunkingPayload
  },
) {
  return apiRequest<ImportJob>(`${API_PREFIX}/knowledge-bases/${kbId}/import-jobs`, {
    method: 'POST',
    body: buildImportJobPayload(options),
    idempotencyKey: `import-${kbId}-${options.fileIds.join('-')}-${Date.now()}`,
  })
}

export async function getImportJob(jobId: string) {
  return apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}`)
}

export async function retryImportJob(jobId: string, options: { chunking: ImportChunkingPayload }) {
  return apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}:retry`, {
    method: 'POST',
    body: buildImportRetryOptions(options),
  })
}

export async function cancelImportJob(jobId: string) {
  return apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}:cancel`, {
    method: 'POST',
    body: {},
  })
}

export function isImportJobTerminal(status: string): boolean {
  return TERMINAL_IMPORT_STATUSES.has(status)
}

export async function putFileToUploadUrl(
  uploadUrl: string,
  file: File,
  headers: Record<string, string> = {},
  storageKey?: string,
): Promise<string> {
  const resolvedUrl = resolveStorageUploadUrl(uploadUrl)
  const putHeaders: Record<string, string> = { ...headers }
  if (storageKey) {
    putHeaders['X-Storage-Key'] = storageKey
  }

  const response = await fetch(resolvedUrl, {
    method: 'PUT',
    headers: putHeaders,
    body: file,
  })
  if (!response.ok) {
    throw new Error(`Upload failed (HTTP ${response.status})`)
  }
  const etag = response.headers.get('ETag') ?? response.headers.get('etag')
  if (!etag) {
    throw new Error('Storage upload succeeded but ETag header is missing')
  }
  return etag.replace(/^"|"$/g, '')
}

export async function pollImportJob(
  jobId: string,
  options: {
    intervalMs?: number
    onUpdate?: (job: ImportJob) => void
    signal?: AbortSignal
  } = {},
): Promise<ImportJob> {
  const intervalMs = options.intervalMs ?? 2000
  while (true) {
    if (options.signal?.aborted) {
      throw new Error('Import polling cancelled')
    }
    const { data } = await getImportJob(jobId)
    options.onUpdate?.(data)
    if (isImportJobTerminal(data.status)) {
      return data
    }
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, intervalMs)
      options.signal?.addEventListener(
        'abort',
        () => {
          clearTimeout(timer)
          reject(new Error('Import polling cancelled'))
        },
        { once: true },
      )
    })
  }
}

export async function uploadAndImportFiles(
  kbId: string,
  files: File[],
  importOptions: { chunking: ImportChunkingPayload },
  hooks: {
    onUploadProgress?: (completed: number, total: number) => void
    onImportUpdate?: (job: ImportJob) => void
    signal?: AbortSignal
  } = {},
): Promise<ImportJob> {
  const presignBody = files.map((file) => ({
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
  }))

  const { data: presignData } = await presignUploads(kbId, presignBody)
  const uploads = presignData.uploads ?? []
  if (uploads.length !== files.length) {
    throw new Error('Presign response count mismatch')
  }

  const fileIds: string[] = []
  for (let i = 0; i < uploads.length; i += 1) {
    const upload = uploads[i]
    const file = files[i]
    const etag = await putFileToUploadUrl(
      upload.uploadUrl,
      file,
      upload.headers ?? {},
      upload.storageKey,
    )
    await completeUpload(upload.uploadId, {
      fileId: upload.fileId,
      storageKey: upload.storageKey,
      etag,
    })
    fileIds.push(upload.fileId)
    hooks.onUploadProgress?.(i + 1, files.length)
  }

  const { data: job } = await createImportJob(kbId, {
    fileIds,
    chunking: importOptions.chunking,
  })

  return pollImportJob(job.id, {
    onUpdate: hooks.onImportUpdate,
    signal: hooks.signal,
  })
}
