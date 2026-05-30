import { apiPaginatedRequest, apiRequest, apiVoidRequest } from './api-client'
import { API_PREFIX } from './config'
import { normalizeKnowledgeBase } from './kb-utils'
import type {
  FileChunk,
  FileChunkDetailResult,
  IndexStats,
  KnowledgeBase,
  KnowledgeBaseFile,
  ListQuery,
} from './types'

export async function listKnowledgeBases(query: ListQuery = {}) {
  const result = await apiPaginatedRequest<KnowledgeBase>(
    `${API_PREFIX}/knowledge-bases`,
    { query },
  )
  return {
    ...result,
    data: result.data.map(normalizeKnowledgeBase),
  }
}

export async function createKnowledgeBase(body: {
  name: string
  description?: string
  embeddingModelId: string
  scope?: string
  visibility?: string
}) {
  const result = await apiRequest<KnowledgeBase>(`${API_PREFIX}/knowledge-bases`, {
    method: 'POST',
    body: {
      scope: 'personal',
      visibility: 'private',
      ...body,
    },
    idempotencyKey: `kb-create-${body.name.trim()}-${Date.now()}`,
  })
  return { ...result, data: normalizeKnowledgeBase(result.data) }
}

export async function getKnowledgeBase(kbId: string) {
  const result = await apiRequest<KnowledgeBase>(`${API_PREFIX}/knowledge-bases/${kbId}`)
  return { ...result, data: normalizeKnowledgeBase(result.data) }
}

export async function deleteKnowledgeBase(kbId: string) {
  return apiVoidRequest(`${API_PREFIX}/knowledge-bases/${kbId}`, { method: 'DELETE' })
}

export async function listKnowledgeBaseFiles(kbId: string, query: ListQuery = {}) {
  return apiPaginatedRequest<KnowledgeBaseFile>(
    `${API_PREFIX}/knowledge-bases/${kbId}/files`,
    { query },
  )
}

export async function getKnowledgeBaseIndexStats(kbId: string) {
  return apiRequest<IndexStats>(`${API_PREFIX}/knowledge-bases/${kbId}/index-stats`)
}

export async function getKnowledgeBaseFile(kbId: string, fileId: string) {
  return apiRequest<KnowledgeBaseFile>(`${API_PREFIX}/knowledge-bases/${kbId}/files/${fileId}`)
}

export async function listKnowledgeBaseFileChunks(
  kbId: string,
  fileId: string,
  query: ListQuery = {},
) {
  return apiPaginatedRequest<FileChunk>(
    `${API_PREFIX}/knowledge-bases/${kbId}/files/${fileId}/chunks`,
    { query },
  )
}

export async function getKnowledgeBaseFileChunkDetail(
  kbId: string,
  fileId: string,
  dataId: string,
  context = 2,
) {
  return apiRequest<FileChunkDetailResult>(
    `${API_PREFIX}/knowledge-bases/${kbId}/files/${fileId}/chunks/${dataId}`,
    { query: { context } },
  )
}
