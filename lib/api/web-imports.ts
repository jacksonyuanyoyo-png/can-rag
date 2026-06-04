import { apiRequest } from './api-client'
import { API_PREFIX } from './config'
import type { ImportJobOptions } from './kb-utils'
import type { ImportJob } from './types'
import { createImportJob, pollImportJob } from './uploads'

export interface WebImportResponseData {
  fileId: string
  fileName: string
  storageKey: string
  sourceUrl: string
  extractionMethod: string
  importJobId?: string
}

export type CreateWebImportOptions = {
  url: string
  autoImport?: boolean
  useBrowserFallback?: boolean
} & ImportJobOptions

export function isValidWebImportUrl(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed) return false
  try {
    const u = new URL(trimmed)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export async function createWebImport(kbId: string, options: CreateWebImportOptions) {
  const body: Record<string, unknown> = {
    url: options.url.trim(),
    autoImport: options.autoImport ?? true,
    chunking: options.chunking,
    parsing: options.parsing ?? {
      textExtraction: true,
      pdfEnhancement: false,
    },
  }
  if (options.useBrowserFallback != null) {
    body.useBrowserFallback = options.useBrowserFallback
  }

  return apiRequest<WebImportResponseData>(
    `${API_PREFIX}/knowledge-bases/${kbId}/web-imports`,
    {
      method: 'POST',
      body,
      idempotencyKey: `web-import-${kbId}-${Date.now()}`,
    },
  )
}

/** 抓取 URL、落盘，并轮询 import-job 直至终态（与文件上传导入体验一致）。 */
export async function webImportUrl(
  kbId: string,
  url: string,
  importOptions: ImportJobOptions,
  hooks: {
    onImportUpdate?: (job: ImportJob) => void
    signal?: AbortSignal
    useBrowserFallback?: boolean
  } = {},
): Promise<ImportJob> {
  const { data } = await createWebImport(kbId, {
    url,
    autoImport: true,
    useBrowserFallback: hooks.useBrowserFallback,
    chunking: importOptions.chunking,
    parsing: importOptions.parsing,
  })

  const jobId = data.importJobId
  if (jobId) {
    return pollImportJob(jobId, {
      onUpdate: hooks.onImportUpdate,
      signal: hooks.signal,
    })
  }

  const { data: job } = await createImportJob(kbId, {
    fileIds: [data.fileId],
    chunking: importOptions.chunking,
    parsing: importOptions.parsing,
  })
  return pollImportJob(job.id, {
    onUpdate: hooks.onImportUpdate,
    signal: hooks.signal,
  })
}
