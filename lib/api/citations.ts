import type { MessageCitation } from './types'

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

/** Normalize snake_case / alternate keys from SSE and REST into `MessageCitation`. */
export function normalizeCitations(raw: unknown): MessageCitation[] {
  if (!Array.isArray(raw)) return []

  return raw.map((item, i) => {
    const c = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
    const index =
      readNumber(c.index) ??
      readNumber(c.citationIndex) ??
      readNumber(c.citation_index) ??
      i + 1

    const chunkId = readString(c.chunkId) ?? readString(c.chunk_id)
    const dataId = readString(c.dataId) ?? readString(c.data_id) ?? chunkId

    return {
      index,
      knowledgeBaseId:
        readString(c.knowledgeBaseId) ??
        readString(c.knowledge_base_id) ??
        readString(c.kbId) ??
        readString(c.kb_id),
      fileId: readString(c.fileId) ?? readString(c.file_id),
      fileName:
        readString(c.fileName) ??
        readString(c.file_name) ??
        readString(c.title) ??
        readString(c.name),
      chunkId,
      dataId,
      score: readNumber(c.score),
      snippet: readString(c.snippet),
      content:
        readString(c.content) ??
        readString(c.text) ??
        readString(c.chunkText) ??
        readString(c.chunk_text) ??
        readString(c.markdown),
      page: readNumber(c.page),
      sourceType: readString(c.sourceType) ?? readString(c.source_type),
    }
  })
}
