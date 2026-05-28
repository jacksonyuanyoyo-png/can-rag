# 前端 API 接口文档（可直接绑定）

面向前端开发与测试，覆盖 40 个后端接口。  
目标：提供每个接口可直接实现所需信息（request/response/错误码/curl）。

---

## 0. 使用说明

- 文档对象：`Canada-rag-FrontEnd` 前端工程
- 参考规范：`docs/backend-api-dev-doc.md`（重点第 9、15 章）
- 路径前缀：`/v1`
- 响应信封：
  - 成功：`{ "data": ..., "requestId": "..." }`
  - 失败：`{ "error": { "code", "message", "details" }, "requestId": "..." }`

---

## 1. 全局约定

### 1.1 环境变量

- `NEXT_PUBLIC_API_BASE_URL=https://api-dev.example.com`
- `NEXT_PUBLIC_ENABLE_SSE=true`

### 1.2 鉴权

- 业务接口：`Authorization: Bearer <accessToken>`
- Refresh Token：HttpOnly Cookie
- `POST /v1/auth/login`、`POST /v1/auth/refresh` 浏览器请求必须 `credentials: "include"`

### 1.3 通用请求头

| Header | 必填 | 说明 |
|---|---:|---|
| `Authorization` | 业务接口是 | `Bearer <accessToken>` |
| `Content-Type` | JSON Body 是 | `application/json` |
| `Accept` | SSE 是 | `text/event-stream` |
| `X-Request-Id` | 否 | 请求追踪 ID |
| `X-Idempotency-Key` | 写接口建议 | 幂等控制 |
| `X-Team-Id` | team 场景建议 | 团队上下文 |

### 1.4 分页

```json
{
  "data": [],
  "pagination": { "page": 1, "pageSize": 20, "total": 120, "hasMore": true },
  "requestId": "req_xxx"
}
```

### 1.5 常用 Query

- 通用：`page`、`pageSize`、`q`、`sortBy`、`sortOrder`
- 会话：`folderId`
- 文件：`status`、`format`
- 知识库：`scope`

---

## 2. 错误码（完整展开）

### 2.1 Auth

`AUTH_INVALID_REQUEST`、`AUTH_INVALID_CREDENTIALS`、`AUTH_TOKEN_MISSING`、`AUTH_TOKEN_INVALID`、`AUTH_TOKEN_EXPIRED`、`AUTH_REFRESH_EXPIRED`、`AUTH_FORBIDDEN`

### 2.2 Conversations / Messages

`CONVERSATION_NOT_FOUND`、`CONVERSATION_ARCHIVED`、`CONVERSATION_RATE_LIMITED`、`MESSAGE_EMPTY`、`MESSAGE_TOO_LONG`、`MESSAGE_ALREADY_RUNNING`、`MESSAGE_GENERATION_FAILED`、`MESSAGE_CANCELLED`

### 2.3 Folders / Templates

`FOLDER_NOT_FOUND`、`FOLDER_NAME_DUPLICATED`、`FOLDER_INVALID_PARENT`、`TEMPLATE_NOT_FOUND`、`TEMPLATE_NAME_DUPLICATED`、`TEMPLATE_SCOPE_FORBIDDEN`

### 2.4 KB / Files

`KB_NOT_FOUND`、`KB_NAME_DUPLICATED`、`KB_PERMISSION_DENIED`、`KB_STATUS_CONFLICT`、`KB_HAS_RUNNING_IMPORT`、`FILE_NOT_FOUND`、`FILE_TYPE_UNSUPPORTED`、`FILE_SIZE_EXCEEDED`、`FILE_DUPLICATED`、`FILE_IN_USE`

### 2.5 Import / HitTest / Common

`IMPORT_JOB_NOT_FOUND`、`IMPORT_INVALID_OPTIONS`、`IMPORT_CONCURRENCY_LIMIT`、`IMPORT_PARSE_FAILED`、`IMPORT_CHUNK_FAILED`、`IMPORT_EMBEDDING_FAILED`、`IMPORT_INDEX_FAILED`、`HIT_TEST_EMPTY_QUERY`、`HIT_TEST_INVALID_TOPK`、`HIT_TEST_INDEX_NOT_READY`、`VALIDATION_ERROR`、`RESOURCE_NOT_FOUND`、`IDEMPOTENCY_CONFLICT`、`RATE_LIMITED`、`INTERNAL_ERROR`

---

## 3. Auth（4）

### 3.1 POST /v1/auth/login

- 请求体：
```json
{ "email": "admin@example.com", "password": "admin123" }
```
- 成功响应：
```json
{
  "data": {
    "accessToken": "jwt",
    "expiresIn": 1800,
    "user": { "id": "usr_001", "displayName": "Admin", "email": "admin@example.com", "permissions": ["chat:read"] }
  },
  "requestId": "req_login_001"
}
```
- 关键错误码：`AUTH_INVALID_CREDENTIALS`、`AUTH_INVALID_REQUEST`
- curl：
```bash
curl -X POST "$BASE_URL/v1/auth/login" -H "Content-Type: application/json" -c cookies.txt -d '{"email":"admin@example.com","password":"admin123"}'
```

### 3.2 POST /v1/auth/refresh

