import { apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import type { Template } from '../types'

export interface ListTemplatesQuery {
  scope?: string
  q?: string
  [key: string]: string | undefined
}

export interface CreateTemplateInput {
  name: string
  content: string
  snippet?: string
}

export interface UpdateTemplateInput {
  name?: string
  content?: string
  snippet?: string
}

export const templatesService = {
  async list(query?: ListTemplatesQuery): Promise<Template[]> {
    const result = await apiRequest<Template[]>(`${API_PREFIX}/templates`, { query })
    return result.data
  },

  async create(input: CreateTemplateInput): Promise<Template> {
    const result = await apiRequest<Template>(`${API_PREFIX}/templates`, {
      method: 'POST',
      body: input,
    })
    return result.data
  },

  async update(templateId: string, input: UpdateTemplateInput): Promise<Template> {
    const result = await apiRequest<Template>(`${API_PREFIX}/templates/${templateId}`, {
      method: 'PATCH',
      body: input,
    })
    return result.data
  },

  async remove(templateId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`${API_PREFIX}/templates/${templateId}`, {
      method: 'DELETE',
    })
  },
}
