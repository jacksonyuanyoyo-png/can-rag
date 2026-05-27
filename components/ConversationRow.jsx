"use client"

import { useState, useRef, useEffect } from "react"
import { MoreHorizontal, Pin, Edit3, Trash2 } from "lucide-react"
import { cls } from "./utils"
import { useLocale } from "./LocaleProvider"
import { motion, AnimatePresence } from "framer-motion"

export default function ConversationRow({ data, active, onSelect, onTogglePin, onDelete, onRename, showMeta }) {
  const { t, formatTimeAgo } = useLocale()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const count = Array.isArray(data.messages) ? data.messages.length : data.messageCount

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

  const handlePin = (e) => {
    e.stopPropagation()
    onTogglePin?.()
    setShowMenu(false)
  }

  const handleRename = (e) => {
    e.stopPropagation()
    const newName = prompt(t("renameChatPrompt", { title: data.title }), data.title)
    if (newName && newName.trim() && newName !== data.title) {
      onRename?.(data.id, newName.trim())
    }
    setShowMenu(false)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm(t("deleteChatConfirm", { title: data.title }))) {
      onDelete?.(data.id)
    }
    setShowMenu(false)
  }

  return (
    <div className="group relative">
      <div
        className={cls(
          "flex w-full items-center gap-1 rounded-2xl px-4 py-2 transition",
          active
            ? "bg-[#eef0ff] text-[var(--fi-primary)] shadow-sm"
            : "hover:bg-white/70",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
          title={data.title}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {data.pinned && <Pin className="h-3 w-3 shrink-0 text-slate-500" />}
              <span className="truncate text-sm font-medium tracking-tight">{data.title}</span>
              <span className="shrink-0 text-[11px] text-slate-500">{formatTimeAgo(data.updatedAt)}</span>
            </div>
            {showMeta && (
              <div className="mt-0.5 text-[11px] text-slate-500">{t("messagesCount", { count })}</div>
            )}
          </div>
        </button>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="rounded-full p-1 text-zinc-500 opacity-0 transition group-hover:opacity-100 hover:bg-white"
            aria-label={t("chatOptions")}
          >
            <MoreHorizontal className="h-4 w-4" />
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
                  onClick={handlePin}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/55 dark:hover:bg-white/10"
                >
                  <Pin className="h-3 w-3" />
                  {data.pinned ? t("unpin") : t("pin")}
                </button>
                <button
                  type="button"
                  onClick={handleRename}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/55 dark:hover:bg-white/10"
                >
                  <Edit3 className="h-3 w-3" />
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

      <div className="pointer-events-none absolute left-[calc(100%+6px)] top-1 hidden w-64 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-zinc-700 shadow-md md:group-hover:block">
        <div className="line-clamp-6 whitespace-pre-wrap">{data.preview}</div>
      </div>
    </div>
  )
}
