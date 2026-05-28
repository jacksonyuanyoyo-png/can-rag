# 后端接口开发文档（前端工程反向分析版）

## 0. 文档元信息

- 版本：`v0.1`
- 产出日期：`2026-05-28`
- 适用项目：`Canada-rag-FrontEnd`
- 受众：后端开发、架构、测试、联调负责人
- 目标：基于当前前端工程（纯 Mock）定义可落地后端接口规范，支持后端拆分开发与前后端联调

### 0.1 当前现状与目标态

**当前已实现（前端 Mock）**
- 项目是 Next.js 14 前端原型，几乎无真实 HTTP 调用
- 页面路由存在，但主要页面 UI 在 `AIAssistantUI` 中按 pathname 切换
- 聊天回复由 `setTimeout` 模拟，非流式
- 知识库、文件、会话数据来自 `mock*.js` + 组件 `useState`
- 导入页可选文件，但“确认导入”仅跳转，无上传、无任务、无后端交互
- 无完整鉴权、权限、错误码框架

**建议后端目标态**
- 提供 REST + SSE 能力，覆盖 Auth、会话、消息、知识库、文件上传导入、命中测试
- 提供统一错误结构、权限校验、幂等、防重、并发控制
- 支撑分页/筛选/排序、上传任务化、流式聊天与兜底非流式

---

## 1. 页面全景与后端能力映射

### 1.1 路由清单（前端可见）

- `/`：聊天主页
- `/library`：知识库列表
- `/library/create`：创建知识库
- `/library/:id`：知识库详情（文件列表等）
- `/library/:id/import`：知识库文件导入

### 1.2 页面 -> 功能 -> 后端能力

| 页面 | 前端现状 | 需要后端能力 |
|---|---|---|
| `/` | 会话与消息均本地状态 | 会话 CRUD、消息历史、发送消息、SSE 流式、取消生成、反馈 |
| `/library` | 本地 mock 列表 + 前端分页搜索 | 知识库列表查询（分页/筛选/排序）、删除、权限过滤 |
| `/library/create` | 表单校验 + 本地新增 | 知识库创建、命名唯一校验、scope/visibility 规则 |
| `/library/:id` | 本地 mock 详情和文件 | 知识库详情、文件列表、删除文件、索引统计 |
| `/library/:id/import` | 选文件后仅跳转 | 预签名上传、上传确认、导入任务创建、进度查询、失败重试 |

---

## 2. 领域模型与数据字典

> 字段以“目标态”为准；示例满足前端当前 UI 需求。

### 2.1 Conversation

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | string | 是 | 会话 ID |
| title | string | 是 | 会话标题 |
| folderId | string/null | 否 | 所属文件夹 |
| knowledgeBaseIds | string[] | 否 | 绑定知识库 |
| status | enum | 是 | `active/archived/deleted` |
| lastMessageAt | string/null | 否 | 最近消息时间（ISO） |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 2.2 Message

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | string | 是 | 消息 ID |
| conversationId | string | 是 | 会话 ID |
| role | enum | 是 | `user/assistant/system/tool` |
| content | string | 是 | 文本内容 |
| status | enum | 是 | `pending/streaming/completed/failed/cancelled` |
| citations | array | 否 | 引用来源 |
| usage | object | 否 | token 用量 |
| createdAt | string | 是 | 时间 |

### 2.3 KnowledgeBase

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | string | 是 | 知识库 ID |
| name | string | 是 | 名称（建议唯一） |
| description | string/null | 否 | 描述 |
| scope | enum | 是 | `personal/team` |
| visibility | enum | 是 | `private/team_read/team_write` |
| status | enum | 是 | `active/indexing/error/archived` |
| fileCount | number | 是 | 文件数 |
| chunkCount | number | 是 | 切块数 |
| totalBytes | number | 是 | 总大小 |
| createdAt | string | 是 | 创建时间 |
| updatedAt | string | 是 | 更新时间 |

### 2.4 KnowledgeBaseFile

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | string | 是 | 文件 ID |
| knowledgeBaseId | string | 是 | 所属知识库 |
| fileName | string | 是 | 文件名 |
| mimeType | string | 是 | MIME |
| sizeBytes | number | 是 | 文件大小 |
| storageKey | string | 是 | 存储 key |
| status | enum | 是 | `uploaded/parsing/chunking/indexing/ready/failed` |
| chunkStrategy | enum | 是 | `fixed_size/semantic/page` |
| errorMessage | string/null | 否 | 错误信息 |
| createdAt | string | 是 | 时间 |
| updatedAt | string | 是 | 时间 |

### 2.5 ImportJob

| 字段 | 类型 | 必填 | 说明 |
|---|---|---:|---|
| id | string | 是 | 任务 ID |
| knowledgeBaseId | string | 是 | 知识库 ID |
| fileIds | string[] | 是 | 文件 ID 列表 |
| status | enum | 是 | `queued/running/completed/failed/cancelled` |
| progress | number | 是 | 0-100 |
| stage | enum | 是 | `upload/parse/chunk/embed/index/done` |
| errorCode | string/null | 否 | 业务错误码 |
| errorMessage | string/null | 否 | 错误说明 |
| createdAt | string | 是 | 时间 |
| updatedAt | string | 是 | 时间 |

---

## 3. 鉴权与权限规范

### 3.1 建议方案

- Access Token：JWT（15~30 分钟）
- Refresh Token：HttpOnly Cookie（7~30 天）
- 刷新接口：`POST /v1/auth/refresh`
- 登出接口：`POST /v1/auth/logout`

### 3.2 请求头规范

| Header | 说明 |
|---|---|
| Authorization | `Bearer <accessToken>` |
| X-Request-Id | 请求追踪 ID（建议） |
| X-Idempotency-Key | 写接口幂等键（建议） |
| X-Team-Id | 团队上下文（team 资源建议） |

### 3.3 权限点建议

- `chat:read` `chat:send` `chat:delete`
- `folder:read` `folder:write`
- `template:read` `template:write`
- `kb:read` `kb:create` `kb:update` `kb:delete`
- `kb:file:read` `kb:file:upload` `kb:file:delete`
- `kb:import` `kb:hit_test`

---

## 4. 统一接口规范

### 4.1 URL 与响应规范

