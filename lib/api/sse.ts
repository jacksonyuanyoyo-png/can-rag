import { API_PREFIX, buildApiUrl } from './config'
import { ApiError } from './api-error'
import { tokenStore } from './token-store'
import type { Message, MessageCitation, MessageUsage } from './types'

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `req_${crypto.randomUUID()}`
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export interface MessageStreamHandlers {
  onMessageCreated?: (data: {
    conversationId?: string
    userMessage: Message
    assistantMessage: Message
  }) => void
  onRetrievalStarted?: (data: { messageId: string; knowledgeBaseIds?: string[] }) => void
  onRetrievalCompleted?: (data: {
    messageId: string
    citations?: MessageCitation[]
    latencyMs?: number
  }) => void
  onMessageDelta?: (data: { messageId: string; delta: string }) => void
  onUsageCompleted?: (data: { messageId: string; usage: MessageUsage }) => void
  onMessageCompleted?: (data: { messageId: string; content?: string; status?: string }) => void
  onMessageFailed?: (data: {
    messageId: string
    error?: { code?: string; message?: string }
  }) => void
  onDone?: (data: { conversationId?: string; requestId?: string }) => void
}

function dispatchStreamEvent(
  eventType: string,
  data: Record<string, unknown>,
  handlers: MessageStreamHandlers,
): void {
  switch (eventType) {
    case 'message.created':
      handlers.onMessageCreated?.(data as Parameters<NonNullable<MessageStreamHandlers['onMessageCreated']>>[0])
      break
    case 'retrieval.started':
      handlers.onRetrievalStarted?.(data as Parameters<NonNullable<MessageStreamHandlers['onRetrievalStarted']>>[0])
      break
    case 'retrieval.completed':
      handlers.onRetrievalCompleted?.(data as Parameters<NonNullable<MessageStreamHandlers['onRetrievalCompleted']>>[0])
      break
    case 'message.delta':
      handlers.onMessageDelta?.(data as Parameters<NonNullable<MessageStreamHandlers['onMessageDelta']>>[0])
      break
    case 'usage.completed':
      handlers.onUsageCompleted?.(data as Parameters<NonNullable<MessageStreamHandlers['onUsageCompleted']>>[0])
      break
    case 'message.completed':
      handlers.onMessageCompleted?.(data as Parameters<NonNullable<MessageStreamHandlers['onMessageCompleted']>>[0])
      break
    case 'message.failed':
      handlers.onMessageFailed?.(data as Parameters<NonNullable<MessageStreamHandlers['onMessageFailed']>>[0])
      break
    case 'done':
      handlers.onDone?.(data as Parameters<NonNullable<MessageStreamHandlers['onDone']>>[0])
      break
    default:
      break
  }
}

export async function streamConversationMessage(
  conversationId: string,
  body: { content: string; modelId: string; knowledgeBaseIds?: string[] },
  handlers: MessageStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  const url = buildApiUrl(`${API_PREFIX}/conversations/${conversationId}/messages:stream`)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    'X-Request-Id': createRequestId(),
  }

  const token = tokenStore.get()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    try {
      const json = (await response.json()) as { error?: { code: string; message: string }; requestId?: string }
      if (json.error) {
        throw ApiError.fromResponse(json.error, json.requestId, response.status)
      }
    } catch (error) {
      if (ApiError.isApiError(error)) throw error
    }
    throw new ApiError(
      { code: 'INTERNAL_ERROR', message: response.statusText || 'Stream request failed' },
      { status: response.status },
    )
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new ApiError({ code: 'INTERNAL_ERROR', message: 'Empty stream body' })
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let eventType = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n')
    buffer = parts.pop() ?? ''

    for (const line of parts) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        const raw = line.slice(5).trim()
        if (!raw) continue
        try {
          const data = JSON.parse(raw) as Record<string, unknown>
          dispatchStreamEvent(eventType, data, handlers)
        } catch {
          // ignore malformed SSE payloads
        }
      } else if (line === '') {
        eventType = ''
      }
    }
  }
}
