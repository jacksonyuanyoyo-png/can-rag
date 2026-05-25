import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function SidebarSection({ icon, title, children, collapsed, onToggle }) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        className="sticky top-0 z-10 mb-1 flex w-full items-center justify-start gap-2 rounded-2xl border-y border-transparent px-4 py-2 text-left text-sm font-medium text-zinc-500 backdrop-blur-xl transition-colors hover:text-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:text-zinc-200"
        aria-expanded={!collapsed}
      >
        {icon}
        {title}
      </button>
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="space-y-0.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