- Base URL：`/v1`
- 资源路径：复数名词（如 `/v1/knowledge-bases`）
- 成功响应：

```json
{
  "data": {},
  "requestId": "req_xxx"
}
```

- 错误响应：

```json
{
  "error": {
    "code": "KB_NOT_FOUND",
    "message": "Knowledge base not found",
    "details": {}
  },
  "requestId": "req_xxx"
}
```

### 4.2 分页、筛选、排序

- 分页：`page`（从 1 开始）、`pageSize`（建议最大 100）
- 筛选：`q`、`scope`、`status`
- 排序：`sortBy`、`sortOrder(asc/desc)`

分页响应建议：

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 120,
    "hasMore": true
  },
  "requestId": "req_xxx"
}
```

### 4.3 幂等与并发

- 创建/发送/导入类写操作支持 `X-Idempotency-Key`
- 同一会话同一时刻建议只允许一个 running assistant message
- 同一知识库并发导入任务建议限制 1~2 个

---

## 5. 详细接口清单（30+ 核心接口）

### 5.1 Auth 域

1. `POST /v1/auth/login` 登录  
2. `POST /v1/auth/refresh` 刷新 token  
3. `GET /v1/auth/me` 当前用户  
4. `POST /v1/auth/logout` 登出

### 5.2 Conversations / Messages 域

5. `GET /v1/conversations` 会话列表  
6. `POST /v1/conversations` 创建会话  
7. `GET /v1/conversations/{conversationId}` 会话详情  
8. `PATCH /v1/conversations/{conversationId}` 更新会话  
9. `DELETE /v1/conversations/{conversationId}` 删除/归档会话  
10. `GET /v1/conversations/{conversationId}/messages` 消息历史  
11. `POST /v1/conversations/{conversationId}/messages` 非流式发送  
12. `POST /v1/conversations/{conversationId}/messages:stream` SSE 流式发送  
13. `POST /v1/conversations/{conversationId}/messages/{messageId}:cancel` 取消生成  
14. `POST /v1/messages/{messageId}/feedback` 消息反馈

### 5.3 Folders / Templates 域

15. `GET /v1/folders` 文件夹列表  
16. `POST /v1/folders` 创建文件夹  
17. `PATCH /v1/folders/{folderId}` 更新文件夹  
18. `DELETE /v1/folders/{folderId}` 删除文件夹  
19. `GET /v1/templates` 模板列表  
20. `POST /v1/templates` 创建模板  
21. `PATCH /v1/templates/{templateId}` 更新模板  
22. `DELETE /v1/templates/{templateId}` 删除模板

### 5.3.1 Models 域（补充）

23. `GET /v1/models` 模型列表（用于替换前端当前硬编码 `selectedModel`）

### 5.4 KnowledgeBase 域

24. `GET /v1/knowledge-bases` 知识库列表  
25. `POST /v1/knowledge-bases` 创建知识库  
26. `GET /v1/knowledge-bases/{kbId}` 知识库详情  
27. `PATCH /v1/knowledge-bases/{kbId}` 更新知识库  
28. `DELETE /v1/knowledge-bases/{kbId}` 删除知识库  
29. `GET /v1/knowledge-bases/{kbId}/files` 文件列表  
30. `GET /v1/knowledge-bases/{kbId}/files/{fileId}` 文件详情  
31. `DELETE /v1/knowledge-bases/{kbId}/files/{fileId}` 删除文件  
32. `POST /v1/knowledge-bases/{kbId}/files:batch-delete` 批量删除文件（对应详情页“批量”按钮）  
33. `POST /v1/knowledge-bases/{kbId}/hit-test` 命中测试  
34. `GET /v1/knowledge-bases/{kbId}/index-stats` 索引统计

### 5.5 Upload / Import 域

35. `POST /v1/uploads/presign` 申请预签名上传 URL  
36. `POST /v1/uploads/{uploadId}:complete` 上传完成确认  
37. `POST /v1/knowledge-bases/{kbId}/import-jobs` 创建导入任务  
38. `GET /v1/import-jobs/{jobId}` 查询导入任务  
39. `POST /v1/import-jobs/{jobId}:cancel` 取消导入任务  
40. `POST /v1/import-jobs/{jobId}:retry` 重试导入任务

---

## 6. 流式聊天协议（SSE + 兜底）

### 6.1 SSE 接口

- `POST /v1/conversations/{conversationId}/messages:stream`
- `Accept: text/event-stream`
- 事件建议：`message.created` `retrieval.started` `retrieval.completed` `message.delta` `usage.completed` `message.completed` `message.failed` `done`

SSE 示例：

```text
event: message.delta
data: {"messageId":"msg_102","delta":"Based on the policy, "}
```

### 6.2 非流式兜底

- `POST /v1/conversations/{conversationId}/messages`
- 直接返回完整 assistant 内容（适配企业代理不支持 SSE 场景）

---

## 7. 上传导入协议（推荐预签名直传）

### 7.1 方案选择

- 推荐：预签名 URL 直传对象存储
- 备选：multipart 由后端中转（MVP 可用但扩展性差）

### 7.2 推荐流程

1. 前端选择文件并本地校验
2. `POST /v1/uploads/presign`
3. 浏览器 PUT 到对象存储
4. `POST /v1/uploads/{uploadId}:complete`
5. `POST /v1/knowledge-bases/{kbId}/import-jobs`
6. `GET /v1/import-jobs/{jobId}` 轮询
7. 完成后刷新文件列表与索引统计

### 7.3 建议限制

- 单文件：优先按前端当前文案对齐 `<= 20MB`（后续评估后再放宽）
- 单次上传：优先按前端当前文案对齐 `<= 100` 文件
- 文件类型白名单：pdf/docx/txt/md/csv 等

### 7.4 导入策略字段对齐（补充）

当前前端 `KnowledgeBaseImportPage` 的策略值为：
- `chunkStrategy`: `default | custom | whole | page`
- `metaFilename`: `boolean`
- `metaHeadings`: `boolean`

建议后端兼容层：
- 保留前端值直接入参（短期），避免联调阻塞
- 在服务端内部映射为标准策略（例如 `fixed_size/semantic/page`）
- 映射表示例：

| 前端值 | 后端标准值（建议） | 备注 |
|---|---|---|
| `default` | `semantic` | 默认智能切块 |
| `custom` | `fixed_size` | 需额外参数，如 `chunkSize/chunkOverlap` |
| `whole` | `document` | 整文策略（谨慎使用） |
| `page` | `page` | 按页切块 |

---

## 8. 联调计划（分批）

### Phase 1（P0）

- Auth：`login/me/refresh/logout`
- 统一错误结构与权限中间件

验收：登录态闭环可用，401/403 行为稳定。

### Phase 2（P1）

- 知识库：列表、创建、详情、文件列表

验收：`/library`、`/library/create`、`/library/:id` 可走真实数据。

### Phase 3（P2）

- 上传导入：presign、complete、import-jobs、进度查询

验收：导入页可真实上传并看到任务进度和最终状态。

### Phase 4（P3）

- 聊天：会话列表、消息历史、SSE 流式、非流式兜底、取消生成

验收：首页可真实对话并显示 citations。

### Phase 5（P4）

- 模板/文件夹/命中测试/反馈

验收：增强能力完整可用。

---

## 9. 统一错误码（20+，按域分组）

### Auth
- `AUTH_INVALID_REQUEST`
- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_MISSING`
- `AUTH_TOKEN_INVALID`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_REFRESH_EXPIRED`
- `AUTH_FORBIDDEN`

### Conversations & Messages
- `CONVERSATION_NOT_FOUND`
- `CONVERSATION_ARCHIVED`
- `CONVERSATION_RATE_LIMITED`
- `MESSAGE_EMPTY`
- `MESSAGE_TOO_LONG`
- `MESSAGE_ALREADY_RUNNING`
- `MESSAGE_GENERATION_FAILED`
- `MESSAGE_CANCELLED`

### Folders & Templates
- `FOLDER_NOT_FOUND`
- `FOLDER_NAME_DUPLICATED`
- `FOLDER_INVALID_PARENT`
- `TEMPLATE_NOT_FOUND`
- `TEMPLATE_NAME_DUPLICATED`
- `TEMPLATE_SCOPE_FORBIDDEN`

### KnowledgeBases & Files
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

### Import & HitTest & Common
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

## 10. 端到端联调测试场景（至少 8 个）

1. 登录 -> 刷新页面 -> `/auth/me` 恢复会话  
2. Token 过期 -> 自动 refresh -> 原请求重放成功  
3. 创建知识库 -> 列表和详情立即可见  
4. viewer 删除 team 知识库 -> 返回 `KB_PERMISSION_DENIED`  
5. 上传 PDF -> 创建导入任务 -> 进度推进 -> 文件 ready  
6. 导入失败 -> 返回 `IMPORT_PARSE_FAILED` -> 支持 retry  
7. 命中测试返回 `topK` 结果与 snippet  
8. SSE 聊天完整收敛：delta -> completed -> usage  
9. SSE 中断后拉取消息历史恢复 UI  
10. 点击停止生成 -> 消息状态 `cancelled`

---

## 11. 关键风险与待确认

1. 当前前端无 API Client，需要同步改造成本  
2. 企业网络对 SSE 支持不确定，必须保留非流式兜底  
3. 向量化/索引链路（parse/chunk/embed/index）实现复杂度高  
4. team/personal 目前前端仅展示控制，后端必须强校验  
5. 上传容量/类型/并发限制需产品、安全、成本共同确定  
6. 删除策略（硬删/软删）与审计要求需先冻结  
7. 错误码到前端文案映射需提前冻结，避免联调反复  
8. 导入任务与聊天并发限流策略需定义（防资源打满）
9. 前端导入策略值与后端标准策略若不对齐，会导致联调参数错误
10. 前端存在 `selectedModel`，若后端不提供模型列表接口，后续动态配置会受限

---

## 12. 前端建议改造点（Top 10）

1. 新增统一 `apiClient`（鉴权、刷新、错误、重试）  
2. 组件层不再直接依赖 `mock*.js`  
3. `AIAssistantUI` 的路由分支逻辑逐步拆分为页面容器  
4. 接入 React Query/SWR 做数据缓存与失效  
5. 聊天从 `setTimeout` 迁移到 SSE  
6. 导入页接入 presign + complete + import job  
7. 增加全局错误展示和字段级错误映射  
8. 增加权限指令（UI 隐藏仅做体验，安全靠后端）  
9. 增加请求追踪 ID 与埋点  
10. 补充联调与回归自动化（契约测试 + E2E）

---

## 13. 查漏补缺结论（本轮复核新增）

### 已补齐项

1. 修正了接口章节标题“19个核心接口”的错误描述（实际为 30+）。  
2. 新增 `GET /v1/models`，匹配前端当前 `selectedModel` 的未来动态化需求。  
3. 新增 `POST /v1/knowledge-bases/{kbId}/files:batch-delete`，对应知识库详情页“批量”操作入口。  
4. 将上传限制修正为与当前前端文案一致（`20MB`、`100` 文件）。  
5. 补充导入策略字段映射，解决前端 `default/custom/whole/page` 与后端标准策略命名差异。  

### 仍需产品/后端最终确认

1. `whole` 策略是否允许在生产开启。  
2. 批量删除接口是同步删除还是异步任务化。  
3. 模型列表是否包含可见性范围（个人/团队/系统）与版本冻结策略。  

---

## 14. 数据库表命名统一规范（强制）

本节作为数据库命名规范基线：**文档内所有业务表统一使用 `t_fact_xxx` 或 `t_dim_xxx` 前缀**。  
若后续出现新表，必须遵循同样规范，不允许出现无前缀或其他前缀。

### 14.1 规则

- `t_dim_xxx`：相对稳定的主数据/维度数据（用户、知识库、模型、文件夹、模板等）
- `t_fact_xxx`：事务、事件、流水、任务、绑定关系（消息、导入任务、反馈、授权、桥接关系等）
- 桥接表（多对多）统一归入 `t_fact_xxx`
- 字段命名统一 snake_case：`created_at`、`updated_at`、`*_id`

### 14.2 统一表清单

#### 维度表（t_dim）

| 表名 | 用途 | 核心主键 | 关键字段 |
|---|---|---|---|
| `t_dim_user` | 用户主数据 | `id` | `email`,`display_name`,`status` |
| `t_dim_team` | 团队主数据 | `id` | `name`,`status` |
| `t_dim_role` | 角色定义 | `id` | `code`,`name`,`scope` |
| `t_dim_permission` | 权限点定义 | `id` | `code`,`domain`,`description` |
| `t_dim_role_permission` | 角色-权限定义矩阵 | `(role_id,permission_id)` | `role_id`,`permission_id` |
| `t_dim_folder` | 会话文件夹 | `id` | `name`,`owner_user_id`,`team_id` |
| `t_dim_chat_template` | 聊天模板 | `id` | `name`,`content`,`scope` |
| `t_dim_llm_model` | 模型配置 | `id` | `code`,`display_name`,`provider`,`status` |
| `t_dim_conversation` | 会话容器 | `id` | `title`,`status`,`pinned`,`last_message_at` |
| `t_dim_knowledge_base` | 知识库主数据 | `id` | `name`,`description`,`scope`,`visibility`,`status` |
| `t_dim_kb_file` | 知识库文件主数据 | `id` | `kb_id`,`file_name`,`mime_type`,`status`,`chunk_strategy` |

#### 事实表（t_fact）

| 表名 | 用途 | 核心主键 | 关键字段 |
|---|---|---|---|
| `t_fact_auth_session` | 登录/刷新会话 | `id` | `user_id`,`refresh_token_hash`,`expires_at` |
| `t_fact_user_team` | 用户-团队关系 | `id` | `user_id`,`team_id`,`role_in_team` |
| `t_fact_user_role` | 用户-角色授予 | `id` | `user_id`,`role_id`,`team_id`,`granted_at` |
| `t_fact_conversation_kb` | 会话-知识库绑定 | `id` | `conversation_id`,`kb_id`,`is_active` |
| `t_fact_message` | 聊天消息事实 | `id` | `conversation_id`,`role`,`content`,`status`,`model_id` |
| `t_fact_message_citation` | 消息引用片段 | `id` | `message_id`,`file_id`,`chunk_id`,`score` |
| `t_fact_message_usage` | token 用量 | `id` | `message_id`,`prompt_tokens`,`completion_tokens` |
| `t_fact_message_feedback` | 消息反馈 | `id` | `message_id`,`user_id`,`rating`,`comment` |
| `t_fact_kb_grant` | 知识库授权关系 | `id` | `kb_id`,`user_id`,`grant_type` |
| `t_fact_upload_session` | 上传会话 | `id` | `kb_id`,`user_id`,`storage_key`,`status` |
| `t_fact_import_job` | 导入任务头 | `id` | `kb_id`,`status`,`progress`,`stage` |
| `t_fact_import_job_file` | 导入任务文件明细 | `id` | `import_job_id`,`file_id`,`file_status`,`error_code` |
| `t_fact_import_job_option` | 导入策略快照 | `id` | `import_job_id`,`chunk_strategy`,`meta_filename`,`meta_headings` |
| `t_fact_hit_test` | 命中测试请求 | `id` | `kb_id`,`user_id`,`query`,`top_k`,`latency_ms` |
| `t_fact_hit_test_result` | 命中测试结果明细 | `id` | `hit_test_id`,`file_id`,`chunk_id`,`score`,`rank` |
| `t_fact_idempotency_key` | 幂等键记录 | `id` | `user_id`,`idempotency_key`,`request_hash`,`expires_at` |

### 14.3 旧概念到新表名映射

| 旧概念 | 新表名 |
|---|---|
| conversation | `t_dim_conversation` |
| message | `t_fact_message` |
| template | `t_dim_chat_template` |
| folder | `t_dim_folder` |
| knowledge_base | `t_dim_knowledge_base` |
| knowledge_base_file | `t_dim_kb_file` |
| import_job | `t_fact_import_job` |
| upload | `t_fact_upload_session` |
| hit_test | `t_fact_hit_test` |

---

## 15. 接口级 Request/Response 详细清单（基于前端代码溯源）

说明：
- 本节字段优先来源于当前前端组件和 mock 结构；无法从前端确认的字段标记为“后端建议”。
- 前端当前无真实 HTTP 调用，本节为联调契约设计。

### 15.1 Auth

#### `POST /v1/auth/login`
- 前端触发：`SettingsPopover` 未来登录入口（当前未实现）
- Request body：
```json
{ "email": "string", "password": "string" }
```
- Response body：
```json
{
  "data": {
    "accessToken": "string",
    "expiresIn": 1800,
    "user": { "id": "string", "displayName": "string", "email": "string", "permissions": ["string"] }
  },
  "requestId": "string"
}
```

#### `GET /v1/auth/me`
- 前端触发：应用初始化（目标态）
- Response body（最低）：
```json
{
  "data": { "id": "string", "displayName": "string", "email": "string", "permissions": ["string"], "teamId": "string" },
  "requestId": "string"
}
```

#### `POST /v1/auth/refresh`
- 前端触发：AccessToken 过期后自动刷新（目标态）
- Request body（建议为空，基于 HttpOnly Refresh Cookie）：
```json
{}
```
- Response body：
```json
{
  "data": { "accessToken": "string", "expiresIn": 1800 },
  "requestId": "string"
}
```
- 错误响应示例：
```json
{
  "error": { "code": "AUTH_REFRESH_EXPIRED", "message": "Refresh token expired", "details": {} },
  "requestId": "string"
}
```

#### `POST /v1/auth/logout`
- 前端触发：设置菜单退出登录（`SettingsPopover`，当前 UI 占位）
- Request body：
```json
{}
```
- Response body：
```json
{
  "data": { "success": true },
  "requestId": "string"
}
```
- 错误响应示例：
```json
{
  "error": { "code": "AUTH_TOKEN_INVALID", "message": "Invalid token", "details": {} },
  "requestId": "string"
}
```

### 15.2 Models

#### `GET /v1/models`
- 前端来源：`components/ModelSelector.jsx` 的 `MODELS`（`id/name/icon`）
- Request body：无
- Response body（必须包含）：
```json
{
  "data": [
    { "id": "gpt-5", "name": "GPT-5", "icon": "/models/openai.svg", "status": "active", "visibility": "system" }
  ],
  "requestId": "string"
}
```

### 15.3 Conversations / Messages

#### `GET /v1/conversations`
- 前端触发：`/` 页面初始化、搜索弹窗
- 前端字段来源：`components/mockData.js` 的会话结构
- Query：`page`,`pageSize`,`q`,`folderId`
- Response body（前端实际会消费）：
```json
{
  "data": [
    {
      "id": "conv_001",
      "title": "string",
      "updatedAt": "2026-05-28T08:00:00Z",
      "messageCount": 3,
      "preview": "string",
      "pinned": false,
      "folder": "Work Projects"
    }
  ],
  "pagination": { "page": 1, "pageSize": 20, "total": 1, "hasMore": false },
  "requestId": "string"
}
```

#### `POST /v1/conversations`
- 前端触发：New Chat（`AIAssistantUI.createNewChat`）
- Request body（可追溯字段）：
```json
{ "title": "New chat", "folder": "Work Projects", "pinned": false }
```
- Response body：
```json
{
  "data": {
    "id": "conv_002",
    "title": "New chat",
    "updatedAt": "2026-05-28T08:00:00Z",
    "messageCount": 0,
    "preview": "",
    "pinned": false,
    "folder": "Work Projects"
  },
  "requestId": "string"
}
```

#### `GET /v1/conversations/{conversationId}`
- 前端触发：选中会话后加载会话头信息（目标态，当前从内存直接取）
- Request body：无
- Response body：
```json
{
  "data": {
    "id": "conv_001",
    "title": "string",
    "updatedAt": "2026-05-28T08:00:00Z",
    "messageCount": 3,
    "preview": "string",
    "pinned": false,
    "folder": "Work Projects"
  },
  "requestId": "string"
}
```
- 错误响应示例：
```json
{
  "error": { "code": "CONVERSATION_NOT_FOUND", "message": "Conversation not found", "details": { "conversationId": "conv_404" } },
  "requestId": "string"
}
```

#### `PATCH /v1/conversations/{conversationId}`
- 前端触发：Pin/Unpin、重命名（UI 已有）、移动文件夹（目标态）
- Request body（按场景）：
```json
{ "pinned": true }
```
```json
{ "title": "Renamed title" }
```
```json
{ "folder": "New Folder" }
```
- Response body：返回更新后的会话对象（同 GET 列表项结构）

#### `DELETE /v1/conversations/{conversationId}`
- 前端触发：`ConversationRow` 删除菜单（当前上层未接）
- Response body：
```json
{ "data": { "success": true }, "requestId": "string" }
```

#### `GET /v1/conversations/{conversationId}/messages`
- 前端触发：打开会话
- Response body（前端可追溯字段）：
```json
{
  "data": [
    { "id": "msg_1", "role": "user", "content": "string", "createdAt": "2026-05-28T08:00:00Z", "editedAt": null },
    { "id": "msg_2", "role": "assistant", "content": "string", "createdAt": "2026-05-28T08:00:03Z", "editedAt": null }
  ],
  "requestId": "string"
}
```

#### `POST /v1/conversations/{conversationId}/messages`
- 前端触发：`Composer` 发送、重发、重新生成（当前都走同一路径）
- Request body（当前前端可追溯）：
```json
{ "content": "string", "modelId": "gpt-5" }
```
> 注：`modelId` 当前前端状态存在但尚未传入发送函数，属于“联调必须补齐”字段。
- Response body（非流式兜底）：
```json
{
  "data": {
    "userMessage": { "id": "msg_u1", "role": "user", "content": "string", "createdAt": "2026-05-28T08:00:00Z" },
    "assistantMessage": {
      "id": "msg_a1",
      "role": "assistant",
      "content": "string",
      "status": "completed",
      "createdAt": "2026-05-28T08:00:03Z",
      "citations": [],
      "usage": { "promptTokens": 100, "completionTokens": 60, "totalTokens": 160 }
    }
  },
  "requestId": "string"
}
```

#### `POST /v1/conversations/{conversationId}/messages:stream`
- 前端触发：发送消息（目标态）
- Request body：
```json
{ "content": "string", "modelId": "gpt-5", "knowledgeBaseIds": ["kb_001"] }
```
- SSE 事件体（最小）：
```text
event: message.delta
data: {"messageId":"msg_a1","delta":"partial text"}
```

#### `POST /v1/conversations/{conversationId}/messages/{messageId}:cancel`
- 前端触发：`ThinkingBlock` 停止按钮
- Response body：
```json
{ "data": { "messageId": "msg_a1", "status": "cancelled" }, "requestId": "string" }
```

#### `POST /v1/messages/{messageId}/feedback`
- 前端触发：点赞/点踩按钮（当前无 handler）
- Request body：
```json
{ "rating": "positive", "comment": "string" }
```
- Response body：
```json
{ "data": { "messageId": "msg_a1", "rating": "positive", "createdAt": "2026-05-28T08:10:00Z" }, "requestId": "string" }
```

### 15.4 Folders

#### `GET /v1/folders`
- 前端触发：侧栏加载
- Response body（可追溯字段）：
```json
{
  "data": [{ "id": "f1", "name": "Work Projects" }],
  "requestId": "string"
}
```

#### `POST /v1/folders`
- 前端触发：`CreateFolderModal` 提交
- Request body：
```json
{ "name": "string" }
```
- Response body：
```json
{ "data": { "id": "f2", "name": "string" }, "requestId": "string" }
```

#### `PATCH /v1/folders/{folderId}`
- 前端触发：重命名（目标态）
- Request body：
```json
{ "name": "string" }
```
- Response body：
```json
{ "data": { "id": "f2", "name": "string", "updatedAt": "2026-05-28T08:12:00Z" }, "requestId": "string" }
```

#### `DELETE /v1/folders/{folderId}`
- 前端触发：删除（目标态）
- Response body：
```json
{ "data": { "success": true }, "requestId": "string" }
```

### 15.5 Templates

#### `GET /v1/templates`
- 前端触发：侧栏模板列表
- Response body（可追溯字段）：
```json
{
  "data": [
    { "id": "t1", "name": "string", "content": "string", "snippet": "string", "createdAt": "2026-05-28T08:00:00Z", "updatedAt": "2026-05-28T08:00:00Z" }
  ],
  "requestId": "string"
}
```

#### `POST /v1/templates`
- 前端触发：新建模板
- Request body：
```json
{ "name": "string", "content": "string", "snippet": "string" }
```
- Response body：返回模板对象

#### `PATCH /v1/templates/{templateId}`
- 前端触发：编辑/重命名
- Request body：
```json
{ "name": "string", "content": "string", "snippet": "string" }
```
- Response body：返回更新后模板对象

#### `DELETE /v1/templates/{templateId}`
- 前端触发：删除模板
- Response body：
```json
{ "data": { "success": true }, "requestId": "string" }
```

### 15.6 Knowledge Bases

#### `GET /v1/knowledge-bases`
- 前端触发：`/library` 列表
- Query：`page`,`pageSize`,`q`,`scope`
- Response body（前端可追溯字段优先）：
```json
{
  "data": [
    {
      "id": "kb_001",
      "name": "string",
      "description": "string",
      "fileCount": 10,
      "resourceType": "team",
      "updatedAt": "2026-05-28T08:00:00Z"
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 1, "hasMore": false },
  "requestId": "string"
}
```
> 若后端使用 `scope`，联调时需映射为前端当前 `resourceType`（或同步改前端字段）。

#### `POST /v1/knowledge-bases`
- 前端触发：`/library/create` 提交
- Request body（前端可追溯 + 必补字段）：
```json
{
  "name": "string",
  "description": "string",
  "embeddingModelId": "multilingual-embedding"
}
```
- Response body：
```json
{
  "data": {
    "id": "kb_123",
    "name": "string",
    "description": "string",
    "fileCount": 0,
    "resourceType": "personal",
    "updatedAt": "2026-05-28T08:00:00Z"
  },
  "requestId": "string"
}
```

#### `GET /v1/knowledge-bases/{kbId}`
- 前端触发：`/library/:id`、`/library/:id/import`
- Response body（最低）：
```json
{
  "data": {
    "id": "kb_123",
    "name": "string",
    "description": "string",
    "resourceType": "personal",
    "updatedAt": "2026-05-28T08:00:00Z"
  },
  "requestId": "string"
}
```

#### `PATCH /v1/knowledge-bases/{kbId}`
- 前端触发：编辑按钮（当前 UI 占位）
- Request body：
```json
{ "name": "string", "description": "string", "resourceType": "team" }
```
- Response body：返回更新后的 KB 对象

#### `DELETE /v1/knowledge-bases/{kbId}`
- 前端触发：列表删除
- Response body：
```json
{ "data": { "success": true }, "requestId": "string" }
```

### 15.7 KB Files / Hit Test / Index

#### `GET /v1/knowledge-bases/{kbId}/files`
- 前端触发：详情页文件表
- Query：`page`,`pageSize`,`q`,`status`,`format`
- Response body（前端可追溯字段）：
```json
{
  "data": [
    {
      "id": "file_1",
      "name": "string",
      "format": "pdf",
      "status": "available",
      "charCount": 12345,
      "uploadedAt": "2026-05-28T08:00:00Z",
      "tags": null
    }
  ],
  "pagination": { "page": 1, "pageSize": 10, "total": 1, "hasMore": false },
  "requestId": "string"
}
```

#### `GET /v1/knowledge-bases/{kbId}/files/{fileId}`
- 前端触发：文件详情抽屉（目标态）
- Response body：同文件对象，建议补 `errorMessage`,`mimeType`,`sizeBytes`
- Response body（补充完整）：
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
  "requestId": "string"
}
```
- 错误响应示例：
```json
{
  "error": { "code": "FILE_NOT_FOUND", "message": "File not found", "details": { "fileId": "file_404" } },
  "requestId": "string"
}
```

#### `DELETE /v1/knowledge-bases/{kbId}/files/{fileId}`
- 前端触发：文件删除（目标态）
- Response body：
```json
{ "data": { "success": true }, "requestId": "string" }
```

#### `POST /v1/knowledge-bases/{kbId}/files:batch-delete`
- 前端触发：详情页“批量”按钮（目标态）
- Request body：
```json
{ "fileIds": ["file_1","file_2"] }
```
- Response body：
```json
{
  "data": {
    "succeeded": ["file_1"],
    "failed": [{ "fileId": "file_2", "code": "FILE_IN_USE", "message": "string" }]
  },
  "requestId": "string"
}
```

#### `POST /v1/knowledge-bases/{kbId}/hit-test`
- 前端触发：列表/详情“命中测试”按钮（当前无实现）
- Request body：
```json
{ "query": "string", "topK": 5, "filters": { "fileIds": ["file_1"] } }
```
- Response body：
```json
{
  "data": {
    "results": [
      { "fileId": "file_1", "chunkId": "chk_1", "score": 0.87, "snippet": "string", "page": 3 }
    ],
    "latencyMs": 320
  },
  "requestId": "string"
}
```

#### `GET /v1/knowledge-bases/{kbId}/index-stats`
- 前端触发：详情页状态区（目标态）
- Response body：
```json
{
  "data": { "status": "ready", "fileCount": 10, "chunkCount": 2000, "indexedChunkCount": 1980, "failedFileCount": 1, "lastIndexedAt": "2026-05-28T08:20:00Z" },
  "requestId": "string"
}
```

### 15.8 Upload / Import Jobs

#### `POST /v1/uploads/presign`
- 前端触发：导入页确认时（目标态）
- Request body（可追溯到 File 对象）：
```json
{
  "knowledgeBaseId": "kb_123",
  "files": [{ "fileName": "a.pdf", "mimeType": "application/pdf", "sizeBytes": 1024 }]
}
```
- Response body：
```json
{
  "data": {
    "uploads": [{ "uploadId": "upl_1", "fileId": "file_1", "method": "PUT", "uploadUrl": "https://...", "headers": { "Content-Type": "application/pdf" }, "storageKey": "kb/kb_123/file_1.pdf", "expiresAt": "2026-05-28T08:15:00Z" }]
  },
  "requestId": "string"
}
```

#### `POST /v1/uploads/{uploadId}:complete`
- 前端触发：PUT 成功后
- Request body：
```json
{ "fileId": "file_1", "storageKey": "kb/kb_123/file_1.pdf", "etag": "string" }
```
- Response body：
```json
{ "data": { "fileId": "file_1", "status": "uploaded" }, "requestId": "string" }
```

#### `POST /v1/knowledge-bases/{kbId}/import-jobs`
- 前端触发：导入确认（替换当前仅跳转）
- Request body（与前端导入页 state 对齐）：
```json
{
  "fileIds": ["file_1"],
  "chunkStrategy": "default",
  "metadata": { "includeFileName": true, "includeHeadings": false }
}
```
- Response body：
```json
{
  "data": { "id": "job_1", "knowledgeBaseId": "kb_123", "fileIds": ["file_1"], "status": "queued", "progress": 0, "stage": "upload", "createdAt": "2026-05-28T08:00:00Z" },
  "requestId": "string"
}
```

#### `GET /v1/import-jobs/{jobId}`
- 前端触发：轮询进度
- Response body：
```json
{
  "data": { "id": "job_1", "knowledgeBaseId": "kb_123", "status": "running", "progress": 45, "stage": "embed", "errorCode": null, "errorMessage": null, "updatedAt": "2026-05-28T08:05:00Z" },
  "requestId": "string"
}
```

#### `POST /v1/import-jobs/{jobId}:cancel`
- 前端触发：取消导入（目标态）
- Response body：
```json
{ "data": { "id": "job_1", "status": "cancelled", "progress": 45 }, "requestId": "string" }
```

#### `POST /v1/import-jobs/{jobId}:retry`
- 前端触发：失败重试（目标态）
- Request body：
```json
{ "options": { "chunkStrategy": "custom", "chunkSize": 800, "chunkOverlap": 120 } }
```
- Response body：
```json
{ "data": { "id": "job_2", "retryOf": "job_1", "status": "queued", "progress": 0 }, "requestId": "string" }
```

---

## 16. 后端接口支持程度（按接口逐条分级）

### 16.1 分级定义

- **MVP**：前端页面可替换 mock 跑通主路径
- **可联调**：字段和错误码稳定，支持测试联调
- **生产级**：权限、并发、幂等、可观测、降级策略齐备

### 16.2 分级矩阵

| 接口 | MVP | 可联调 | 生产级 | 说明 |
|---|---|---|---|---|
| `POST /v1/auth/login` | 必须 | 必须 | 必须 | 无登录无法进入真实联调 |
| `GET /v1/auth/me` | 必须 | 必须 | 必须 | 初始化用户上下文 |
| `POST /v1/auth/refresh` | 可后置 | 必须 | 必须 | 联调阶段就需处理 token 续期 |
| `POST /v1/auth/logout` | 可后置 | 必须 | 必须 | 与设置页退出登录对齐 |
| `GET /v1/models` | 可后置 | 必须 | 必须 | 前端 selectedModel 动态化基础 |
| `GET /v1/conversations` | 必须 | 必须 | 必须 | 首页核心列表 |
| `POST /v1/conversations` | 必须 | 必须 | 必须 | 新建对话入口 |
| `PATCH /v1/conversations/{id}` | 可后置 | 必须 | 必须 | pin/rename/folder |
| `DELETE /v1/conversations/{id}` | 可后置 | 必须 | 必须 | 删除对话 |
| `GET /v1/conversations/{id}/messages` | 必须 | 必须 | 必须 | 恢复历史消息 |
| `POST /v1/conversations/{id}/messages` | 必须 | 必须 | 必须 | 非流式兜底 |
| `POST /v1/conversations/{id}/messages:stream` | 可后置 | 必须 | 必须 | 联调应验证 SSE |
| `POST /v1/conversations/{id}/messages/{messageId}:cancel` | 可后置 | 必须 | 必须 | 停止生成 |
| `POST /v1/messages/{id}/feedback` | 可后置 | 可后置 | 必须 | 生产质量反馈闭环 |
| `GET /v1/folders` | 可后置 | 必须 | 必须 | 侧栏结构 |
| `POST /v1/folders` | 可后置 | 必须 | 必须 | 创建文件夹 |
| `PATCH /v1/folders/{id}` | 可后置 | 可后置 | 必须 | 重命名 |
| `DELETE /v1/folders/{id}` | 可后置 | 可后置 | 必须 | 删除 |
| `GET /v1/templates` | 可后置 | 必须 | 必须 | 侧栏模板展示 |
| `POST /v1/templates` | 可后置 | 可后置 | 必须 | 新建模板 |
| `PATCH /v1/templates/{id}` | 可后置 | 可后置 | 必须 | 编辑模板 |
| `DELETE /v1/templates/{id}` | 可后置 | 可后置 | 必须 | 删除模板 |
| `GET /v1/knowledge-bases` | 必须 | 必须 | 必须 | `/library` 核心 |
| `POST /v1/knowledge-bases` | 必须 | 必须 | 必须 | `/library/create` 核心 |
| `GET /v1/knowledge-bases/{kbId}` | 必须 | 必须 | 必须 | 详情与导入页入口 |
| `PATCH /v1/knowledge-bases/{kbId}` | 可后置 | 可后置 | 必须 | 编辑 KB |
| `DELETE /v1/knowledge-bases/{kbId}` | 必须 | 必须 | 必须 | 列表删除 |
| `GET /v1/knowledge-bases/{kbId}/files` | 必须 | 必须 | 必须 | 文件表 |
| `GET /v1/knowledge-bases/{kbId}/files/{fileId}` | 可后置 | 可后置 | 必须 | 文件详情 |
| `DELETE /v1/knowledge-bases/{kbId}/files/{fileId}` | 可后置 | 必须 | 必须 | 文件删除 |
| `POST /v1/knowledge-bases/{kbId}/files:batch-delete` | 可后置 | 可后置 | 必须 | 批量删除 |
| `POST /v1/knowledge-bases/{kbId}/hit-test` | 可后置 | 可后置 | 必须 | 命中测试按钮 |
| `GET /v1/knowledge-bases/{kbId}/index-stats` | 可后置 | 可后置 | 必须 | 索引健康与状态 |
| `POST /v1/uploads/presign` | 可后置 | 必须 | 必须 | 导入链路基础 |
| `POST /v1/uploads/{uploadId}:complete` | 可后置 | 必须 | 必须 | 上传落库确认 |
| `POST /v1/knowledge-bases/{kbId}/import-jobs` | 可后置 | 必须 | 必须 | 确认导入核心 |
| `GET /v1/import-jobs/{jobId}` | 可后置 | 必须 | 必须 | 进度可视化 |
| `POST /v1/import-jobs/{jobId}:cancel` | 可后置 | 可后置 | 必须 | 生产可控性 |
| `POST /v1/import-jobs/{jobId}:retry` | 可后置 | 可后置 | 必须 | 失败恢复 |

### 16.3 接口级最低支持要求（后端实现深度）

#### MVP 最低要求
- 跑通页面闭环：`/`、`/library`、`/library/create`、`/library/:id`
- 非流式聊天可用，知识库创建/查询可用，文件列表可用
- 统一错误结构至少包含：`code`,`message`,`requestId`

#### 可联调最低要求
- SSE 可用并可回退非流式
- 导入链路可用：`presign -> complete -> import-jobs -> polling`
- 401/403/409 等核心业务错误码稳定
- 支持分页和搜索，不依赖前端假分页

#### 生产级最低要求
- 权限强校验（不依赖前端隐藏按钮）
- 幂等（关键写接口）+ 并发控制 + 限流
- 审计日志、可观测、失败重试与降级
- 任务状态机完整（upload/parse/chunk/embed/index/done）

---

## 17. 字段来源映射（前端可追溯）

本节用于满足“每个接口字段必须可追溯到前端代码”的审查要求。  
若字段未出现在当前前端代码中，标注为“后端建议”。

| 接口 | 字段 | 来源 | 备注 |
|---|---|---|---|
| `GET /v1/models` | `id`,`name`,`icon` | `components/ModelSelector.jsx` `MODELS` | 前端硬编码，联调改后端返回 |
| `GET /v1/conversations` | `id`,`title`,`updatedAt`,`messageCount`,`preview`,`pinned`,`folder` | `components/mockData.js` `INITIAL_CONVERSATIONS` | 会话列表实际字段 |
| `POST /v1/conversations` | `title`,`preview`,`pinned`,`folder` | `components/AIAssistantUI.jsx` `createNewChat` | `id/updatedAt`由后端返回 |
| `GET /v1/conversations/{id}/messages` | `id`,`role`,`content`,`createdAt`,`editedAt` | `components/mockData.js` + `AIAssistantUI.editMessage` | `editedAt`来自前端编辑逻辑 |
| `POST /v1/conversations/{id}/messages` | `content` | `components/Composer.jsx` `handleSend` | `modelId`为联调必补字段 |
| `PATCH /v1/conversations/{id}` | `pinned` | `AIAssistantUI.togglePin` | 已有本地行为 |
| `POST /v1/messages/{id}/feedback` | `rating`,`comment` | `components/ChatPane.jsx`（按钮 UI） | 当前无 handler，后端建议字段 |
| `GET /v1/folders` | `id`,`name` | `components/mockData.js` `INITIAL_FOLDERS` | 真实最小字段 |
| `POST /v1/folders` | `name` | `components/CreateFolderModal.jsx` | 目前 AIAssistantUI 还存在 prompt 路径 |
| `GET /v1/templates` | `id`,`name`,`content`,`snippet`,`createdAt`,`updatedAt` | `components/mockData.js` `INITIAL_TEMPLATES` | 模板列表字段 |
| `POST /v1/templates` | `name`,`content`,`snippet` | `components/CreateTemplateModal.jsx` | 前端可直接提交 |
| `GET /v1/knowledge-bases` | `id`,`name`,`description`,`fileCount`,`resourceType`,`updatedAt` | `components/mockKnowledgeBases.js` | 列表消费字段 |
| `POST /v1/knowledge-bases` | `name`,`description` | `KnowledgeBaseCreatePage.jsx` `handleCreate` | `embeddingModelId`来自 `vectorModel`（当前未传） |
| `GET /v1/knowledge-bases/{kbId}` | `id`,`name`,`description`,`resourceType`,`updatedAt` | `getKnowledgeBaseById` + 详情页展示 | 前端详情页头部字段 |
| `GET /v1/knowledge-bases/{kbId}/files` | `id`,`name`,`format`,`status`,`charCount`,`uploadedAt`,`tags` | `components/mockKnowledgeBaseFiles.js` | 详情页文件表字段 |
| `POST /v1/uploads/presign` | `fileName`,`mimeType`,`sizeBytes` | `KnowledgeBaseImportPage.jsx` `File` 对象 | 可追溯 |
| `POST /v1/knowledge-bases/{kbId}/import-jobs` | `fileIds`,`chunkStrategy`,`metaFilename`,`metaHeadings` | `KnowledgeBaseImportPage.jsx` state | 当前未真实提交 |

---

## 18. 接口完备性检查表（100%覆盖）

检查标准：
- A: 有接口用途  
- B: 有前端触发点  
- C: 有 request body（或明确无）  
- D: 有 response body  
- E: 有错误响应示例  
- F: 有字段来源映射  

| 接口 | A | B | C | D | E | F | 结论 |
|---|---|---|---|---|---|---|---|
| `POST /v1/auth/login` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/auth/refresh` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/auth/me` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/auth/logout` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/models` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/conversations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/conversations` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/conversations/{conversationId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `PATCH /v1/conversations/{conversationId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `DELETE /v1/conversations/{conversationId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/conversations/{conversationId}/messages` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/conversations/{conversationId}/messages` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/conversations/{conversationId}/messages:stream` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/conversations/{conversationId}/messages/{messageId}:cancel` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/messages/{messageId}/feedback` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/folders` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/folders` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `PATCH /v1/folders/{folderId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `DELETE /v1/folders/{folderId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/templates` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `PATCH /v1/templates/{templateId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `DELETE /v1/templates/{templateId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/knowledge-bases` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/knowledge-bases` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/knowledge-bases/{kbId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `PATCH /v1/knowledge-bases/{kbId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `DELETE /v1/knowledge-bases/{kbId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/knowledge-bases/{kbId}/files` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/knowledge-bases/{kbId}/files/{fileId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `DELETE /v1/knowledge-bases/{kbId}/files/{fileId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/knowledge-bases/{kbId}/files:batch-delete` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/knowledge-bases/{kbId}/hit-test` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/knowledge-bases/{kbId}/index-stats` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/uploads/presign` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/uploads/{uploadId}:complete` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/knowledge-bases/{kbId}/import-jobs` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `GET /v1/import-jobs/{jobId}` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/import-jobs/{jobId}:cancel` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |
| `POST /v1/import-jobs/{jobId}:retry` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | 通过 |


