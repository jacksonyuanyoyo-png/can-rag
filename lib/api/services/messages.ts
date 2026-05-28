import { API_PREFIX, isSseEnabled } from '../config'
import { streamConversationMessage, type MessageStreamHandlers } from '../sse'
import { apiPaginatedRequest, apiRequest } from '../api-client'
import type { Message, PaginatedResult } from '../types'

export interface ListMessagesQuery {
  page?: number
  pageSize?: number
  before?: string
  after?: string
  [key: string]: string | number | boolean | undefined
}

export interface SendMessageInput {
  content: string
  modelId: string
  knowledgeBaseIds?: string[]
}

export interface SendMessageResult {
  userMessage: Message
  assistantMessage: Message
}

export interface MessageFeedbackInput {
  rating: 'positive' | 'negative'
  comment?: string
}

export const messagesService = {
  async list(conversationId: string, query?: ListMessagesQuery): Promise<PaginatedResult<Message>> {
    return apiPaginatedRequest<Message>(`${API_PREFIX}/conversations/${conversationId}/messages`, {
      query,
    })
  },

  async send(conversationId: string, input: SendMessageInput): Promise<SendMessageResult> {
    const result = await apiRequest<SendMessageResult>(
      `${API_PREFIX}/conversations/${conversationId}/messages`,
      { method: 'POST', body: input },
    )
    return result.data
  },

  async cancel(conversationId: string, messageId: string): Promise<Message> {
    const result = await apiRequest<Message>(
      `${API_PREFIX}/conversations/${conversationId}/messages/${messageId}:cancel`,
      { method: 'POST', body: {} },
    )
    return result.data
  },

  async feedback(messageId: string, input: MessageFeedbackInput): Promise<unknown> {
    const result = await apiRequest<unknown>(`${API_PREFIX}/messages/${messageId}/feedback`, {
      method: 'POST',
      body: input,
    })
    return result.data
  },

  isStreamEnabled(): boolean {
    return isSseEnabled()
  },

  async stream(
    conversationId: string,
    input: SendMessageInput,
    handlers: MessageStreamHandlers,
    signal?: AbortSignal,
  ): Promise<void> {
    return streamConversationMessage(conversationId, input, handlers, signal)
  },
}
