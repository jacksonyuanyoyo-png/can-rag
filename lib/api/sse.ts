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

export interface MessageCreatedEvent {
  conversationId?: string
  userMessage?: Message
  assistantMessage?: Message
  userMessageId?: string
  assistantMessageId?: string
  content?: string
}

export interface MessageStreamHandlers {
  onMessageCreated?: (data: MessageCreatedEvent) => void
  onRetrievalStarted?: (data: { messageId: string; knowledgeBaseIds?: string[] }) => void
  onRetrievalCompleted?: (data: {
    messageId: string
    citations?: MessageCitation[]
    latencyMs?: number
  }) => void
  onMessageDelta?: (data: { messageId: string; delta: string }) => void
  onUsageCompleted?: (data: { messageId: string; usage: MessageUsage }) => void
  onMessageCompleted?: (data: {
    messageId: string
    content?: string
    status?: string
    citations?: MessageCitation[]
  }) => void
  onMessageFailed?: (data: {
    messageId: string
    error?: { code?: string; message?: string }
  }) => void
  onDone?: (data: { conversationId?: string; requestId?: string }) => void
}

function readId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/** Backend may send full messages or only IDs on `message.created`. */
export function resolveMessageCreatedPair(
  data: MessageCreatedEvent,
  fallbackUserContent = '',
): { userMessage: Message; assistantMessage: Message } | null {
  const raw = data as MessageCreatedEvent & Record<string, unknown>
  const userMessage = data.userMessage ?? (raw.user_message as Message | undefined)
  const assistantMessage = data.assistantMessage ?? (raw.assistant_message as Message | undefined)

  if (userMessage && assistantMessage) {
    return { userMessage, assistantMessage }
  }

  const userId =
    readId(data.userMessageId) ??
    readId(raw.user_message_id) ??
    readId(userMessage?.id)
  const assistantId =
    readId(data.assistantMessageId) ??
    readId(raw.assistant_message_id) ??
    readId(assistantMessage?.id)
  if (!userId || !assistantId) return null

  const now = new Date().toISOString()
  const userContent = userMessage?.content ?? data.content ?? fallbackUserContent

  return {
    userMessage: {
      id: userId,
      role: 'user',
      content: userContent,
      createdAt: userMessage?.createdAt ?? now,
      editedAt: userMessage?.editedAt ?? null,
    },
    assistantMessage: {
      id: assistantId,
      role: 'assistant',
      content: assistantMessage?.content ?? '',
      createdAt: assistantMessage?.createdAt ?? now,
      editedAt: assistantMessage?.editedAt ?? null,
      status: assistantMessage?.status ?? 'running',
    },
  }
}

function buildStreamUrl(conversationId: string): string {
  if (typeof window !== 'undefined') {
    return `/api/v1/conversations/${encodeURIComponent(conversationId)}/messages-stream`
  }
  return buildApiUrl(`${API_PREFIX}/conversations/${conversationId}/messages:stream`)
}

/** Parse complete SSE blocks separated by blank lines (handles \\r\\n). */
function drainSseEvents(buffer: string): { events: Array<{ eventType: string; data: string }>; rest: string } {
  const events: Array<{ eventType: string; data: string }> = []
  const blocks = buffer.split(/\r?\n\r?\n/)
  const rest = blocks.pop() ?? ''

  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    let eventType = ''
    const dataLines: string[] = []

    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) continue
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim()
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart())
      }
    }

    if (dataLines.length > 0) {
      events.push({ eventType, data: dataLines.join('\n') })
    }
  }

  return { events, rest }
}

function dispatchStreamEvent(
  eventType: string,
  data: Record<string, unknown>,
  handlers: MessageStreamHandlers,
): void {
  switch (eventType) {
    case 'message.created':
      handlers.onMessageCreated?.(data as MessageCreatedEvent)
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
  const url = buildStreamUrl(conversationId)
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
    cache: 'no-store',
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

  const processEvents = (parsed: Array<{ eventType: string; data: string }>) => {
    for (const { eventType, data: raw } of parsed) {
      if (!raw) continue
      try {
        const data = JSON.parse(raw) as Record<string, unknown>
        dispatchStreamEvent(eventType, data, handlers)
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[sse] event handler failed', eventType, error)
        }
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const { events, rest } = drainSseEvents(buffer)
    buffer = rest
    processEvents(events)
  }

  if (buffer.trim()) {
    const { events } = drainSseEvents(`${buffer}\n\n`)
    processEvents(events)
  }
}
