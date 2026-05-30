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
  chunking?: Record<string, unknown>
}

export interface RetryImportJobInput {
  chunking?: Record<string, unknown>
  options?: {
    chunkStrategy?: string
    chunkSize?: number
    chunkOverlap?: number
    metadata?: ImportJobMetadata
  }
}

function legacyChunking(input: CreateImportJobInput): Record<string, unknown> {
  const strategy = input.chunkStrategy ?? 'default'
  const metadata = {
    includeFileName: input.metadata?.includeFileName ?? true,
    includeHeadings: input.metadata?.includeHeadings ?? false,
  }
  if (strategy === 'custom' && input.chunkSize != null) {
    return {
      strategy: 'custom',
      custom: { mode: 'length' },
      length: {
        chunkSize: input.chunkSize,
        overlap: input.chunkOverlap ?? 0,
        maxChunkSize: input.chunkSize,
      },
      metadata,
    }
  }
  return { strategy, metadata }
}

export const importJobsService = {
  async create(kbId: string, input: CreateImportJobInput): Promise<ImportJob> {
    const body = buildImportJobPayload({
      fileIds: input.fileIds,
      chunking: input.chunking ?? legacyChunking(input),
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
    const body = input?.chunking
      ? buildImportRetryOptions({ chunking: input.chunking })
      : input?.options
        ? buildImportRetryOptions({
            chunking: legacyChunking({
              fileIds: [],
              chunkStrategy: input.options.chunkStrategy,
              chunkSize: input.options.chunkSize,
              chunkOverlap: input.options.chunkOverlap,
              metadata: input.options.metadata,
            }),
          })
        : {}
    const result = await apiRequest<ImportJob>(`${API_PREFIX}/import-jobs/${jobId}:retry`, {
      method: 'POST',
      body,
    })
    return result.data
  },
}