- 请求体：`{}`
- 成功响应：
```json
{ "data": { "accessToken": "jwt", "expiresIn": 1800 }, "requestId": "req_refresh_001" }
```
- 关键错误码：`AUTH_REFRESH_EXPIRED`、`AUTH_TOKEN_INVALID`
- curl：
```bash
curl -X POST "$BASE_URL/v1/auth/refresh" -H "Content-Type: application/json" -b cookies.txt -c cookies.txt -d '{}'
```

### 3.3 GET /v1/auth/me

- 请求体：无
- 成功响应：
```json
{
  "data": { "id": "usr_001", "displayName": "Admin", "email": "admin@example.com", "permissions": ["chat:read","kb:read"], "teamId": "team_001" },
  "requestId": "req_me_001"
}
```
- 关键错误码：`AUTH_TOKEN_MISSING`、`AUTH_TOKEN_EXPIRED`、`AUTH_FORBIDDEN`
- curl：
```bash
curl -X GET "$BASE_URL/v1/auth/me" -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 3.4 POST /v1/auth/logout

- 请求体：`{}`
- 成功响应：
```json
{ "data": { "success": true }, "requestId": "req_logout_001" }
```
- 关键错误码：`AUTH_TOKEN_INVALID`
- curl：
```bash
curl -X POST "$BASE_URL/v1/auth/logout" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -b cookies.txt -c cookies.txt -d '{}'
```

---

## 4. Models（1）

### 4.1 GET /v1/models

- Query：可选 `status`、`visibility`
- 成功响应：
```json
{
  "data": [
    { "id": "gpt-5", "name": "GPT-5", "icon": "/models/openai.svg", "status": "active", "visibility": "system" }
  ],
  "requestId": "req_models_001"
}
```
- 关键错误码：`AUTH_FORBIDDEN`、`VALIDATION_ERROR`
- curl：
```bash
curl -X GET "$BASE_URL/v1/models" -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 5. Conversations（5）

### 5.1 GET /v1/conversations

- Query：`page`、`pageSize`、`q`、`folderId`、`status`、`sortBy`、`sortOrder`
- 成功响应：
```json
{
  "data": [{ "id": "conv_001", "title": "New chat", "updatedAt": "2026-05-28T08:00:00Z", "messageCount": 0, "preview": "", "pinned": false, "folder": "Work Projects" }],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "hasMore": false },
  "requestId": "req_conv_list_001"
}
```
- 错误码：`AUTH_TOKEN_EXPIRED`、`FOLDER_NOT_FOUND`、`CONVERSATION_RATE_LIMITED`
- curl：
```bash
curl -G "$BASE_URL/v1/conversations" -H "Authorization: Bearer $ACCESS_TOKEN" --data-urlencode "page=1" --data-urlencode "pageSize=20"
```

### 5.2 POST /v1/conversations

- 请求体：
```json
{ "title": "新对话", "folder": "Work Projects", "pinned": false }
```
- 成功响应：
```json
{
  "data": { "id": "conv_002", "title": "新对话", "updatedAt": "2026-05-28T08:00:00Z", "messageCount": 0, "preview": "", "pinned": false, "folder": "Work Projects" },
  "requestId": "req_conv_create_001"
}
```
- 错误码：`VALIDATION_ERROR`、`IDEMPOTENCY_CONFLICT`
- curl：
```bash
curl -X POST "$BASE_URL/v1/conversations" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"title":"新对话","folder":"Work Projects","pinned":false}'
```

### 5.3 GET /v1/conversations/{conversationId}

- 成功响应：
```json
{
  "data": { "id": "conv_001", "title": "Marketing plan", "updatedAt": "2026-05-28T08:00:00Z", "messageCount": 12, "preview": "Drafting...", "pinned": true, "folder": "Work Projects" },
  "requestId": "req_conv_detail_001"
}
```
- 错误码：`CONVERSATION_NOT_FOUND`
- curl：
```bash
curl -X GET "$BASE_URL/v1/conversations/conv_001" -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 5.4 PATCH /v1/conversations/{conversationId}

- 请求体（按场景传）：
```json
{ "pinned": true }
```
```json
{ "title": "Q2 GTM plan" }
```
```json
{ "folder": "Code Reviews" }
```
```json
{ "folder": null }
```
- 成功响应：返回更新后的会话对象（结构同 5.1 列表项）
- 错误码：`CONVERSATION_NOT_FOUND`、`CONVERSATION_ARCHIVED`、`MESSAGE_ALREADY_RUNNING`
- curl：
```bash
curl -X PATCH "$BASE_URL/v1/conversations/conv_001" -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" -d '{"title":"Q2 GTM plan"}'
```

### 5.5 DELETE /v1/conversations/{conversationId}

- 成功响应：
```json
{ "data": { "success": true }, "requestId": "req_del_conv_001" }
```
- 错误码：`CONVERSATION_NOT_FOUND`、`MESSAGE_ALREADY_RUNNING`
- curl：
```bash
curl -X DELETE "$BASE_URL/v1/conversations/conv_001" -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

## 6. Messages（5）

### 6.1 GET /v1/conversations/{conversationId}/messages

