import { apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import type { Model } from '../types'

export interface ListModelsQuery {
  status?: string
  visibility?: string
  [key: string]: string | undefined
}

export const modelsService = {
  async list(query?: ListModelsQuery): Promise<Model[]> {
    const result = await apiRequest<Model[]>(`${API_PREFIX}/models`, { query })
    return result.data
  },
}
