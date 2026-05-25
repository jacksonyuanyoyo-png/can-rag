"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Calendar, LayoutGrid, MoreHorizontal } from "lucide-react"
import Sidebar from "./Sidebar"
import ChatPane from "./ChatPane"
import LibraryPage from "./LibraryPage"
import KnowledgeBaseDetailPage from "./KnowledgeBaseDetailPage"
import GhostIconButton from "./GhostIconButton"
import { Menu } from "./icons/FidelityIcons"
import { useLocale } from "./LocaleProvider"
import { INITIAL_CONVERSATIONS, INITIAL_TEMPLATES, INITIAL_FOLDERS } from "./mockData"
import { cls } from "./utils"

export default function AIAssistantUI() {
  const { t } = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const isLibraryList = pathname === "/library"
  const isLibraryDetail = /^\/library\/[^/]+$/.test(pathname ?? "")
  const isLibrary = isLibraryList || isLibraryDetail
  const [mounted, setMounted] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-5")

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

  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS)
  const [selectedId, setSelectedId] = useState(null)
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
  const [folders, setFolders] = useState(INITIAL_FOLDERS)

  const [query, setQuery] = useState("")
  const searchRef = useRef(null)

  const [isThinking, setIsThinking] = useState(false)
  const [thinkingConvId, setThinkingConvId] = useState(null)

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
  }, [sidebarOpen, conversations])

  useEffect(() => {
    if (!selectedId && conversations.length > 0 && !isLibraryList && !isLibraryDetail) {
      createNewChat()
    }
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    return conversations.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q))
  }, [conversations, query])

  const recent = filtered
    .filter((c) => !c.pinned)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 10)

  const folderCounts = React.useMemo(() => {
    const map = Object.fromEntries(folders.map((f) => [f.name, 0]))
    for (const c of conversations) if (map[c.folder] != null) map[c.folder] += 1
    return map
  }, [conversations, folders])

  function togglePin(id) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)))
  }

  function createNewChat() {
    if (isLibrary) router.push("/")
    const id = Math.random().toString(36).slice(2)
    const item = {
      id,
      title: t("newChatTitle"),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
      preview: t("newChatPreview"),
      pinned: false,
      folder: "Work Projects",
      messages: [], // Ensure messages array is empty for new chats
    }
    setConversations((prev) => [item, ...prev])
    setSelectedId(id)
    setSidebarOpen(false)
  }

  function createFolder() {
    const name = prompt(t("folderNamePrompt"))
    if (!name) return
    if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) return alert(t("folderExistsAlert"))
    setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }])
  }

  function sendMessage(convId, content) {
    if (!content.trim()) return
    const now = new Date().toISOString()
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user", content, createdAt: now }

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...(c.messages || []), userMsg]
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        }
      }),
    )

    setIsThinking(true)
    setThinkingConvId(convId)

    const currentConvId = convId
    setTimeout(() => {
      // Always clear thinking state and generate response for this specific conversation
      setIsThinking(false)
      setThinkingConvId(null)
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c
          const ack = t("assistantAck")
          const asstMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: ack,
            createdAt: new Date().toISOString(),
          }
          const msgs = [...(c.messages || []), asstMsg]
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: asstMsg.content.slice(0, 80),
          }
        }),
      )
    }, 2000)
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

  function resendMessage(convId, messageId) {
    const conv = conversations.find((c) => c.id === convId)
    const msg = conv?.messages?.find((m) => m.id === messageId)
    if (!msg) return
    sendMessage(convId, msg.content)
  }

  function pauseThinking() {
    setIsThinking(false)
    setThinkingConvId(null)
  }

  function handleUseTemplate(template) {
    // This will be passed down to the Composer component
    // The Composer will handle inserting the template content
    if (composerRef.current) {
      composerRef.current.insertTemplate(template.content)
    }
  }

  const composerRef = useRef(null)

  const selected = conversations.find((c) => c.id === selectedId) || null

  // Don't render layout until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="apple-surface flex h-dvh w-full items-center justify-center text-gray-900 dark:text-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="apple-surface flex h-dvh w-full flex-col overflow-hidden text-gray-950 dark:text-slate-50">
      <div className="glass-panel z-40 m-2 flex shrink-0 items-center gap-2 rounded-2xl px-3 py-2 md:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-full p-2 hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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
              "glass-pill hidden rounded-full p-2 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:inline-flex dark:text-slate-200",
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
          onSelect={(id) => {
            if (isLibrary) router.push("/")
            setSelectedId(id)
          }}
          togglePin={togglePin}
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          createFolder={createFolder}
          createNewChat={createNewChat}
          templates={templates}
          setTemplates={setTemplates}
          onUseTemplate={handleUseTemplate}
        />

        <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {isLibraryList ? (
            <LibraryPage embedded />
          ) : isLibraryDetail ? (
            <KnowledgeBaseDetailPage embedded />
          ) : (
            <ChatPane
              ref={composerRef}
              conversation={selected}
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              onSend={(content) => selected && sendMessage(selected.id, content)}
              onEditMessage={(messageId, newContent) =>
                selected && editMessage(selected.id, messageId, newContent)
              }
              onResendMessage={(messageId) => selected && resendMessage(selected.id, messageId)}
              isThinking={isThinking && thinkingConvId === selected?.id}
              onPauseThinking={pauseThinking}
            />
          )}
        </main>
      </div>
    </div>
  )
}