- Query（后端建议）：`page`、`pageSize`、`before`、`after`
- 成功响应：
```json
{
  "data": [
    { "id": "msg_1", "role": "user", "content": "hello", "createdAt": "2026-05-28T08:00:00Z", "editedAt": null },
    { "id": "msg_2", "role": "assistant", "content": "hi", "createdAt": "2026-05-28T08:00:03Z", "editedAt": null, "status": "completed", "citations": [], "usage": { "promptTokens": 10, "completionTokens": 8, "totalTokens": 18 } }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 2, "hasMore": false },
  "requestId": "req_msg_list_001"
}
```
- 错误码：`CONVERSATION_NOT_FOUND`、`CONVERSATION_ARCHIVED`

### 6.2 POST /v1/conversations/{conversationId}/messages（非流式）

- 请求体：
```json
{ "content": "请总结政策", "modelId": "gpt-5" }
```
- 成功响应：
```json
{
  "data": {
    "userMessage": { "id": "msg_u1", "role": "user", "content": "请总结政策", "createdAt": "2026-05-28T08:00:00Z" },
    "assistantMessage": { "id": "msg_a1", "role": "assistant", "content": "总结如下...", "status": "completed", "createdAt": "2026-05-28T08:00:03Z", "citations": [], "usage": { "promptTokens": 100, "completionTokens": 60, "totalTokens": 160 } }
  },
  "requestId": "req_msg_send_001"
}
```
- 错误码：`MESSAGE_EMPTY`、`MESSAGE_TOO_LONG`、`MESSAGE_ALREADY_RUNNING`、`MESSAGE_GENERATION_FAILED`

### 6.3 POST /v1/conversations/{conversationId}/messages:stream（SSE）

- 请求头必须含：`Accept: text/event-stream`
- 请求体：
```json
{ "content": "请总结政策", "modelId": "gpt-5", "knowledgeBaseIds": ["kb_001"] }
```
- 事件序列：
`message.created -> retrieval.started -> retrieval.completed -> message.delta* -> usage.completed -> message.completed | message.failed -> done`
- 事件示例：
```text
event: message.delta
data: {"messageId":"msg_a1","delta":"partial text"}
```
- 错误码（建流前）：`VALIDATION_ERROR`、`CONVERSATION_NOT_FOUND`、`MESSAGE_ALREADY_RUNNING`

### 6.4 POST /v1/conversations/{conversationId}/messages/{messageId}:cancel

- 请求体：`{}`
- 成功响应：
```json
{ "data": { "messageId": "msg_a1", "status": "cancelled", "content": "partial..." }, "requestId": "req_cancel_001" }
```
- 错误码：`RESOURCE_NOT_FOUND`、`VALIDATION_ERROR`（状态不可取消）

### 6.5 POST /v1/messages/{messageId}/feedback

- 请求体：
```json
{ "rating": "positive", "comment": "回答准确" }
```
- 成功响应：
```json
{ "data": { "messageId": "msg_a1", "rating": "positive", "comment": "回答准确", "createdAt": "2026-05-28T08:10:00Z", "updatedAt": "2026-05-28T08:10:00Z" }, "requestId": "req_feedback_001" }
```
- 错误码：`RESOURCE_NOT_FOUND`、`VALIDATION_ERROR`、`AUTH_FORBIDDEN`

---

## 7. Folders（4）

### 7.1 GET /v1/folders

- 成功响应：
```json
{ "data": [{ "id": "f1", "name": "Work Projects" }], "requestId": "req_folder_list_001" }
```

### 7.2 POST /v1/folders

- 请求体：
```json
{ "name": "Marketing Projects" }
```
- 成功响应：
```json
{ "data": { "id": "f_abc123", "name": "Marketing Projects" }, "requestId": "req_folder_create_001" }
```
- 错误码：`FOLDER_NAME_DUPLICATED`、`VALIDATION_ERROR`

### 7.3 PATCH /v1/folders/{folderId}

- 请求体：
```json
{ "name": "Marketing Projects v2" }
```
- 成功响应：
```json
{ "data": { "id": "f_abc123", "name": "Marketing Projects v2", "updatedAt": "2026-05-28T08:12:00Z" }, "requestId": "req_folder_patch_001" }
```
- 错误码：`FOLDER_NOT_FOUND`、`FOLDER_NAME_DUPLICATED`

### 7.4 DELETE /v1/folders/{folderId}

- 成功响应：
```json
{ "data": { "success": true }, "requestId": "req_folder_delete_001" }
```
- 错误码：`FOLDER_NOT_FOUND`、`AUTH_FORBIDDEN`

---

## 8. Templates（4）

### 8.1 GET /v1/templates

- Query（可选）：`scope`、`q`
- 成功响应：
```json
{
  "data": [
    { "id": "t1", "name": "Bug Report", "content": "**Bug Report**...", "snippet": "Structured bug report...", "createdAt": "2026-05-21T08:00:00Z", "updatedAt": "2026-05-21T08:00:00Z" }
  ],
  "requestId": "req_template_list_001"
}
```

### 8.2 POST /v1/templates

- 请求体：
```json
{ "name": "Bug Report", "content": "**Bug Report**...", "snippet": "Structured bug report..." }
```
- 成功响应：返回完整模板对象
- 错误码：`TEMPLATE_NAME_DUPLICATED`

### 8.3 PATCH /v1/templates/{templateId}

- 请求体（部分更新）：
```json
{ "name": "Bug Report v2" }
```
```json
{ "name": "Bug Report v2", "content": "**Bug Report v2**...", "snippet": "Updated..." }
```
- 错误码：`TEMPLATE_NOT_FOUND`、`TEMPLATE_NAME_DUPLICATED`、`TEMPLATE_SCOPE_FORBIDDEN`

