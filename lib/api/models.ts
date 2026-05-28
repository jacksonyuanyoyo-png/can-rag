import { apiRequest } from './api-client'
import { API_PREFIX } from './config'
import type { Model } from './types'

export async function listModels(query: { status?: string; visibility?: string } = {}) {
  return apiRequest<Model[]>(`${API_PREFIX}/models`, {
    query: { status: query.status ?? 'active', ...query },
  })
}

const EMBEDDING_HINT = /embed/i

export function pickEmbeddingModels(models: Model[]): Model[] {
  const embedding = models.filter(
    (m) => m.status === 'active' && EMBEDDING_HINT.test(`${m.id} ${m.name}`),
  )
  if (embedding.length > 0) return embedding
  return models.filter((m) => m.status === 'active')
}

export function toModelOptions(models: Model[]) {
  return models.map((m) => ({ id: m.id, label: m.name || m.id }))
}
