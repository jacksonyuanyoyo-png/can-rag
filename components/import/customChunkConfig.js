export const DEFAULT_CUSTOM_CHUNK_MODE = "length"

export const DEFAULT_CUSTOM_CHUNK_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 0,
  indexSize: 512,
  delimiter: null,
  modelParagraph: "disabled",
  maxParagraphDepth: 5,
  maxChunkSize: 1000,
}

const DEFAULT_INDEX_SIZE = 512

function normalizeIndexSize(value) {
  const size = Number(value)
  if (size === 256 || size === 512 || size === 1024) return size
  return DEFAULT_INDEX_SIZE
}

function apiCustomMode(uiMode) {
  if (uiMode === "delimiter") return "separator"
  return uiMode
}

function buildMetadata(metaFilename, metaHeadings) {
  return {
    includeFileName: metaFilename,
    includeHeadings: metaHeadings,
  }
}

/** Maps UI import settings to POST /v1/knowledge-bases/{kbId}/import-jobs `chunking` body. */
export function buildChunkingPayload({
  chunkStrategy,
  customChunkMode,
  customChunkConfig,
  metaFilename,
  metaHeadings,
}) {
  const metadata = buildMetadata(metaFilename, metaHeadings)
  const indexSize = normalizeIndexSize(customChunkConfig?.indexSize)

  if (chunkStrategy === "default") {
    return {
      chunking: {
        strategy: "default",
        indexSize,
        metadata,
      },
    }
  }

  if (chunkStrategy === "page") {
    return {
      chunking: {
        strategy: "page",
        indexSize,
        metadata,
      },
    }
  }

  if (chunkStrategy === "custom") {
    const chunking = {
      strategy: "custom",
      custom: { mode: apiCustomMode(customChunkMode) },
      indexSize,
      metadata,
    }

    if (customChunkMode === "length") {
      const chunkSize = customChunkConfig.chunkSize ?? DEFAULT_CUSTOM_CHUNK_CONFIG.chunkSize
      const overlap = customChunkConfig.chunkOverlap ?? DEFAULT_CUSTOM_CHUNK_CONFIG.chunkOverlap
      const maxChunkSize = Math.max(
        chunkSize,
        customChunkConfig.maxChunkSize ?? chunkSize,
      )
      chunking.length = { chunkSize, overlap, maxChunkSize }
    }

    if (customChunkMode === "paragraph") {
      chunking.paragraph = {
        useModel: customChunkConfig.modelParagraph === "enabled",
        maxDepth: customChunkConfig.maxParagraphDepth ?? DEFAULT_CUSTOM_CHUNK_CONFIG.maxParagraphDepth,
      }
    }

    if (customChunkMode === "delimiter") {
      const delimiter = customChunkConfig.delimiter
      chunking.separator = {
        separators: delimiter ? [delimiter] : ["\n\n"],
      }
    }

    return { chunking }
  }

  return {
    chunking: {
      strategy: chunkStrategy,
      metadata,
    },
  }
}

/** Maps UI import settings to POST /v1/knowledge-bases/{kbId}/import-jobs body. */
export function buildImportPayload({
  chunkStrategy,
  customChunkMode,
  customChunkConfig,
  metaFilename,
  metaHeadings,
  pdfEnhancement = false,
}) {
  const { chunking } = buildChunkingPayload({
    chunkStrategy,
    customChunkMode,
    customChunkConfig,
    metaFilename,
    metaHeadings,
  })

  return {
    chunking,
    parsing: {
      textExtraction: true,
      pdfEnhancement: pdfEnhancement === true,
    },
  }
}

/** @deprecated Use buildChunkingPayload; kept for callers that only need length/overlap. */
export function resolveCustomChunkForApi(mode, config) {
  if (mode === "length") {
    return {
      chunkSize: config.chunkSize ?? DEFAULT_CUSTOM_CHUNK_CONFIG.chunkSize,
      chunkOverlap: config.chunkOverlap ?? DEFAULT_CUSTOM_CHUNK_CONFIG.chunkOverlap,
    }
  }
  if (mode === "paragraph") {
    return {
      chunkSize: config.maxChunkSize ?? DEFAULT_CUSTOM_CHUNK_CONFIG.maxChunkSize,
      chunkOverlap: 0,
    }
  }
  return {
    chunkSize: config.chunkSize ?? DEFAULT_CUSTOM_CHUNK_CONFIG.chunkSize,
    chunkOverlap: config.chunkOverlap ?? DEFAULT_CUSTOM_CHUNK_CONFIG.chunkOverlap,
  }
}