### 8.4 DELETE /v1/templates/{templateId}

- 成功响应：
```json
{ "data": { "success": true }, "requestId": "req_template_delete_001" }
```
- 错误码：`TEMPLATE_NOT_FOUND`

---

## 9. Knowledge Bases（5）

### 9.1 GET /v1/knowledge-bases

- Query：`page`、`pageSize`、`q`、`scope`
- 成功响应：
```json
{
  "data": [{ "id": "kb_001", "name": "MB迁移", "description": "说明", "fileCount": 4, "resourceType": "team", "updatedAt": "2026-05-28T08:00:00Z" }],
  "pagination": { "page": 1, "pageSize": 10, "total": 1, "hasMore": false },
  "requestId": "req_kb_list_001"
}
```

### 9.2 POST /v1/knowledge-bases

- 请求体：
```json
{ "name": "产品文档库", "description": "存放PRD", "embeddingModelId": "multilingual-embedding", "scope": "personal", "visibility": "private" }
```
- 成功响应：
```json
{
  "data": { "id": "kb_123", "name": "产品文档库", "description": "存放PRD", "fileCount": 0, "resourceType": "personal", "scope": "personal", "visibility": "private", "status": "active", "embeddingModelId": "multilingual-embedding", "createdAt": "2026-05-28T08:00:00Z", "updatedAt": "2026-05-28T08:00:00Z" },
  "requestId": "req_kb_create_001"
}
```
- 错误码：`KB_NAME_DUPLICATED`、`KB_PERMISSION_DENIED`

### 9.3 GET /v1/knowledge-bases/{kbId}

- 成功响应（最低）：
```json
{
  "data": { "id": "kb_123", "name": "产品文档库", "description": "存放PRD", "resourceType": "personal", "updatedAt": "2026-05-28T08:00:00Z" },
  "requestId": "req_kb_detail_001"
}
```
- 错误码：`KB_NOT_FOUND`、`KB_PERMISSION_DENIED`

### 9.4 PATCH /v1/knowledge-bases/{kbId}

- 请求体（部分更新）：
```json
{ "name": "产品文档库v2", "description": "新描述" }
```
- 成功响应：返回更新后的 KB 对象
- 错误码：`KB_NAME_DUPLICATED`、`KB_STATUS_CONFLICT`、`KB_PERMISSION_DENIED`

### 9.5 DELETE /v1/knowledge-bases/{kbId}

- 成功响应：
```json
{ "data": { "success": true }, "requestId": "req_kb_delete_001" }
```
- 错误码：`KB_NOT_FOUND`、`KB_HAS_RUNNING_IMPORT`、`KB_PERMISSION_DENIED`

---

## 10. KB Files / Hit Test / Index（6）

### 10.1 GET /v1/knowledge-bases/{kbId}/files

- Query：`page`、`pageSize`、`q`、`status`、`format`
- 成功响应：
```json
{
  "data": [{ "id": "file_1", "name": "fund-guide.pdf", "format": "pdf", "status": "available", "charCount": 12345, "uploadedAt": "2026-05-28T08:00:00Z", "tags": null }],
  "pagination": { "page": 1, "pageSize": 10, "total": 1, "hasMore": false },
  "requestId": "req_file_list_001"
}
```

### 10.2 GET /v1/knowledge-bases/{kbId}/files/{fileId}

- 成功响应：
```json
{
  "data": {
    "id": "file_1",
    "name": "fund-guide.pdf",
    "format": "pdf",
    "status": "available",
    "charCount": 12345,
    "uploadedAt": "2026-05-28T08:00:00Z",
    "tags": null,
    "mimeType": "application/pdf",
    "sizeBytes": 204800,
    "errorMessage": null
  },
  "requestId": "req_file_detail_001"
}
```
- 错误码：`FILE_NOT_FOUND`

### 10.3 DELETE /v1/knowledge-bases/{kbId}/files/{fileId}

- 成功响应：
```json
{ "data": { "success": true, "fileId": "file_1", "deletedAt": "2026-05-28T08:30:00Z" }, "requestId": "req_file_delete_001" }
```
- 错误码：`FILE_NOT_FOUND`、`FILE_IN_USE`、`KB_PERMISSION_DENIED`

### 10.4 POST /v1/knowledge-bases/{kbId}/files:batch-delete

- 请求体：
```json
{ "fileIds": ["file_1", "file_2"] }
```
- 成功响应：
```json
{
  "data": {
    "succeeded": ["file_1"],
    "failed": [{ "fileId": "file_2", "code": "FILE_IN_USE", "message": "File is being indexed" }],
    "summary": { "total": 2, "succeededCount": 1, "failedCount": 1 }
  },
  "requestId": "req_file_batch_delete_001"
}
```
- 联调冻结：前端按 `HTTP 200 + failed[]` 处理部分失败

### 10.5 POST /v1/knowledge-bases/{kbId}/hit-test

