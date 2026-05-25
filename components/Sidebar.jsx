"use client"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Clock, Folder, FileText } from "lucide-react"
import {
  SidebarCollapse,
  SidebarExpand,
  SearchIcon,
  Plus,
  FolderIcon,
  Settings,
  PanelLeftClose,
} from "./icons/FidelityIcons"
import SidebarSection from "./SidebarSection"
import ConversationRow from "./ConversationRow"
import FolderRow from "./FolderRow"
import TemplateRow from "./TemplateRow"
import FidelityLogo from "./FidelityLogo"
import CreateFolderModal from "./CreateFolderModal"
import CreateTemplateModal from "./CreateTemplateModal"
import SearchModal from "./SearchModal"
import SettingsPopover from "./SettingsPopover"
import { useLocale } from "./LocaleProvider"
import { cls } from "./utils"
import { useState } from "react"

export default function Sidebar({
  open,
  onClose,
  collapsed,
  setCollapsed,
  conversations,
  recent,
  libraryActive = false,
  onOpenLibrary = () => {},
  folders,
  folderCounts,
  selectedId,
  onSelect,
  togglePin,
  query,
  setQuery,
  searchRef,
  createFolder,
  createNewChat,
  templates = [],
  setTemplates = () => {},
  onUseTemplate = () => {},
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
}) {
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const { t } = useLocale()

  const handleSearchClick = () => {
    setShowSearchModal(true)
  }

  const handleNewChatClick = () => {
    createNewChat()
  }

  const handleFoldersClick = () => {
    // Expand sidebar and open folders section
    setSidebarCollapsed(false)
    setCollapsed((s) => ({ ...s, folders: false }))
  }

  const getConversationsByFolder = (folderName) => {
    return conversations.filter((conv) => conv.folder === folderName)
  }

  const handleCreateFolder = (folderName) => {
    createFolder(folderName)
  }

  const handleDeleteFolder = (folderName) => {
    const updatedConversations = conversations.map((conv) =>
      conv.folder === folderName ? { ...conv, folder: null } : conv,
    )
    console.log("Delete folder:", folderName, "Updated conversations:", updatedConversations)
  }

  const handleRenameFolder = (oldName, newName) => {
    const updatedConversations = conversations.map((conv) =>
      conv.folder === oldName ? { ...conv, folder: newName } : conv,
    )
    console.log("Rename folder:", oldName, "to", newName, "Updated conversations:", updatedConversations)
  }

  const handleCreateTemplate = (templateData) => {
    if (editingTemplate) {
      const updatedTemplates = templates.map((t) =>
        t.id === editingTemplate.id ? { ...templateData, id: editingTemplate.id } : t,
      )
      setTemplates(updatedTemplates)
      setEditingTemplate(null)
    } else {
      const newTemplate = {
        ...templateData,
        id: Date.now().toString(),
      }
      setTemplates([...templates, newTemplate])
    }
    setShowCreateTemplateModal(false)
  }

  const handleEditTemplate = (template) => {
    setEditingTemplate(template)
    setShowCreateTemplateModal(true)
  }

  const handleRenameTemplate = (templateId, newName) => {
    const updatedTemplates = templates.map((t) =>
      t.id === templateId ? { ...t, name: newName, updatedAt: new Date().toISOString() } : t,
    )
    setTemplates(updatedTemplates)
  }

  const handleDeleteTemplate = (templateId) => {
    const updatedTemplates = templates.filter((t) => t.id !== templateId)
    setTemplates(updatedTemplates)
  }

  const handleUseTemplate = (template) => {
    onUseTemplate(template)
  }

  if (sidebarCollapsed) {
    return (
      <>
      <motion.aside
        initial={{ width: 320 }}
        animate={{ width: 64 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="glass-panel z-50 m-3 mr-0 flex h-[calc(100%-1.5rem)] min-h-0 shrink-0 flex-col overflow-hidden rounded-3xl"
      >
        <div className="flex items-center justify-center border-b border-white/45 px-3 py-3 dark:border-white/10">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="rounded-full p-2 hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-white/10"
            aria-label={t("expandSidebar")}
            title={t("expandSidebar")}
          >
            <SidebarExpand className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 pt-4">
          <button
            onClick={handleNewChatClick}
            className="rounded-full p-2.5 transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-white/10"
            title={t("newChat")}
          >
            <Plus className="h-5 w-5" />
          </button>

          <button
            onClick={handleSearchClick}
            className="rounded-full p-2.5 transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-white/10"
            title={t("searchChats")}
          >
            <SearchIcon className="h-5 w-5" />
          </button>

          <button
            onClick={onOpenLibrary}
            className={cls(
              "rounded-full p-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
              libraryActive
                ? "bg-white/70 dark:bg-white/15"
                : "hover:bg-white/55 dark:hover:bg-white/10",
            )}
            title={t("knowledgeBaseSection")}
          >
            <BookOpen className="h-5 w-5" />
          </button>

          <button
            onClick={handleFoldersClick}
            className="rounded-full p-2.5 transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-white/10"
            title={t("folders")}
          >
            <FolderIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-auto flex flex-col items-center gap-2 pb-4">
          <SettingsPopover>
            <button
              className="rounded-full p-2.5 transition-colors hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:bg-white/10"
              title={t("settings")}
            >
              <Settings className="h-5 w-5" />
            </button>
          </SettingsPopover>
        </div>
      </motion.aside>

        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          conversations={conversations}
          selectedId={selectedId}
          onSelect={onSelect}
          togglePin={togglePin}
          createNewChat={createNewChat}
        />
      </>
    )
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {true && (
          <motion.aside
            key="sidebar"
            initial={{ x: -340 }}
            animate={{ x: open ? 0 : 0 }}
            exit={{ x: -340 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className={cls(
              "glass-panel z-50 flex h-[calc(100%-1.5rem)] min-h-0 w-80 shrink-0 flex-col overflow-hidden rounded-3xl",
              "fixed inset-y-3 left-3 md:static md:m-3 md:mr-0 md:translate-x-0",
            )}
          >
            <div className="flex items-center gap-2 border-b border-white/45 px-3 py-3 dark:border-white/10">
              <FidelityLogo variant="full" className="h-9 w-auto sm:h-10" alt="Fidelity International" />
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="hidden rounded-full p-2 text-zinc-600 transition-colors hover:bg-white/55 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:block dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
                  aria-label={t("collapseSidebar")}
                  title={t("collapseSidebar")}
                >
                  <SidebarCollapse className="h-5 w-5" />
                </button>

                <button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden dark:hover:bg-white/10"
                  aria-label={t("closeSidebar")}
                >
                  <PanelLeftClose className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="px-3 pt-3">
              <label htmlFor="search" className="sr-only">
                {t("searchConversations")}
              </label>
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="search"
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  onClick={() => setShowSearchModal(true)}
                  onFocus={() => setShowSearchModal(true)}
                  className="w-full rounded-2xl border border-white/55 bg-white/55 py-2 pl-9 pr-3 text-sm outline-none ring-0 placeholder:text-gray-400 shadow-inner backdrop-blur-xl focus:border-white/80 focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-white/10 dark:text-slate-50 dark:focus:ring-white/15"
                />
              </div>
            </div>

            <div className="px-3 pt-3">
              <button
                onClick={createNewChat}
                className="flex w-full items-center justify-start gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:scale-[1.01] hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                title={t("newChatShortcut")}
              >
                <Plus className="h-4 w-4 shrink-0" /> {t("newChat")}
              </button>
            </div>

            <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4">
              <button
                type="button"
                onClick={onOpenLibrary}
                className={cls(
                  "sticky top-0 z-10 mb-1 flex w-full items-center justify-start gap-2 rounded-2xl border-y border-transparent px-4 py-2 text-left text-sm font-medium backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",
                  libraryActive
                    ? "bg-white/60 text-zinc-900 dark:bg-white/10 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
                aria-current={libraryActive ? "page" : undefined}
              >
                <BookOpen className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                {t("knowledgeBaseSection")}
              </button>

              <SidebarSection
                icon={<Clock className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />}
                title={t("recentSection")}
                collapsed={collapsed.recent}
                onToggle={() => setCollapsed((s) => ({ ...s, recent: !s.recent }))}
              >
                {recent.length === 0 ? (
                  <div className="select-none rounded-lg border border-dashed border-gray-300 px-4 py-3 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
                    {t("recentEmpty")}
                  </div>
                ) : (
                  recent.map((c) => (
                    <ConversationRow
                      key={c.id}
                      data={c}
                      active={!libraryActive && c.id === selectedId}
                      onSelect={() => onSelect(c.id)}
                      onTogglePin={() => togglePin(c.id)}
                      showMeta
                    />
                  ))
                )}
              </SidebarSection>

              <SidebarSection
                icon={<Folder className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />}
                title={t("foldersSection")}
                collapsed={collapsed.folders}
                onToggle={() => setCollapsed((s) => ({ ...s, folders: !s.folders }))}
              >
                <>
                  <button
                    type="button"
                    onClick={() => setShowCreateFolderModal(true)}
                    className="mb-2 inline-flex w-full items-center justify-start gap-2 rounded-2xl px-4 py-2 text-left text-sm text-gray-600 transition hover:bg-white/55 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 shrink-0" /> {t("createFolder")}
                  </button>

                  {folders.map((f) => (
                    <FolderRow
                      key={f.id}
                      name={f.name}
                      count={folderCounts[f.name] || 0}
                      conversations={getConversationsByFolder(f.name)}
                      selectedId={selectedId}
                      libraryActive={libraryActive}
                      onSelect={onSelect}
                      togglePin={togglePin}
                      onDeleteFolder={handleDeleteFolder}
                      onRenameFolder={handleRenameFolder}
                    />
                  ))}
                </>
              </SidebarSection>

              <SidebarSection
                icon={<FileText className="h-4 w-4 shrink-0 opacity-70" strokeWidth={2} aria-hidden />}
                title={t("templatesSection")}
                collapsed={collapsed.templates}
                onToggle={() => setCollapsed((s) => ({ ...s, templates: !s.templates }))}
              >
                <>
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplateModal(true)}
                    className="mb-2 inline-flex w-full items-center justify-start gap-2 rounded-2xl px-4 py-2 text-left text-sm text-gray-600 transition hover:bg-white/55 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4 shrink-0" /> {t("createTemplate")}
                  </button>

                  {(Array.isArray(templates) ? templates : []).map((template) => (
                    <TemplateRow
                      key={template.id}
                      template={template}
                      onUseTemplate={handleUseTemplate}
                      onEditTemplate={handleEditTemplate}
                      onRenameTemplate={handleRenameTemplate}
                      onDeleteTemplate={handleDeleteTemplate}
                    />
                  ))}

                  {(!templates || templates.length === 0) && (
                    <div className="select-none rounded-lg border border-dashed border-gray-300 px-4 py-3 text-center text-xs text-gray-500 dark:border-slate-700 dark:text-slate-400">
                      {t("templatesEmpty")}
                    </div>
                  )}
                </>
              </SidebarSection>
            </nav>

            <div className="mt-auto shrink-0 border-t border-white/45 px-3 py-3 dark:border-white/10">
              <SettingsPopover>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-2xl bg-white/45 p-2 text-left shadow-inner transition-colors hover:bg-white/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-white/10 dark:hover:bg-white/15"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1D1D1B] text-xs font-semibold text-white">
                    FI
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{t("userName")}</div>
                    <div className="truncate text-xs text-gray-500 dark:text-slate-400">{t("workspace")}</div>
                  </div>
                  <Settings className="h-4 w-4 shrink-0 text-zinc-400" />
                </button>
              </SettingsPopover>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateFolder={handleCreateFolder}
      />

      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => {
          setShowCreateTemplateModal(false)
          setEditingTemplate(null)
        }}
        onCreateTemplate={handleCreateTemplate}
        editingTemplate={editingTemplate}
      />

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        selectedId={selectedId}
        onSelect={onSelect}
        togglePin={togglePin}
        createNewChat={createNewChat}
      />
    </>
  )
}
