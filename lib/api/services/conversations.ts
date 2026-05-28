import { apiPaginatedRequest, apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import type { Conversation, ListQuery, PaginatedResult } from '../types'

export interface CreateConversationInput {
  title: string
  folder?: string | null
  pinned?: boolean
}

export interface UpdateConversationInput {
  title?: string
  folder?: string | null
  pinned?: boolean
}

export const conversationsService = {
  async list(query?: ListQuery): Promise<PaginatedResult<Conversation>> {
    return apiPaginatedRequest<Conversation>(`${API_PREFIX}/conversations`, { query })
  },

  async get(conversationId: string): Promise<Conversation> {
    const result = await apiRequest<Conversation>(`${API_PREFIX}/conversations/${conversationId}`)
    return result.data
  },

  async create(input: CreateConversationInput): Promise<Conversation> {
    const result = await apiRequest<Conversation>(`${API_PREFIX}/conversations`, {
      method: 'POST',
      body: input,
    })
    return result.data
  },

  async update(conversationId: string, input: UpdateConversationInput): Promise<Conversation> {
    const result = await apiRequest<Conversation>(`${API_PREFIX}/conversations/${conversationId}`, {
      method: 'PATCH',
      body: input,
    })
    return result.data
  },

  async remove(conversationId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`${API_PREFIX}/conversations/${conversationId}`, {
      method: 'DELETE',
    })
  },
}