- 请求体：
```json
{ "query": "RRSP 上限", "topK": 5, "filters": { "fileIds": ["file_1"] } }
```
- 成功响应：
```json
{
  "data": {
    "results": [{ "fileId": "file_1", "fileName": "policy.pdf", "chunkId": "chk_1", "score": 0.87, "snippet": "....", "page": 3, "rank": 1 }],
    "latencyMs": 320,
    "query": "RRSP 上限",
    "topK": 5
  },
  "requestId": "req_hit_test_001"
}
```
- 错误码：`HIT_TEST_EMPTY_QUERY`、`HIT_TEST_INVALID_TOPK`、`HIT_TEST_INDEX_NOT_READY`

### 10.6 GET /v1/knowledge-bases/{kbId}/index-stats

- 成功响应：
```json
{
  "data": {
    "status": "ready",
    "fileCount": 10,
    "readyFileCount": 9,
    "chunkCount": 2000,
    "indexedChunkCount": 1980,
    "failedFileCount": 1,
    "indexingFileCount": 0,
    "lastIndexedAt": "2026-05-28T08:20:00Z",
    "updatedAt": "2026-05-28T08:20:00Z"
  },
  "requestId": "req_index_stats_001"
}
```

---

## 11. Upload / Import Jobs（6）

### 11.1 POST /v1/uploads/presign

- 请求体：
```json
{
  "knowledgeBaseId": "kb_123",
  "files": [{ "fileName": "a.pdf", "mimeType": "application/pdf", "sizeBytes": 1048576 }]
}
```
- 成功响应：
```json
{
  "data": {
    "uploads": [{ "uploadId": "upl_1", "fileId": "file_1", "method": "PUT", "uploadUrl": "https://storage.example.com/...", "headers": { "Content-Type": "application/pdf" }, "storageKey": "kb/kb_123/file_1.pdf", "expiresAt": "2026-05-28T08:15:00Z" }]
  },
  "requestId": "req_presign_001"
}
```
- 错误码：`FILE_TYPE_UNSUPPORTED`、`FILE_SIZE_EXCEEDED`、`FILE_DUPLICATED`

### 11.2 POST /v1/uploads/{uploadId}:complete

- 请求体（`etag` 必须来自对象存储 PUT 响应头 `ETag`）：
```json
{ "fileId": "file_1", "storageKey": "kb/kb_123/file_1.pdf", "etag": "\"d41d8cd98f00b204e9800998ecf8427e\"" }
```
- 成功响应：
```json
{ "data": { "fileId": "file_1", "status": "uploaded" }, "requestId": "req_complete_001" }
```

### 11.3 POST /v1/knowledge-bases/{kbId}/import-jobs

- 请求体：
```json
{
  "fileIds": ["file_1", "file_2"],
  "chunkStrategy": "default",
  "metadata": { "includeFileName": true, "includeHeadings": false }
}
```
- custom 策略示例：
```json
{ "fileIds": ["file_1"], "chunkStrategy": "custom", "chunkSize": 800, "chunkOverlap": 120, "metadata": { "includeFileName": true, "includeHeadings": true } }
```
- 成功响应：
```json
{
  "data": { "id": "job_1", "knowledgeBaseId": "kb_123", "fileIds": ["file_1","file_2"], "status": "queued", "progress": 0, "stage": "upload", "errorCode": null, "errorMessage": null, "createdAt": "2026-05-28T08:00:00Z", "updatedAt": "2026-05-28T08:00:00Z" },
  "requestId": "req_import_create_001"
}
```
- 错误码：`IMPORT_INVALID_OPTIONS`、`KB_HAS_RUNNING_IMPORT`、`IMPORT_CONCURRENCY_LIMIT`

### 11.4 GET /v1/import-jobs/{jobId}

- 成功响应（running）：
```json
{
  "data": { "id": "job_1", "knowledgeBaseId": "kb_123", "fileIds": ["file_1"], "status": "running", "progress": 45, "stage": "embed", "errorCode": null, "errorMessage": null, "createdAt": "2026-05-28T08:00:00Z", "updatedAt": "2026-05-28T08:05:00Z" },
  "requestId": "req_import_poll_001"
}
```
- 失败态仍为 HTTP 200，读取 `data.status=failed` 与 `errorCode/errorMessage`

### 11.5 POST /v1/import-jobs/{jobId}:cancel

- 请求体：`{}`
- 成功响应：
```json
{ "data": { "id": "job_1", "status": "cancelled", "progress": 45, "stage": "embed", "updatedAt": "2026-05-28T08:06:00Z" }, "requestId": "req_cancel_001" }
```
- 错误码：`IMPORT_JOB_NOT_FOUND`、`VALIDATION_ERROR`（状态不可取消）

### 11.6 POST /v1/import-jobs/{jobId}:retry

- 请求体：
```json
{
  "options": {
    "chunkStrategy": "custom",
    "chunkSize": 800,
    "chunkOverlap": 120,
    "metadata": { "includeFileName": true, "includeHeadings": false }
  }
}
```
- 成功响应（新任务）：
```json
{
  "data": { "id": "job_2", "retryOf": "job_1", "knowledgeBaseId": "kb_123", "fileIds": ["file_1"], "status": "queued", "progress": 0, "stage": "upload", "createdAt": "2026-05-28T08:10:00Z" },
  "requestId": "req_retry_001"
}
```
- 错误码：`IMPORT_INVALID_OPTIONS`、`IMPORT_CONCURRENCY_LIMIT`、`VALIDATION_ERROR`

---

## 12. 字段与状态映射附录

### 12.1 resourceType / scope

