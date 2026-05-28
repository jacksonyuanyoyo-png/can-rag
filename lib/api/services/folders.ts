import { apiRequest } from '../api-client'
import { API_PREFIX } from '../config'
import type { Folder } from '../types'

export const foldersService = {
  async list(): Promise<Folder[]> {
    const result = await apiRequest<Folder[]>(`${API_PREFIX}/folders`)
    return result.data
  },

  async create(name: string): Promise<Folder> {
    const result = await apiRequest<Folder>(`${API_PREFIX}/folders`, {
      method: 'POST',
      body: { name },
    })
    return result.data
  },

  async update(folderId: string, name: string): Promise<Folder> {
    const result = await apiRequest<Folder>(`${API_PREFIX}/folders/${folderId}`, {
      method: 'PATCH',
      body: { name },
    })
    return result.data
  },

  async remove(folderId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`${API_PREFIX}/folders/${folderId}`, {
      method: 'DELETE',
    })
  },
}
