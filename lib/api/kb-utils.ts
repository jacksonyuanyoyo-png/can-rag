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

export type ImportChunkingPayload = Record<string, unknown>

export type ImportParsingPayload = {
  textExtraction: boolean
  pdfEnhancement: boolean
}

export type ImportJobOptions = {
  chunking: ImportChunkingPayload
  parsing?: ImportParsingPayload
}

export function buildImportJobPayload(options: {
  fileIds: string[]
  chunking: ImportChunkingPayload
  parsing?: ImportParsingPayload
}) {
  return {
    fileIds: options.fileIds,
    chunking: options.chunking,
    parsing: options.parsing ?? {
      textExtraction: true,
      pdfEnhancement: false,
    },
  }
}

export function buildImportRetryOptions(options: ImportJobOptions) {
  return {
    chunking: options.chunking,
    parsing: options.parsing ?? {
      textExtraction: true,
      pdfEnhancement: false,
    },
  }
}
