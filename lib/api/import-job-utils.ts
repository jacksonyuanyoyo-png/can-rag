import type { ImportJob } from './types'

/** 后端 stage → 估算进度（API progress 长期为 0 时的回退） */
const STAGE_FALLBACK_PROGRESS: Record<string, number> = {
  upload: 15,
  parse: 30,
  chunk: 50,
  embed: 70,
  index: 90,
  done: 100,
}

const IMPORT_STAGE_I18N_KEYS: Record<string, string> = {
  upload: 'kbImportStageUpload',
  parse: 'kbImportStageParse',
  chunk: 'kbImportStageChunk',
  embed: 'kbImportStageEmbed',
  index: 'kbImportStageIndex',
  done: 'kbImportStageDone',
}

export function normalizeImportJob(raw: Record<string, unknown>): ImportJob {
  const r = raw as Record<string, unknown>
  return {
    id: String(r.id ?? ''),
    knowledgeBaseId: String(r.knowledgeBaseId ?? r.knowledge_base_id ?? ''),
    fileIds: (r.fileIds ?? r.file_ids ?? []) as string[],
    status: String(r.status ?? ''),
    progress: Number(r.progress ?? 0),
    stage: String(r.stage ?? ''),
    errorCode: (r.errorCode ?? r.error_code ?? null) as string | null,
    errorMessage: (r.errorMessage ?? r.error_message ?? null) as string | null,
    retryOf: (r.retryOf ?? r.retry_of) as string | undefined,
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    updatedAt: String(r.updatedAt ?? r.updated_at ?? ''),
  }
}

function normalizeProgressValue(raw: number | undefined | null): number {
  if (raw == null || Number.isNaN(raw)) return 0
  if (raw > 0 && raw <= 1) return Math.round(raw * 100)
  return Math.round(Math.min(100, Math.max(0, raw)))
}

/** 展示用进度：优先 API progress，否则按 stage / status 估算 */
export function resolveImportProgress(job: Pick<ImportJob, 'progress' | 'stage' | 'status'>): number {
  const apiProgress = normalizeProgressValue(job.progress)
  if (apiProgress > 0) return apiProgress
  if (job.status === 'completed') return 100

  const stage = job.stage?.trim().toLowerCase()
  if (stage && STAGE_FALLBACK_PROGRESS[stage] != null) {
    return STAGE_FALLBACK_PROGRESS[stage]
  }
  if (job.status === 'running') return 20
  if (job.status === 'queued') return 5
  return 0
}

export function isImportProgressFromStage(
  job: Pick<ImportJob, 'progress' | 'stage' | 'status'>,
): boolean {
  return normalizeProgressValue(job.progress) <= 0 && job.status !== 'completed'
}

export function getImportStageLabel(
  stage: string | undefined | null,
  t: (key: string) => string,
): string {
  const normalized = stage?.trim().toLowerCase()
  if (!normalized) return '—'
  const key = IMPORT_STAGE_I18N_KEYS[normalized]
  return key ? t(key) : stage ?? '—'
}
