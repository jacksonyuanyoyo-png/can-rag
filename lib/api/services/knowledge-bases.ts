import { apiPaginatedRequest, apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import { normalizeKnowledgeBase } from '../kb-utils'
import type { KnowledgeBase, ListQuery, PaginatedResult } from '../types'

export interface CreateKnowledgeBaseInput {
  name: string
  description?: string
  embeddingModelId: string
  scope?: string
  visibility?: string
}

export interface UpdateKnowledgeBaseInput {
  name?: string
  description?: string | null
}

export const knowledgeBasesService = {
  async list(query?: ListQuery): Promise<PaginatedResult<KnowledgeBase>> {
    const result = await apiPaginatedRequest<KnowledgeBase>(`${API_PREFIX}/knowledge-bases`, {
      query,
    })
    return { ...result, data: result.data.map(normalizeKnowledgeBase) }
  },

  async get(kbId: string): Promise<KnowledgeBase> {
    const result = await apiRequest<KnowledgeBase>(`${API_PREFIX}/knowledge-bases/${kbId}`)
    return normalizeKnowledgeBase(result.data)
  },

  async create(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase> {
    const result = await apiRequest<KnowledgeBase>(`${API_PREFIX}/knowledge-bases`, {
      method: 'POST',
      body: {
        scope: 'personal',
        visibility: 'private',
        ...input,
      },
    })
    return normalizeKnowledgeBase(result.data)
  },

  async update(kbId: string, input: UpdateKnowledgeBaseInput): Promise<KnowledgeBase> {
    const result = await apiRequest<KnowledgeBase>(`${API_PREFIX}/knowledge-bases/${kbId}`, {
      method: 'PATCH',
      body: input,
    })
    return normalizeKnowledgeBase(result.data)
  },

  async remove(kbId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`${API_PREFIX}/knowledge-bases/${kbId}`, {
      method: 'DELETE',
    })
  },
}