- 请求筛选：`scope`（`personal` / `team`）
- 前端展示：`resourceType`（`personal` / `team`）
- 映射：`scope` -> `resourceType`

### 12.2 folder / folderId

- 当前前端会话字段：`folder`（名称）
- 后续建议：演进为 `folderId`（ID）
- 联调冻结：当前按 `folder` 执行，`folderId` 作为后续改造项

### 12.3 文件状态与索引状态

- 文件状态：`uploaded/parsing/chunking/indexing/ready/failed`；`available` 视为 `ready` 别名
- 索引状态：`indexing/ready/error`（可扩展 `empty`）

### 12.4 SSE 事件字段

- `message.created`: `conversationId`、`userMessage`、`assistantMessage`
- `retrieval.started`: `messageId`、`knowledgeBaseIds`
- `retrieval.completed`: `messageId`、`citations`、`latencyMs`
- `message.delta`: `messageId`、`delta`
- `usage.completed`: `messageId`、`usage`
- `message.completed`: `messageId`、`content`、`status`
- `message.failed`: `messageId`、`error`
- `done`: `conversationId`、`requestId`

### 12.5 导入参数映射

- `metaFilename` -> `metadata.includeFileName`
- `metaHeadings` -> `metadata.includeHeadings`
- `chunkStrategy`：
  - `default` -> `semantic`
  - `custom` -> `fixed_size`
  - `whole` -> `document`（未启用则前端禁用）
  - `page` -> `page`

---

## 13. 前端绑定清单（40 接口）

- [ ] Auth 4 个全部接通（含 refresh cookie）
- [ ] Models 1 个接通（替换硬编码模型）
- [ ] Conversations 5 个接通
- [ ] Messages 5 个接通（SSE + 非流式 + cancel + feedback）
- [ ] Folders 4 个接通
- [ ] Templates 4 个接通
- [ ] Knowledge Bases 5 个接通
- [ ] KB Files/HitTest/Index 6 个接通
- [ ] Upload/Import 6 个接通

---

## 14. 最小闭环验收（必须）

- [ ] 登录成功 -> `/v1/auth/me` 恢复用户态
- [ ] 创建 KB 成功 -> 详情页可见
- [ ] `presign -> PUT -> complete -> import-jobs` 跑通
- [ ] 导入轮询到 `completed`
- [ ] 新建会话并发送消息（传 `modelId` + `knowledgeBaseIds`）
- [ ] SSE 返回 `message.completed` 且包含 citations
- [ ] 错误码映射完整，所有错误可回显 `requestId`

# 前端联调执行文档（可直接使用）

基于 `docs/backend-api-dev-doc.md` 生成，面向前端研发/测试。  
目标：替换当前 Mock，按可执行步骤接入后端真实 API（REST + SSE）。

---

## 0. 联调前置（必须先完成）

### 0.1 环境与变量

- 后端可访问地址（示例）：`https://api-dev.example.com`
- 前端建议配置：
  - `NEXT_PUBLIC_API_BASE_URL=https://api-dev.example.com`
  - `NEXT_PUBLIC_ENABLE_SSE=true`
- Shell 示例变量（用于 curl）：
  - `export BASE_URL=https://api-dev.example.com`
  - `export ACCESS_TOKEN=<login返回的accessToken>`

> 路径拼接约定（二选一，避免双 `/v1`）：
> 1) `baseURL=https://api-dev.example.com`，接口路径写 `/v1/...`（本文默认）；  
> 2) `baseURL=https://api-dev.example.com/v1`，接口路径写 `/...`。

### 0.2 鉴权与 Cookie

- `Authorization: Bearer <accessToken>` 用于业务接口
- Refresh Token 在 **HttpOnly Cookie**
- 调用 `POST /v1/auth/login` 与 `POST /v1/auth/refresh` 时前端必须 `credentials: "include"`

### 0.3 统一响应信封

成功：

```json
{ "data": {}, "requestId": "req_xxx" }
```

失败：

```json
{
  "error": { "code": "KB_NOT_FOUND", "message": "Knowledge base not found", "details": {} },
  "requestId": "req_xxx"
}
```

分页：

```json
{
  "data": [],
  "pagination": { "page": 1, "pageSize": 20, "total": 120, "hasMore": true },
  "requestId": "req_xxx"
}
```

---

## 1. 40 个接口清单（按域）

### 1.1 Auth

- `POST /v1/auth/login`
- `POST /v1/auth/refresh`
- `GET /v1/auth/me`
- `POST /v1/auth/logout`

### 1.2 Models

- `GET /v1/models`

### 1.3 Conversations / Messages

- `GET /v1/conversations`
- `POST /v1/conversations`
- `GET /v1/conversations/{conversationId}`
- `PATCH /v1/conversations/{conversationId}`
- `DELETE /v1/conversations/{conversationId}`
- `GET /v1/conversations/{conversationId}/messages`
- `POST /v1/conversations/{conversationId}/messages`
- `POST /v1/conversations/{conversationId}/messages:stream`
- `POST /v1/conversations/{conversationId}/messages/{messageId}:cancel`
- `POST /v1/messages/{messageId}/feedback`

### 1.4 Folders / Templates

- `GET /v1/folders`
- `POST /v1/folders`
- `PATCH /v1/folders/{folderId}`
- `DELETE /v1/folders/{folderId}`
- `GET /v1/templates`
- `POST /v1/templates`
- `PATCH /v1/templates/{templateId}`
- `DELETE /v1/templates/{templateId}`

