import { apiPaginatedRequest, apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import type { KnowledgeBaseFile, ListQuery, PaginatedResult } from '../types'

export interface BatchDeleteFilesResult {
  succeeded: string[]
  failed: Array<{ fileId: string; code: string; message: string }>
  summary: { total: number; succeededCount: number; failedCount: number }
}

export interface HitTestInput {
  query: string
  topK?: number
  filters?: { fileIds?: string[] }
}

export interface HitTestResult {
  results: Array<{
    fileId: string
    fileName: string
    chunkId: string
    score: number
    snippet: string
    page?: number
    rank: number
  }>
  latencyMs: number
  query: string
  topK: number
}

export interface IndexStats {
  status: string
  fileCount: number
  readyFileCount: number
  chunkCount: number
  indexedChunkCount: number
  failedFileCount: number
  indexingFileCount: number
  lastIndexedAt?: string
  updatedAt: string
}

export const filesService = {
  async list(kbId: string, query?: ListQuery): Promise<PaginatedResult<KnowledgeBaseFile>> {
    return apiPaginatedRequest<KnowledgeBaseFile>(`${API_PREFIX}/knowledge-bases/${kbId}/files`, {
      query,
    })
  },

  async get(kbId: string, fileId: string): Promise<KnowledgeBaseFile> {
    const result = await apiRequest<KnowledgeBaseFile>(
      `${API_PREFIX}/knowledge-bases/${kbId}/files/${fileId}`,
    )
    return result.data
  },

  async remove(kbId: string, fileId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(
      `${API_PREFIX}/knowledge-bases/${kbId}/files/${fileId}`,
      { method: 'DELETE' },
    )
  },

  async batchDelete(kbId: string, fileIds: string[]): Promise<BatchDeleteFilesResult> {
    const result = await apiRequest<BatchDeleteFilesResult>(
      `${API_PREFIX}/knowledge-bases/${kbId}/files:batch-delete`,
      { method: 'POST', body: { fileIds } },
    )
    return result.data
  },

  async hitTest(kbId: string, input: HitTestInput): Promise<HitTestResult> {
    const result = await apiRequest<HitTestResult>(`${API_PREFIX}/knowledge-bases/${kbId}/hit-test`, {
      method: 'POST',
      body: input,
    })
    return result.data
  },

  async indexStats(kbId: string): Promise<IndexStats> {
    const result = await apiRequest<IndexStats>(`${API_PREFIX}/knowledge-bases/${kbId}/index-stats`)
    return result.data
  },
}
