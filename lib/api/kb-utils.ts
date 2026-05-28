import type { KnowledgeBase } from './types'

/** API `scope` -> UI `resourceType` */
export function normalizeKnowledgeBase<T extends KnowledgeBase>(kb: T): T {
  if (kb.resourceType) return kb
  if (kb.scope) {
    return { ...kb, resourceType: kb.scope }
  }
  return kb
}

/** `available` is treated as `ready` per integration guide */
export function normalizeFileStatus(status: string): string {
  if (status === 'available') return 'ready'
  return status
}

export type FileStatusTone = 'success' | 'warning' | 'error' | 'neutral'

export function getFileStatusTone(status: string): FileStatusTone {
  const normalized = normalizeFileStatus(status)
  switch (normalized) {
    case 'ready':
      return 'success'
    case 'failed':
      return 'error'
    case 'uploaded':
    case 'parsing':
    case 'chunking':
    case 'indexing':
      return 'warning'
    default:
      return 'neutral'
  }
}

export function buildImportJobPayload(options: {
  fileIds: string[]
  chunkStrategy: string
  metaFilename: boolean
  metaHeadings: boolean
  chunkSize?: number
  chunkOverlap?: number
}) {
  const payload: Record<string, unknown> = {
    fileIds: options.fileIds,
    chunkStrategy: options.chunkStrategy,
    metadata: {
      includeFileName: options.metaFilename,
      includeHeadings: options.metaHeadings,
    },
  }
  if (options.chunkStrategy === 'custom') {
    payload.chunkSize = options.chunkSize ?? 800
    payload.chunkOverlap = options.chunkOverlap ?? 120
  }
  return payload
}

export function buildImportRetryOptions(options: {
  chunkStrategy: string
  metaFilename: boolean
  metaHeadings: boolean
  chunkSize?: number
  chunkOverlap?: number
}) {
  const payload: Record<string, unknown> = {
    chunkStrategy: options.chunkStrategy,
    metadata: {
      includeFileName: options.metaFilename,
      includeHeadings: options.metaHeadings,
    },
  }
  if (options.chunkStrategy === 'custom') {
    payload.chunkSize = options.chunkSize ?? 800
    payload.chunkOverlap = options.chunkOverlap ?? 120
  }
  return { options: payload }
}
