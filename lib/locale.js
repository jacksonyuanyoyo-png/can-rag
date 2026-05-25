export const LOCALES = [
  { id: "zh", label: "简体中文", htmlLang: "zh-CN" },
  { id: "en", label: "English", htmlLang: "en" },
]

export const messages = {
  zh: {
    settings: "设置",
    language: "语言",
    getHelp: "获取帮助",
    logOut: "退出登录",
    userName: "用户",
    workspace: "工作空间",
    back: "返回",
    selectLanguage: "选择语言",

    landingTitle: "fic-investly AI",
    landingSubtitle: "用更极简的入口开始对话，并以 Apple 式毛玻璃层次承载工作流。",

    aiThinking: "AI 正在思考...",
    pause: "暂停",
    updatedMeta: "更新于 {time} · {count} 条消息",
    save: "保存",
    saveAndResend: "保存并重新发送",
    cancel: "取消",
    edit: "编辑",
    resend: "重新发送",
    assistantAck: "收到，我会继续帮您处理。",

    composerPlaceholder: "今天有什么可以帮您？",
    composerDisclaimer: "AI 可能会出错，请核实重要信息。",
    addAttachment: "添加附件",
    voiceInput: "语音输入",
    selectModel: "选择模型",

    expandSidebar: "展开侧边栏",
    collapseSidebar: "收起侧边栏",
    closeSidebar: "关闭侧边栏",
    openSidebar: "打开侧边栏",
    searchPlaceholder: "搜索…",
    searchConversations: "搜索会话",
    newChat: "开始新对话",
    newChatShortcut: "新对话 (⌘N)",
    pinnedSection: "固定对话",
    pinnedEmpty: "固定重要会话以快速访问。",
    knowledgeBaseSection: "知识库",
    recentSection: "最近",
    recentEmpty: "还没有会话。开始一个新的！",
    foldersSection: "文件夹",
    createFolder: "创建文件夹",
    templatesSection: "模板",
    createTemplate: "创建模板",
    templatesEmpty: "还没有模板。创建你的第一个提示模板。",
    searchChats: "搜索对话",
    folders: "文件夹",

    searchChatsPlaceholder: "搜索对话…",
    newChatBtn: "新对话",
    today: "今天",
    yesterday: "昨天",
    previous7Days: "过去 7 天",
    older: "更早",
    noChatsFound: "未找到对话",
    noChatsFoundHint: "请尝试其他关键词",
    noConversationsYet: "还没有对话",
    noConversationsHint: "开始新对话吧",

    folderNameTitle: "文件夹名称",
    folderNamePlaceholder: "例如：营销项目",
    folderWhatTitle: "什么是文件夹？",
    folderWhatDesc:
      "文件夹可将对话、文件和自定义说明集中在一处，适合进行中的工作，或仅用于保持条理。",
    createFolderBtn: "创建文件夹",

    createTemplateTitle: "创建模板",
    editTemplateTitle: "编辑模板",
    templateNameLabel: "模板名称",
    templateNamePlaceholder: "例如：邮件回复、代码审查、会议记录",
    templateContentLabel: "模板内容",
    templateContentPlaceholder: "在此输入模板内容，使用模板时会插入到对话输入框。",
    templateProTipTitle: "小贴士",
    templateProTipDesc: "模板适合常用提示词、说明或开场白，选择后会直接插入输入框。",
    updateTemplate: "更新模板",
    createTemplateBtn: "创建模板",

    addPhotosFiles: "添加照片和文件",
    agentMode: "智能体模式",
    newBadge: "新",
    deepResearch: "深度研究",
    createImage: "生成图片",
    studyLearn: "学习与答疑",
    webSearch: "网页搜索",
    canvas: "画布",
    connectGoogleDrive: "连接 Google Drive",
    connectOneDrive: "连接 OneDrive",
    connectSharepoint: "连接 SharePoint",
    more: "更多",

    chatOptions: "对话选项",
    pin: "固定",
    unpin: "取消固定",
    rename: "重命名",
    delete: "删除",
    messagesCount: "{count} 条消息",
    renameChatPrompt: "将对话「{title}」重命名为：",
    deleteChatConfirm: "确定删除对话「{title}」吗？",

    renameFolderPrompt: "将文件夹「{name}」重命名为：",
    deleteFolderConfirm: "确定删除文件夹「{name}」吗？相关对话将移至根目录。",
    emptyFolder: "此文件夹中暂无对话",

    useTemplate: "使用模板",
    useTemplateTitle: "使用模板：{snippet}",
    editTemplate: "编辑",
    renameTemplatePrompt: "将模板「{name}」重命名为：",
    deleteTemplateConfirm: "确定删除模板「{name}」吗？",
    useLabel: "使用",

    folderNamePrompt: "文件夹名称",
    folderExistsAlert: "文件夹已存在。",
    newChatTitle: "新对话",
    newChatPreview: "打个招呼开始吧…",

    libraryTitle: "库",

    kbHitTest: "命中测试",
    kbSearchPlaceholder: "请输入知识库名称或描述",
    kbCreate: "创建知识库",
    kbColNameId: "知识库名称/ID",
    kbColDescription: "描述",
    kbColFileCount: "文件数量",
    kbColResources: "资源",
    kbResourceTeam: "Team 知识库",
    kbResourcePersonal: "个人知识库",
    kbColActions: "操作",
    kbTeamNoEdit: "Team 知识库不可编辑或删除",
    kbEdit: "编辑",
    kbDelete: "删除",
    kbDeleteConfirm: "确定删除该知识库吗？",
    kbNoResults: "未找到知识库",
    kbTotalItems: "共 {count} 条",
    kbPerPage: "{size} 条/页",
    kbPrevPage: "上一页",
    kbNextPage: "下一页",
    kbPageSize: "每页条数",

    kbDetailNotFound: "未找到该知识库",
    kbBackToList: "返回知识库列表",
    kbDetailId: "知识库 ID",
    kbDetailDescription: "描述",
    kbDetailCopy: "复制 ID",
    kbDetailCopied: "已复制",
    kbDetailResource: "资源",
    kbDetailUpdated: "更新时间",
    kbFileSearchPlaceholder: "请输入文件名称",
    kbDetailRefresh: "刷新",
    kbDetailBatch: "批量操作",
    kbDetailImport: "导入文件",
    kbFileColNameId: "文件名称/ID",
    kbFileColStatus: "状态",
    kbFileColVolume: "数据量",
    kbFileColFormat: "文件格式",
    kbFileColUploaded: "上传时间",
    kbFileStatusAvailable: "可用",
    kbFileCharCount: "{count} 字符",
    kbFileNoResults: "未找到文件",
  },
  en: {
    settings: "Settings",
    language: "Language",
    getHelp: "Get help",
    logOut: "Log out",
    userName: "User",
    workspace: "Workspace",
    back: "Back",
    selectLanguage: "Select language",

    landingTitle: "fic-investly AI",
    landingSubtitle: "Start with a minimal entry point and an Apple-style glass workflow.",

    aiThinking: "AI is thinking...",
    pause: "Pause",
    updatedMeta: "Updated {time} · {count} messages",
    save: "Save",
    saveAndResend: "Save & resend",
    cancel: "Cancel",
    edit: "Edit",
    resend: "Resend",
    assistantAck: "Got it — I'll continue helping you.",

    composerPlaceholder: "How can I help you today?",
    composerDisclaimer: "AI can make mistakes. Check important info.",
    addAttachment: "Add attachment",
    voiceInput: "Voice input",
    selectModel: "Select model",

    expandSidebar: "Expand sidebar",
    collapseSidebar: "Collapse sidebar",
    closeSidebar: "Close sidebar",
    openSidebar: "Open sidebar",
    searchPlaceholder: "Search…",
    searchConversations: "Search conversations",
    newChat: "New chat",
    newChatShortcut: "New chat (⌘N)",
    pinnedSection: "Pinned",
    pinnedEmpty: "Pin important chats for quick access.",
    knowledgeBaseSection: "Knowledge base",
    recentSection: "Recent",
    recentEmpty: "No chats yet. Start a new one!",
    foldersSection: "Folders",
    createFolder: "Create folder",
    templatesSection: "Templates",
    createTemplate: "Create template",
    templatesEmpty: "No templates yet. Create your first prompt template.",
    searchChats: "Search chats",
    folders: "Folders",

    searchChatsPlaceholder: "Search chats...",
    newChatBtn: "New chat",
    today: "Today",
    yesterday: "Yesterday",
    previous7Days: "Previous 7 days",
    older: "Older",
    noChatsFound: "No chats found",
    noChatsFoundHint: "Try different keywords",
    noConversationsYet: "No conversations yet",
    noConversationsHint: "Start a new chat to begin",

    folderNameTitle: "Folder name",
    folderNamePlaceholder: "E.g. Marketing projects",
    folderWhatTitle: "What's a folder?",
    folderWhatDesc:
      "Folders keep chats, files, and custom instructions in one place — for ongoing work or staying organized.",
    createFolderBtn: "Create folder",

    createTemplateTitle: "Create template",
    editTemplateTitle: "Edit template",
    templateNameLabel: "Template name",
    templateNamePlaceholder: "E.g. Email reply, code review, meeting notes",
    templateContentLabel: "Template content",
    templateContentPlaceholder: "Enter template content. It will be inserted into the chat when used.",
    templateProTipTitle: "Pro tip",
    templateProTipDesc:
      "Templates work great for frequent prompts or starters. They insert directly into your chat input.",
    updateTemplate: "Update template",
    createTemplateBtn: "Create template",

    addPhotosFiles: "Add photos & files",
    agentMode: "Agent mode",
    newBadge: "NEW",
    deepResearch: "Deep research",
    createImage: "Create image",
    studyLearn: "Study and learn",
    webSearch: "Web search",
    canvas: "Canvas",
    connectGoogleDrive: "Connect Google Drive",
    connectOneDrive: "Connect OneDrive",
    connectSharepoint: "Connect SharePoint",
    more: "More",

    chatOptions: "Chat options",
    pin: "Pin",
    unpin: "Unpin",
    rename: "Rename",
    delete: "Delete",
    messagesCount: "{count} messages",
    renameChatPrompt: 'Rename chat "{title}" to:',
    deleteChatConfirm: 'Delete chat "{title}"?',

    renameFolderPrompt: 'Rename folder "{name}" to:',
    deleteFolderConfirm: 'Delete folder "{name}"? Conversations will move to the root.',
    emptyFolder: "No conversations in this folder",

    useTemplate: "Use template",
    useTemplateTitle: "Use template: {snippet}",
    editTemplate: "Edit",
    renameTemplatePrompt: 'Rename template "{name}" to:',
    deleteTemplateConfirm: 'Delete template "{name}"?',
    useLabel: "Use",

    folderNamePrompt: "Folder name",
    folderExistsAlert: "Folder already exists.",
    newChatTitle: "New Chat",
    newChatPreview: "Say hello to start...",

    libraryTitle: "Library",

    kbHitTest: "Hit test",
    kbSearchPlaceholder: "Enter knowledge base name or description",
    kbCreate: "Create knowledge base",
    kbColNameId: "Name / ID",
    kbColDescription: "Description",
    kbColFileCount: "Files",
    kbColResources: "Resources",
    kbResourceTeam: "Team knowledge base",
    kbResourcePersonal: "Personal knowledge base",
    kbColActions: "Actions",
    kbTeamNoEdit: "Team knowledge bases cannot be edited or deleted",
    kbEdit: "Edit",
    kbDelete: "Delete",
    kbDeleteConfirm: "Delete this knowledge base?",
    kbNoResults: "No knowledge bases found",
    kbTotalItems: "{count} items",
    kbPerPage: "{size} / page",
    kbPrevPage: "Previous page",
    kbNextPage: "Next page",
    kbPageSize: "Page size",

    kbDetailNotFound: "Knowledge base not found",
    kbBackToList: "Back to knowledge bases",
    kbDetailId: "Knowledge base ID",
    kbDetailDescription: "Description",
    kbDetailCopy: "Copy ID",
    kbDetailCopied: "Copied",
    kbDetailResource: "Resources",
    kbDetailUpdated: "Updated",
    kbFileSearchPlaceholder: "Enter file name",
    kbDetailRefresh: "Refresh",
    kbDetailBatch: "Batch operation",
    kbDetailImport: "Import files",
    kbFileColNameId: "File name / ID",
    kbFileColStatus: "Status",
    kbFileColVolume: "Data volume",
    kbFileColFormat: "Format",
    kbFileColUploaded: "Uploaded",
    kbFileStatusAvailable: "Available",
    kbFileCharCount: "{count} chars",
    kbFileNoResults: "No files found",
  },
}

