/** @typedef {"team" | "personal"} KnowledgeBaseResourceType */

/** @type {Array<{ id: string, name: string, description: string, fileCount: number, resourceType: KnowledgeBaseResourceType, updatedAt: string }>} */
export const INITIAL_KNOWLEDGE_BASES = [
  {
    id: "3db6b023-e59c-48bf-a12b-9c8e7f654321",
    name: "MB迁移_dfasdf",
    description:
      "本知识库用于 MB 迁移项目的文档归档与检索，涵盖产品需求说明、接口设计、测试用例、上线 checklist 及常见问题解答。内容会随版本迭代持续更新，请在引用前确认文档日期与所属环境（开发 / 预发 / 生产）。",
    fileCount: 4,
    resourceType: "team",
    updatedAt: "2024-11-23T00:11:22.000Z",
  },
  {
    id: "7000faa8-2aae-46d1-ac9e-1a2b3c4d5e6f",
    name: "MB迁移_test2",
    description: "测试",
    fileCount: 2,
    resourceType: "team",
    updatedAt: "2024-11-20T10:00:00.000Z",
  },
  {
    id: "744697d1-e25b-4d35-b789-abcdef012345",
    name: "MB迁移_test",
    description: "test",
    fileCount: 3,
    resourceType: "personal",
    updatedAt: "2024-11-22T08:00:00.000Z",
  },
]

export function getKnowledgeBaseById(id) {
  return INITIAL_KNOWLEDGE_BASES.find((kb) => kb.id === id) ?? null
}
