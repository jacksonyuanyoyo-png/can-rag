"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import ChatPane from "./ChatPane"
import LibraryPage from "./LibraryPage"
import KnowledgeBaseDetailPage from "./KnowledgeBaseDetailPage"
import KnowledgeBaseCreatePage from "./KnowledgeBaseCreatePage"
import KnowledgeBaseImportPage from "./KnowledgeBaseImportPage"
import GhostIconButton from "./GhostIconButton"
import { Menu } from "./icons/FidelityIcons"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"
import {
  conversationsService,
  foldersService,
  messagesService,
  modelsService,
  templatesService,
} from "@/lib/api/services"
import { ApiError } from "@/lib/api/api-error"
import { useApiError } from "@/hooks/useApiError"
import { useAuth } from "@/components/providers/AuthProvider"

function enrichConversation(conversation) {
  return { ...conversation, messages: conversation.messages ?? [] }
}

export default function AIAssistantUI() {
  const { t } = useLocale()
  const { showApiError } = useApiError()
  const { isAuthenticated, isLoading: authLoading, redirectToLogin } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isLibraryList = pathname === "/library"
  const isLibraryCreate = pathname === "/library/create"
  const isLibraryImport = /^\/library\/[^/]+\/import$/.test(pathname ?? "")
  const isLibraryFileDetail = /^\/library\/[^/]+\/files\/[^/]+$/.test(pathname ?? "")
  const isLibraryDetail =
    /^\/library\/[^/]+$/.test(pathname ?? "") &&
    pathname !== "/library/create" &&
    !isLibraryImport &&
    !isLibraryFileDetail
  const isLibrary = isLibraryList || isLibraryDetail || isLibraryCreate || isLibraryImport || isLibraryFileDetail
  const [mounted, setMounted] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-5")
  const [models, setModels] = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    setMounted(true)
    document.documentElement.classList.remove("dark")
    document.documentElement.setAttribute("data-theme", "light")
    document.documentElement.style.colorScheme = "light"
  }, [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState({ pinned: true, recent: false, folders: true, templates: true })

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sidebar-collapsed")
      if (raw) setCollapsed(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem("sidebar-collapsed", JSON.stringify(collapsed))
    } catch {}
  }, [collapsed, mounted])

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar-collapsed-state")
      if (saved) setSidebarCollapsed(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem("sidebar-collapsed-state", JSON.stringify(sidebarCollapsed))
    } catch {}
  }, [sidebarCollapsed, mounted])

  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState([])
  const [folders, setFolders] = useState([])

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)
  const streamingAssistantIdRef = useRef(null)
  const streamAbortRef = useRef(null)

  const composerRef = useRef(null)

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) {
      setDataLoaded(false)
      setConversations([])
      setFolders([])
      setTemplates([])
      setModels([])
      setSelectedId(null)
    }
  }, [isAuthenticated, authLoading])

  const loadConversationMessages = useCallback(
    async (convId) => {
      try {
        const result = await messagesService.list(convId, { pageSize: 100 })
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, messages: result.data } : c)),
        )
      } catch (error) {
        showApiError(error)
      }
    },
    [showApiError],
  )

  useEffect(() => {
    if (!mounted || dataLoaded || authLoading || !isAuthenticated) return

    let cancelled = false

    async function loadInitialData() {
      try {
        const [convResult, foldersData, templatesData, modelsData] = await Promise.all([
          conversationsService.list({ pageSize: 50, sortBy: "updatedAt", sortOrder: "desc" }),
          foldersService.list(),
          templatesService.list(),
          modelsService.list(),
        ])

        if (cancelled) return

        const nextConversations = convResult.data.map(enrichConversation)
        setConversations(nextConversations)
        setFolders(foldersData)
        setTemplates(templatesData)
        setModels(modelsData)

        if (modelsData.length > 0) {
          setSelectedModel((current) =>
            modelsData.some((model) => model.id === current) ? current : modelsData[0].id,
          )
        }

        if (!isLibraryList && !isLibraryDetail && !isLibraryCreate && !isLibraryImport) {
          if (nextConversations.length > 0) {
            const firstId = nextConversations[0].id
            setSelectedId(firstId)
            const first = nextConversations[0]
            if (first.messageCount > 0 && first.messages.length === 0) {
              await loadConversationMessages(firstId)
            }
          } else {
            const created = await conversationsService.create({
              title: t("newChatTitle"),
              folder: foldersData[0]?.name ?? null,
              pinned: false,
            })
            if (cancelled) return
            const item = enrichConversation(created)
            setConversations([item])
            setSelectedId(item.id)
          }
        }
      } catch (error) {
        if (cancelled) return
        if (
          ApiError.isApiError(error) &&
          ["AUTH_TOKEN_MISSING", "AUTH_TOKEN_EXPIRED", "AUTH_TOKEN_INVALID", "AUTH_REFRESH_EXPIRED"].includes(
            error.code,
          )
        ) {
          redirectToLogin(pathname || "/")
          return
        }
        showApiError(error)
      } finally {
        if (!cancelled) setDataLoaded(true)
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
  }, [
    mounted,
    dataLoaded,
    authLoading,
    isAuthenticated,
    isLibraryList,
    isLibraryDetail,
    isLibraryCreate,
    isLibraryImport,
    loadConversationMessages,
    pathname,
    redirectToLogin,
    showApiError,
    t,
  ])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault()
        createNewChat()
      }
      if (!e.metaKey && !e.ctrlKey && e.key === "/") {
        const tag = document.activeElement?.tagName?.toLowerCase()
        if (tag !== "input" && tag !== "textarea") {
          e.preventDefault()
          searchRef.current?.focus()
        }
      }
      if (e.key === "Escape" && sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.preview ?? "").toLowerCase().includes(q),
    )
  }, [conversations, query])

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) {
      if (c.folder != null && map[c.folder] != null) map[c.folder] += 1
    }
    return map
  }, [conversations, folders])

  async function togglePin(id) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv) return
    const nextPinned = !conv.pinned
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: nextPinned } : c)))
    try {
      await conversationsService.update(id, { pinned: nextPinned })
    } catch (error) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !nextPinned } : c)))
      showApiError(error)
    }
  }

  async function handleRenameConversation(id, newTitle) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv || !newTitle.trim()) return
    const trimmed = newTitle.trim()
    const prevTitle = conv.title
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c)))
    try {
      await conversationsService.update(id, { title: trimmed })
    } catch (error) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: prevTitle } : c)))
      showApiError(error)
    }
  }

  async function handleDeleteConversation(id) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv) return
    const prevList = conversations
    const prevSelectedId = selectedId
    const nextList = conversations.filter((c) => c.id !== id)
    setConversations(nextList)
    if (selectedId === id) {
      setSelectedId(nextList[0]?.id ?? null)
    }
    try {
      await conversationsService.remove(id)
      if (nextList.length === 0) {
        await createNewChat()
      }
    } catch (error) {
      setConversations(prevList)
      setSelectedId(prevSelectedId)
      showApiError(error)
    }
  }

  async function createNewChat() {
    if (isLibrary) router.push("/")
    try {
      const item = await conversationsService.create({
        title: t("newChatTitle"),
        folder: folders[0]?.name ?? null,
        pinned: false,
      })
      const enriched = enrichConversation(item)
      setConversations((prev) => [enriched, ...prev])
      setSelectedId(item.id)
      setSidebarOpen(false)
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleSelectConversation(id) {
    if (isLibrary) router.push("/")
    setSelectedId(id)
    const conv = conversations.find((c) => c.id === id)
    if (conv && conv.messageCount > 0 && (!conv.messages || conv.messages.length === 0)) {
      await loadConversationMessages(id)
    }
  }

  async function createFolder(name) {
    if (!name?.trim()) return
    const trimmed = name.trim()
    if (folders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      showApiError(new ApiError({ code: "FOLDER_NAME_DUPLICATED", message: t("folderExistsAlert") }))
      return
    }
    try {
      const folder = await foldersService.create(trimmed)
      setFolders((prev) => [...prev, folder])
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleRenameFolder(folderId, oldName, newName) {
    try {
      const updated = await foldersService.update(folderId, newName)
      setFolders((prev) => prev.map((f) => (f.id === folderId ? updated : f)))
      setConversations((prev) =>
        prev.map((c) => (c.folder === oldName ? { ...c, folder: newName } : c)),
      )
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleDeleteFolder(folderId, folderName) {
    try {
      await foldersService.remove(folderId)
      setFolders((prev) => prev.filter((f) => f.id !== folderId))
      setConversations((prev) =>
        prev.map((c) => (c.folder === folderName ? { ...c, folder: null } : c)),
      )
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleCreateTemplate(templateData) {
    try {
      const created = await templatesService.create(templateData)
      setTemplates((prev) => [...prev, created])
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleUpdateTemplate(templateId, templateData) {
    try {
      const updated = await templatesService.update(templateId, templateData)
      setTemplates((prev) => prev.map((item) => (item.id === templateId ? updated : item)))
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleRenameTemplate(templateId, newName) {
    try {
      const updated = await templatesService.update(templateId, { name: newName })
      setTemplates((prev) => prev.map((item) => (item.id === templateId ? updated : item)))
    } catch (error) {
      showApiError(error)
    }
  }

  async function handleDeleteTemplate(templateId) {
    try {
      await templatesService.remove(templateId)
      setTemplates((prev) => prev.filter((item) => item.id !== templateId))
    } catch (error) {
      showApiError(error)
    }
  }

  function clearGeneratingState() {
    setIsThinking(false)
    setThinkingConvId(null)
    streamingAssistantIdRef.current = null
    streamAbortRef.current = null
  }

  async function sendMessageStream(convId, content) {
    const controller = new AbortController()
    streamAbortRef.current = controller

    await messagesService.stream(
      convId,
      { content, modelId: selectedModel },
      {
        onMessageCreated: ({ userMessage, assistantMessage }) => {
          streamingAssistantIdRef.current = assistantMessage.id
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c
              const msgs = [
                ...(c.messages || []),
                userMessage,
                {
                  ...assistantMessage,
                  content: assistantMessage.content ?? "",
                  status: assistantMessage.status ?? "running",
                },
              ]
              return {
                ...c,
                messages: msgs,
                updatedAt: userMessage.createdAt,
                messageCount: msgs.length,
                preview: content.slice(0, 80),
              }
            }),
          )
        },
        onMessageDelta: ({ messageId, delta }) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c
              const msgs = (c.messages || []).map((m) =>
                m.id === messageId ? { ...m, content: `${m.content || ""}${delta}` } : m,
              )
              return { ...c, messages: msgs }
            }),
          )
        },
        onRetrievalCompleted: ({ messageId, citations }) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c
              const msgs = (c.messages || []).map((m) =>
                m.id === messageId ? { ...m, citations: citations ?? m.citations } : m,
              )
              return { ...c, messages: msgs }
            }),
          )
        },
        onMessageCompleted: ({ messageId, content, status }) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c
              const msgs = (c.messages || []).map((m) =>
                m.id === messageId
                  ? { ...m, content: content ?? m.content, status: status ?? "completed" }
                  : m,
              )
              const last = msgs[msgs.length - 1]
              return {
                ...c,
                messages: msgs,
                updatedAt: new Date().toISOString(),
                preview: (last?.content || content || c.preview || "").slice(0, 80),
              }
            }),
          )
        },
        onMessageFailed: ({ messageId, error }) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c
              const msgs = (c.messages || []).map((m) =>
                m.id === messageId
                  ? {
                      ...m,
                      status: "failed",
                      error: error?.message || error?.code || t("messageGenerationFailed"),
                    }
                  : m,
              )
              return { ...c, messages: msgs }
            }),
          )
        },
        onDone: () => {},
      },
      controller.signal,
    )
  }

  async function sendMessageNonStream(convId, content) {
    const result = await messagesService.send(convId, { content, modelId: selectedModel })
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), result.userMessage, result.assistantMessage]
        return {
          ...c,
          messages: msgs,
          updatedAt: result.assistantMessage.createdAt,
          messageCount: msgs.length,
          preview: (result.assistantMessage.content || content).slice(0, 80),
        }
      }),
    )
    clearGeneratingState()
  }

  async function sendMessage(convId, content) {
    if (!content.trim() || !selectedModel) return

    setIsThinking(true)
    setThinkingConvId(convId)

    try {
      if (messagesService.isStreamEnabled()) {
        await sendMessageStream(convId, content)
        clearGeneratingState()
      } else {
        await sendMessageNonStream(convId, content)
      }
    } catch (error) {
      clearGeneratingState()
      if (error?.name === "AbortError") return
      showApiError(error)
      throw error
    }
  }

  function editMessage(convId, messageId, newContent) {
    const now = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = (c.messages || []).map((m) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m,
        )
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        }
      }),
    )
  }

  async function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    await sendMessage(convId, msg.content)
  }

  async function pauseThinking() {
    streamAbortRef.current?.abort()

    const convId = thinkingConvId
    const messageId = streamingAssistantIdRef.current

    if (!convId || !messageId) {
      clearGeneratingState()
      return
    }

    try {
      const result = await messagesService.cancel(convId, messageId)
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c
          const msgs = (c.messages || []).map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: result.content ?? m.content,
                  status: result.status || "cancelled",
                }
              : m,
          )
          return { ...c, messages: msgs }
        }),
      )
    } catch (error) {
      showApiError(error)
    } finally {
      clearGeneratingState()
    }
  }

  async function handleMessageFeedback(messageId, rating) {
    try {
      await messagesService.feedback(messageId, { rating })
    } catch (error) {
      showApiError(error)
    }
  }

  function handleUseTemplate(template) {
    composerRef.current?.insertTemplate(template.content)
  }

  const selected = conversations.find((c) => c.id === selectedId) || null

  if (!mounted) {
    return (
      <div className="apple-surface flex h-dvh w-full items-center justify-center text-gray-900 dark:text-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--fi-primary)]"></div>
      </div>
    )
  }

  return (
    <div className="apple-surface flex h-dvh w-full flex-col overflow-hidden text-gray-950 dark:text-slate-50">
      <div className="glass-panel z-40 m-2 flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="theme-focus-ring inline-flex items-center justify-center rounded-full p-2 hover:bg-white/55"
          aria-label={t("openSidebar")}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <img src="/brand/fidelity-mark.svg" alt="Fidelity" className="h-6 w-6" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostIconButton label="Schedule">
            <Calendar className="h-4 w-4" />
          </GhostIconButton>
          <Link
            href="/library"
            className={cls(
              "theme-focus-ring glass-pill hidden rounded-full p-2 transition hover:scale-[1.02] md:inline-flex dark:text-slate-200",
              isLibrary ? "bg-white/70 text-gray-900" : "text-gray-700",
            )}
            aria-label={t("knowledgeBaseSection")}
            title={t("knowledgeBaseSection")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Link>
          <GhostIconButton label="More">
            <MoreHorizontal className="h-4 w-4" />
          </GhostIconButton>
        </div>
      </div>

      <div className="flex min-h-0 w-full flex-1">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          sidebarCollapsed={sidebarCollapsed}
          setSidebarCollapsed={setSidebarCollapsed}
          conversations={conversations}
          libraryActive={isLibrary}
          onOpenLibrary={() => router.push("/library")}
          recent={recent}
          folders={folders}
          folderCounts={folderCounts}
          selectedId={selectedId}
          onSelect={handleSelectConversation}
          togglePin={togglePin}
          onRenameConversation={handleRenameConversation}
          onDeleteConversation={handleDeleteConversation}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          createNewChat={createNewChat}
          templates={templates}
          onCreateTemplate={handleCreateTemplate}
          onUpdateTemplate={handleUpdateTemplate}
          onRenameTemplate={handleRenameTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onUseTemplate={handleUseTemplate}
        />

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isLibraryList ? (
            <LibraryPage embedded />
          ) : isLibraryCreate ? (
            <KnowledgeBaseCreatePage embedded />
          ) : isLibraryImport ? (
            <KnowledgeBaseImportPage embedded />
          ) : isLibraryFileDetail ? (
            <KnowledgeBaseFileDetailPage embedded />
          ) : isLibraryDetail ? (
            <KnowledgeBaseDetailPage embedded />
          ) : (
            <ChatPane
              ref={composerRef}
              conversation={selected}
              models={models}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onSend={(content) => selected && sendMessage(selected.id, content)}
              onEditMessage={(messageId, newContent) =>
                selected && editMessage(selected.id, messageId, newContent)
              }
              onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
              onMessageFeedback={handleMessageFeedback}
              isThinking={isThinking && thinkingConvId === selected?.id}
              onPauseThinking={pauseThinking}
            />
          )}
        </main>
      </div>
    </div>
  )
}
