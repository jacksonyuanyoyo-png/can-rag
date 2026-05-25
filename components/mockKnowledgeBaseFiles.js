/** @typedef {"available"} KnowledgeBaseFileStatus */

/**
 * @type {Record<string, Array<{
 *   id: string,
 *   name: string,
 *   format: string,
 *   status: KnowledgeBaseFileStatus,
 *   charCount: number,
 *   uploadedAt: string,
 *   tags: string[] | null,
 * }>>}
 */
export const KNOWLEDGE_BASE_FILES = {
  "3db6b023-e59c-48bf-a12b-9c8e7f654321": [
    {
      id: "215d96dc-5ec0-4e3c-ae1b-8f2d4c9e8a01",
      name: "215d96dc-5ec0-4e3c-ae1b-8f2d4c9e8a01",
      format: "pdf",
      status: "available",
      charCount: 1974,
      uploadedAt: "2024-11-23T00:11:31.000Z",
      tags: null,
    },
    {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      name: "大模型初级 - 大模型微调.pdf",
      format: "pdf",
      status: "available",
      charCount: 4520,
      uploadedAt: "2024-11-23T00:11:32.000Z",
      tags: null,
    },
    {
      id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      name: "安装Windows 10系统通常需要准备以下工具和材料",
      format: "pdf",
      status: "available",
      charCount: 3200,
      uploadedAt: "2024-11-23T00:11:33.000Z",
      tags: null,
    },
    {
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      name: "安装Windows 10系统通常需要准备以下工具和材料（副本）",
      format: "pdf",
      status: "available",
      charCount: 3180,
      uploadedAt: "2024-11-23T00:11:34.000Z",
      tags: null,
    },
  ],
  "7000faa8-2aae-46d1-ac9e-1a2b3c4d5e6f": [
    {
      id: "f1e2d3c4-b5a6-9780-1234-567890abcdef",
      name: "测试文档.pdf",
      format: "pdf",
      status: "available",
      charCount: 890,
      uploadedAt: "2024-11-20T10:00:00.000Z",
      tags: null,
    },
    {
      id: "a9b8c7d6-e5f4-3210-abcd-ef0987654321",
      name: "README.md",
      format: "md",
      status: "available",
      charCount: 420,
      uploadedAt: "2024-11-21T14:30:00.000Z",
      tags: null,
    },
  ],
  "744697d1-e25b-4d35-b789-abcdef012345": [
    {
      id: "11111111-2222-3333-4444-555555555555",
      name: "个人笔记.pdf",
      format: "pdf",
      status: "available",
      charCount: 1200,
      uploadedAt: "2024-11-22T08:15:00.000Z",
      tags: null,
    },
    {
      id: "22222222-3333-4444-5555-666666666666",
      name: "项目说明.docx",
      format: "docx",
      status: "available",
      charCount: 2100,
      uploadedAt: "2024-11-22T09:00:00.000Z",
      tags: null,
    },
    {
      id: "33333333-4444-5555-6666-777777777777",
      name: "数据导出.csv",
      format: "csv",
      status: "available",
      charCount: 560,
      uploadedAt: "2024-11-22T10:45:00.000Z",
      tags: null,
    },
  ],
}

export function getFilesForKnowledgeBase(kbId) {
  return KNOWLEDGE_BASE_FILES[kbId] ?? []
}
