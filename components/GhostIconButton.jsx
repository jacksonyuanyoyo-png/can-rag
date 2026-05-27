import React from "react";

export default function GhostIconButton({ label, children }) {
  return (
    <button
      className="theme-focus-ring glass-pill hidden rounded-full p-2 text-slate-600 transition hover:scale-[1.02] md:inline-flex dark:text-slate-200"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}
