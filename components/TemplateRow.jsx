"use client"

import { useState, useRef, useEffect } from "react"
import { FileText, MoreHorizontal, Copy, Edit3, Trash2 } from "lucide-react"
import { useLocale } from "./LocaleProvider"
import { motion, AnimatePresence } from "framer-motion"

export default function TemplateRow({ template, onUseTemplate, onEditTemplate, onRenameTemplate, onDeleteTemplate }) {
  const { t } = useLocale()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showMenu])

  const handleUse = () => {
    onUseTemplate?.(template)
    setShowMenu(false)
  }

  const handleEdit = () => {
    onEditTemplate?.(template)
    setShowMenu(false)
  }

  const handleRename = () => {
    const newName = prompt(t("renameTemplatePrompt", { name: template.name }), template.name)
    if (newName && newName.trim() && newName !== template.name) {
      onRenameTemplate?.(template.id, newName.trim())
    }
    setShowMenu(false)
  }

  const handleDelete = () => {
    if (confirm(t("deleteTemplateConfirm", { name: template.name }))) {
      onDeleteTemplate?.(template.id)
    }
    setShowMenu(false)
  }

  return (
    <div className="group">
      <div className="flex w-full items-center justify-between rounded-2xl px-4 py-2 text-sm transition hover:bg-white/55 dark:hover:bg-white/10">
        <button
          type="button"
          onClick={handleUse}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          title={t("useTemplateTitle", { snippet: template.snippet })}
        >
          <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{template.name}</div>
            <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{template.snippet}</div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <span className="hidden px-1 text-xs text-zinc-500 group-hover:inline dark:text-zinc-400">{t("useLabel")}</span>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
              className="rounded-full p-1 opacity-0 transition-opacity hover:bg-white/70 group-hover:opacity-100 dark:hover:bg-white/10"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel absolute right-0 top-full z-[100] mt-1 w-36 overflow-hidden rounded-2xl py-1"
                >
                  <button
                    type="button"
                    onClick={handleUse}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/55 dark:hover:bg-white/10"
                  >
                    <Copy className="h-3 w-3" />
                    {t("useTemplate")}
                  </button>
                  <button
                    type="button"
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/55 dark:hover:bg-white/10"
                  >
                    <Edit3 className="h-3 w-3" />
                    {t("editTemplate")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRename}
                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-white/55 dark:hover:bg-white/10"
                  >
                    {t("rename")}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 hover:bg-white/55 dark:hover:bg-white/10"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("delete")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