### 1.5 Knowledge Bases

- `GET /v1/knowledge-bases`
- `POST /v1/knowledge-bases`
- `GET /v1/knowledge-bases/{kbId}`
- `PATCH /v1/knowledge-bases/{kbId}`
- `DELETE /v1/knowledge-bases/{kbId}`
- `GET /v1/knowledge-bases/{kbId}/files`
- `GET /v1/knowledge-bases/{kbId}/files/{fileId}`
- `DELETE /v1/knowledge-bases/{kbId}/files/{fileId}`
- `POST /v1/knowledge-bases/{kbId}/files:batch-delete`
- `POST /v1/knowledge-bases/{kbId}/hit-test`
- `GET /v1/knowledge-bases/{kbId}/index-stats`

### 1.6 Upload / Import

- `POST /v1/uploads/presign`
- `POST /v1/uploads/{uploadId}:complete`
- `POST /v1/knowledge-bases/{kbId}/import-jobs`
- `GET /v1/import-jobs/{jobId}`
- `POST /v1/import-jobs/{jobId}:cancel`
- `POST /v1/import-jobs/{jobId}:retry`

---

## 2. 核心接口可执行示例

### 2.1 Auth 示例

登录：

```bash
curl -X POST "$BASE_URL/v1/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: req_login_001" \
  -c cookies.txt \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

> 浏览器 fetch 示例：`fetch(url, { method: "POST", credentials: "include", ... })`

获取当前用户：

```bash
curl -X GET "$BASE_URL/v1/auth/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

刷新 token（注意 cookie）：

```bash
curl -X POST "$BASE_URL/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -b cookies.txt -c cookies.txt \
  -d '{}'
```

### 2.2 SSE 聊天示例

请求头要求：

- `Authorization`
- `Content-Type: application/json`
- `Accept: text/event-stream`

事件序列（建议支持）：

`message.created -> retrieval.started -> retrieval.completed -> message.delta* -> usage.completed -> message.completed | message.failed -> done`

请求体（必须含 `modelId`）：

```json
{
  "content": "请总结该知识库的核心政策",
  "modelId": "gpt-5",
  "knowledgeBaseIds": ["kb_001"]
}
```

`retrieval.completed` 事件建议携带 `citations[]`，用于前端即时展示引用来源。

### 2.3 上传与导入示例

presign：

```json
{
  "knowledgeBaseId": "kb_123",
  "files": [
    { "fileName": "a.pdf", "mimeType": "application/pdf", "sizeBytes": 1024 }
  ]
}
```

presign 响应最小字段：

```json
{
  "data": {
    "uploads": [
      {
        "uploadId": "upl_1",
        "fileId": "file_1",
        "method": "PUT",
        "uploadUrl": "https://storage.example/...",
        "headers": { "Content-Type": "application/pdf" },
        "storageKey": "kb/kb_123/file_1.pdf"
      }
    ]
  }
}
```

PUT 规则：

- 使用 `uploadUrl` 直传二进制文件（不要使用业务 API Base URL）
- 带上 presign 返回的 `headers`
- 从 PUT 响应头读取 `ETag`，作为 complete 的 `etag`

complete：

```json
{
  "fileId": "file_1",
  "storageKey": "kb/kb_123/file_1.pdf",
  "etag": "d41d8cd98f00b204e9800998ecf8427e"
}
```

创建导入任务：

```json
{
  "fileIds": ["file_1"],
  "chunkStrategy": "default",
  "metadata": { "includeFileName": true, "includeHeadings": false }
}
```

前端状态到请求字段映射：

- `metaFilename` -> `metadata.includeFileName`
- `metaHeadings` -> `metadata.includeHeadings`

重试导入任务：

```json
{
  "options": { "chunkStrategy": "custom", "chunkSize": 800, "chunkOverlap": 120 }
}
```

---

## 3. 参数规范（按接口范围）

### 3.1 通用参数

- 分页：`page`、`pageSize`
- 搜索：`q`
- 排序：`sortBy`、`sortOrder`
- 通用筛选：`scope`、`status`

### 3.2 接口专属参数

- 会话列表：`folderId`
- 文件列表：`format`
- 命中测试：`topK`、`filters.fileIds`

---

## 4. 关键映射与冻结项

### 4.1 `resourceType` 与 `scope`

- 请求筛选使用 `scope`（`personal` / `team`）
- 前端展示字段使用 `resourceType`（与现有页面一致）

### 4.2 文件状态与索引状态（必须区分）

- 文件状态：`uploaded/parsing/chunking/indexing/ready/failed`（或联调别名 `available`）
- KB 索引状态：`indexing/ready/error`（部分实现可能额外有 `empty`）

联调默认冻结：

- UI 统一显示 `ready` 为“可用”，`available` 视为 `ready` 别名

### 4.3 导入策略映射

| 前端值 | 后端标准值（建议） |
|---|---|
| `default` | `semantic` |
| `custom` | `fixed_size` |
| `whole` | `document`（需联调前确认是否生产启用） |
| `page` | `page` |

联调默认冻结：

- 若后端未开启 `document`，前端禁用 `whole` 选项

---

## 5. 错误码清单（前端必须映射）

> 以下按后端文档分域；前端禁止仅用通配符处理。

