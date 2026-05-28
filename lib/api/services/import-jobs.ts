import { apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import { buildImportJobPayload, buildImportRetryOptions } from '../kb-utils'
import type { ImportJob } from '../types'

export interface ImportJobMetadata {
  includeFileName?: boolean
  includeHeadings?: boolean
}

export interface CreateImportJobInput {
  fileIds: string[]
  chunkStrategy?: string
  chunkSize?: number
  chunkOverlap?: number
  metadata?: ImportJobMetadata
}

export interface RetryImportJobInput {
  options?: {
    chunkStrategy?: string
    chunkSize?: number
    chunkOverlap?: number
    metadata?: ImportJobMetadata
  }
}

export const importJobsService = {
  async create(kbId: string, input: CreateImportJobInput): Promise<ImportJob> {
    const body = buildImportJobPayload({
      fileIds: input.fileIds,
      chunkStrategy: input.chunkStrategy ?? 'default',
      metaFilename: input.metadata?.includeFileName ?? true,
      metaHeadings: input.metadata?.includeHeadings ?? false,
      chunkSize: input.chunkSize,
      chunkOverlap: input.chunkOverlap,
    })
    const result = await apiRequest<ImportJob>(`${API_PREFIX}/knowledge-bases/${kbId}/import-jobs`, {
      method: 'POST',
      body,
    })
    return result.data
  },

  async get(jobId: string): Promise<ImportJob> {
    const result = await apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}`)
    return result.data
  },

  async cancel(jobId: string): Promise<ImportJob> {
    const result = await apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}:cancel`, {
      method: 'POST',
      body: {},
    })
    return result.data
  },

  async retry(jobId: string, input?: RetryImportJobInput): Promise<ImportJob> {
    const body = input?.options
      ? buildImportRetryOptions({
          chunkStrategy: input.options.chunkStrategy ?? 'default',
          metaFilename: input.options.metadata?.includeFileName ?? true,
          metaHeadings: input.options.metadata?.includeHeadings ?? false,
          chunkSize: input.options.chunkSize,
          chunkOverlap: input.options.chunkOverlap,
        })
      : {}
    const result = await apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}:retry`, {
      method: 'POST',
      body,
    })
    return result.data
  },
}
