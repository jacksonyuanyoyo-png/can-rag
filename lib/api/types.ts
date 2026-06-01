export interface ApiErrorBody {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ApiSuccessEnvelope<T> {
  data: T
  requestId?: string
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody
  requestId?: string
}

export interface Pagination {
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface PaginatedData<T> {
  data: T[]
  pagination: Pagination
  requestId?: string
}

export interface SuccessResult<T> {
  data: T
  requestId?: string
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: Pagination
  requestId?: string
}

export interface User {
  id: string
  displayName: string
  email: string
  permissions: string[]
  teamId?: string
}

export interface LoginResult {
  accessToken: string
  expiresIn: number
  user: User
}

export interface RefreshResult {
  accessToken: string
  expiresIn: number
}

export interface Model {
  id: string
  name: string
  icon?: string
  status: string
  visibility?: string
}

export interface Conversation {
  id: string
  title: string
  updatedAt: string
  messageCount: number
  preview?: string
  pinned: boolean
  folder?: string | null
}

export interface MessageCitation {
  index?: number
  knowledgeBaseId?: string
  fileId?: string
  fileName?: string
  chunkId?: string
  dataId?: string
  score?: number
  snippet?: string
  content?: string
  page?: number
  sourceType?: string
}

export interface MessageUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  createdAt: string
  editedAt?: string | null
  status?: string
  citations?: MessageCitation[]
  usage?: MessageUsage
}

export interface Folder {
  id: string
  name: string
  updatedAt?: string
}

export interface Template {
  id: string
  name: string
  content: string
  snippet?: string
  createdAt?: string
  updatedAt?: string
}

export interface KnowledgeBase {
  id: string
  name: string
  description?: string | null
  fileCount: number
  resourceType?: string
  scope?: string
  visibility?: string
  status?: string
  embeddingModelId?: string
  createdAt?: string
  updatedAt: string
}

export interface KnowledgeBaseFile {
  id: string
  name: string
  format?: string
  status: string
  charCount?: number
  uploadedAt?: string
  tags?: string[] | null
  mimeType?: string
  sizeBytes?: number
  errorMessage?: string | null
  /** GET .../raw — inline source file (not parsed .md) */
  sourceFileUrl?: string
  storageKey?: string | null
}

export interface FileChunkIndex {
  indexId: string
  text: string
}

export interface FileChunk {
  dataId: string
  text: string
  charCount: number
  page?: number | null
  chunkIndex: number
  citation?: Record<string, unknown>
  indexes?: FileChunkIndex[]
}

export interface FileChunkContextItem {
  dataId: string
  chunkIndex: number
  page?: number | null
  text: string
}

export interface FileChunkDetailResult {
  target: FileChunk
  context: {
    before: FileChunkContextItem[]
    after: FileChunkContextItem[]
  }
}

export interface IndexStats {
  status: string
  fileCount: number
  readyFileCount?: number
  chunkCount?: number
  indexedChunkCount?: number
  failedFileCount?: number
  indexingFileCount?: number
  lastIndexedAt?: string
  updatedAt?: string
}

export interface ImportJob {
  id: string
  knowledgeBaseId: string
  fileIds: string[]
  status: string
  progress: number
  stage: string
  errorCode?: string | null
  errorMessage?: string | null
  retryOf?: string
  createdAt: string
  updatedAt: string
}

export interface PresignUploadItem {
  uploadId: string
  fileId: string
  method: string
  uploadUrl: string
  headers?: Record<string, string>
  storageKey: string
  expiresAt?: string
}

export interface ListQuery {
  page?: number
  pageSize?: number
  q?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  scope?: string
  status?: string
  folderId?: string
  format?: string
  [key: string]: string | number | boolean | undefined
}
