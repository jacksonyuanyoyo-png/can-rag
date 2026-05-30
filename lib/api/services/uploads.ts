import { apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import { resolveStorageUploadUrl } from '../upload-url'
import type { PresignUploadItem } from '../types'

export interface PresignFileInput {
  fileName: string
  mimeType: string
  sizeBytes: number
}

export interface PresignInput {
  knowledgeBaseId: string
  files: PresignFileInput[]
}

export interface PresignResult {
  uploads: PresignUploadItem[]
}

export interface CompleteUploadInput {
  fileId: string
  storageKey: string
  etag: string
}

export const uploadsService = {
  async presign(input: PresignInput): Promise<PresignResult> {
    const result = await apiRequest<PresignResult>(`${API_PREFIX}/uploads/presign`, {
      method: 'POST',
      body: input,
    })
    return result.data
  },

  async complete(uploadId: string, input: CompleteUploadInput): Promise<{ fileId: string; status: string }> {
    const result = await apiRequest<{ fileId: string; status: string }>(
      `${API_PREFIX}/uploads/${uploadId}:complete`,
      { method: 'POST', body: input },
    )
    return result.data
  },

  async uploadToStorage(
    uploadUrl: string,
    file: Blob,
    headers?: Record<string, string>,
    storageKey?: string,
  ): Promise<string> {
    const resolvedUrl = resolveStorageUploadUrl(uploadUrl)
    const putHeaders: Record<string, string> = { ...(headers ?? {}) }
    if (storageKey) {
      putHeaders['X-Storage-Key'] = storageKey
    }
    const response = await fetch(resolvedUrl, {
      method: 'PUT',
      body: file,
      headers: putHeaders,
    })
    if (!response.ok) {
      throw new Error(`Storage upload failed: ${response.status}`)
    }
    const etag = response.headers.get('ETag') ?? response.headers.get('etag')
    if (!etag) {
      throw new Error('Storage upload succeeded but ETag header is missing')
    }
    return etag.replace(/^"|"$/g, '')
  },
}
