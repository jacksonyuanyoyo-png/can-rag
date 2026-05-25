import React from "react";

export default function GhostIconButton({ label, children }) {
  return (
    <button
      className="glass-pill hidden rounded-full p-2 text-gray-700 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:inline-flex dark:text-slate-200"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
