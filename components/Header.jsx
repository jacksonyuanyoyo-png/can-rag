"use client"
import { MoreHorizontal, Menu } from "./icons/FidelityIcons"
import GhostIconButton from "./GhostIconButton"

export default function Header({ sidebarCollapsed, setSidebarOpen }) {
  return (
    <div className="z-30 m-3 mb-0 flex shrink-0 items-center gap-2 rounded-3xl border border-white/60 bg-white/45 px-4 py-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/35">
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center rounded-full p-2 hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden dark:hover:bg-white/10"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        <GhostIconButton label="More">
          <MoreHorizontal className="h-4 w-4" />
        </GhostIconButton>
      </div>
    </div>
  )
}
