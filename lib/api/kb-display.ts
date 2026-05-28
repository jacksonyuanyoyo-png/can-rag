import { normalizeFileStatus } from '@/lib/api/kb-utils'

type TranslateFn = (key: string, vars?: Record<string, string | number>) => string

export function getFileStatusLabel(status: string, t: TranslateFn): string {
  const normalized = normalizeFileStatus(status)
  switch (normalized) {
    case 'ready':
      return t('kbFileStatusReady')
    case 'uploaded':
      return t('kbFileStatusUploaded')
    case 'parsing':
      return t('kbFileStatusParsing')
    case 'chunking':
      return t('kbFileStatusChunking')
    case 'indexing':
      return t('kbFileStatusIndexing')
    case 'failed':
      return t('kbFileStatusFailed')
    default:
      return t('kbFileStatusUnknown')
  }
}

export function getFileStatusDotClass(status: string): string {
  const normalized = normalizeFileStatus(status)
  switch (normalized) {
    case 'ready':
      return 'bg-emerald-500'
    case 'failed':
      return 'bg-red-500'
    case 'uploaded':
    case 'parsing':
    case 'chunking':
    case 'indexing':
      return 'bg-amber-500'
    default:
      return 'bg-slate-400'
  }
}

export function getIndexStatusLabel(status: string, t: TranslateFn): string {
  switch (status) {
    case 'ready':
      return t('kbIndexReady')
    case 'indexing':
      return t('kbIndexIndexing')
    case 'error':
      return t('kbIndexError')
    case 'empty':
      return t('kbIndexEmpty')
    default:
      return status
  }
}