export function getMessage(locale, key, vars = {}) {
  let str = messages[locale]?.[key] ?? messages.zh[key] ?? key
  Object.entries(vars).forEach(([k, v]) => {
    str = str.replaceAll(`{${k}}`, String(v))
  })
  return str
}

export function formatTimeAgo(date, locale = "zh") {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const sec = Math.max(1, Math.floor((now - d) / 1000))
  const rtf = new Intl.RelativeTimeFormat(locale === "zh" ? "zh-CN" : "en", { numeric: "auto" })
  const ranges = [
    [60, "second"],
    [3600, "minute"],
    [86400, "hour"],
    [604800, "day"],
    [2629800, "week"],
    [31557600, "month"],
  ]
  let unit = "year"
  let value = -Math.floor(sec / 31557600)
  for (const [limit, u] of ranges) {
    if (sec < limit) {
      unit = u
      const div =
        unit === "second"
          ? 1
          : limit /
            (unit === "minute"
              ? 60
              : unit === "hour"
                ? 3600
                : unit === "day"
                  ? 86400
                  : unit === "week"
                    ? 604800
                    : 2629800)
      value = -Math.floor(sec / div)
      break
    }
  }
  return rtf.format(value, unit)
}

export function getSearchTimeGroup(dateString, locale = "zh") {
  const date = new Date(dateString)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

  if (date >= today) return getMessage(locale, "today")
  if (date >= yesterday) return getMessage(locale, "yesterday")
  if (date >= sevenDaysAgo) return getMessage(locale, "previous7Days")
  return getMessage(locale, "older")
}