### 5.1 Auth

- `AUTH_INVALID_REQUEST`
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_MISSING`
- `AUTH_TOKEN_INVALID`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_REFRESH_EXPIRED`
- `AUTH_FORBIDDEN`

### 5.2 Conversations / Messages

- `CONVERSATION_NOT_FOUND`
- `CONVERSATION_ARCHIVED`
- `CONVERSATION_RATE_LIMITED`
- `MESSAGE_EMPTY`
- `MESSAGE_TOO_LONG`
- `MESSAGE_ALREADY_RUNNING`
- `MESSAGE_GENERATION_FAILED`
- `MESSAGE_CANCELLED`

### 5.3 Folders / Templates

- `FOLDER_NOT_FOUND`
- `FOLDER_NAME_DUPLICATED`
- `FOLDER_INVALID_PARENT`
- `TEMPLATE_NOT_FOUND`
- `TEMPLATE_NAME_DUPLICATED`
- `TEMPLATE_SCOPE_FORBIDDEN`

### 5.4 Knowledge Bases / Files

- `KB_NOT_FOUND`
- `KB_NAME_DUPLICATED`
- `KB_PERMISSION_DENIED`
- `KB_STATUS_CONFLICT`
- `KB_HAS_RUNNING_IMPORT`
- `FILE_NOT_FOUND`
- `FILE_TYPE_UNSUPPORTED`
- `FILE_SIZE_EXCEEDED`
- `FILE_DUPLICATED`
- `FILE_IN_USE`

### 5.5 Import / HitTest / Common

- `IMPORT_JOB_NOT_FOUND`
- `IMPORT_INVALID_OPTIONS`
- `IMPORT_CONCURRENCY_LIMIT`
- `IMPORT_PARSE_FAILED`
- `IMPORT_CHUNK_FAILED`
- `IMPORT_EMBEDDING_FAILED`
- `IMPORT_INDEX_FAILED`
- `HIT_TEST_EMPTY_QUERY`
- `HIT_TEST_INVALID_TOPK`
- `HIT_TEST_INDEX_NOT_READY`
- `VALIDATION_ERROR`
- `RESOURCE_NOT_FOUND`
- `IDEMPOTENCY_CONFLICT`
- `RATE_LIMITED`
- `INTERNAL_ERROR`

---

## 6. Phase 联调计划（可执行可打勾）

### Phase 1（P0）Auth + apiClient

- [ ] 接通 `login/me/refresh/logout`
- [ ] refresh 使用 cookie（`credentials: include`）
- [ ] 401 自动重放一次，失败跳登录
- [ ] 验证：手动构造过期 token，原请求能恢复

### Phase 2（P1）KB 基础页

- [ ] `/library` 列表改真实分页/搜索
- [ ] `/library/create` 提交真实创建（含 `embeddingModelId`）
- [ ] `/library/:id` 详情 + 文件列表 + index-stats
- [ ] 验证：创建后刷新仍在；不存在 KB 显示 404 友好页

### Phase 3（P2）上传与导入

- [ ] `presign -> PUT -> complete` 跑通（含 `etag`）
- [ ] 创建 import-job 并轮询到终态
- [ ] cancel/retry 可用
- [ ] 验证：20MB 限制、类型限制、失败重试

### Phase 4（P3）聊天核心

- [ ] `GET /v1/models` 接入，发送携带 `modelId`
- [ ] 会话 CRUD + 历史消息加载
- [ ] SSE 流式事件全链路（含 `message.failed`）
- [ ] 非流式兜底可用
- [ ] 验证：停止生成后消息 `status=cancelled`

### Phase 5（P4）增强能力

- [ ] folders/templates CRUD
- [ ] hit-test 与 index-stats 联动
- [ ] message feedback
- [ ] 文件单删/批删（含部分失败）

---

## 7. 端到端场景（建议执行）

### 7.0 黄金路径（主链路）

- [ ] 登录成功
- [ ] 创建 KB
- [ ] 上传文件并完成导入
- [ ] index-stats 显示 ready
- [ ] 新建会话并在发送消息时传 `knowledgeBaseIds`
- [ ] SSE 回复含 citations

> 当前联调采用“消息级绑定 KB”（`POST .../messages(:stream)` 传 `knowledgeBaseIds`），不依赖会话级固定绑定字段。

### 7.1 其他关键场景

- [ ] token 过期自动 refresh
- [ ] viewer 删除 team KB 返回 `KB_PERMISSION_DENIED`
- [ ] 导入失败返回 `IMPORT_PARSE_FAILED` 且可 retry
- [ ] hit-test 空 query 返回 `HIT_TEST_EMPTY_QUERY`
- [ ] SSE 中断后通过 `GET .../messages` 恢复

---

## 8. 发布前检查

- [ ] Mock 数据不再作为真数据源
- [ ] 写操作失败都有回滚
- [ ] 每个错误都可追踪 `requestId`
- [ ] 按钮有 loading/disabled 防重复提交
- [ ] 错误码映射表完整（第 5 节）
- [ ] 冻结并确认以下待对齐项：
  - [x] `available` 视为 `ready` 别名
  - [x] 会话字段当前按 `folder` 执行，`folderId` 作为后续改造项
  - [x] `whole` 仅在后端明确支持时开放
  - [x] 批量删除按 `200 + failed[]` 处理


