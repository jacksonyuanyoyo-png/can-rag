import React, { useEffect, useState } from "react";
import { Sun, Moon } from "./icons/FidelityIcons";

export default function ThemeToggle({ theme, setTheme }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="glass-pill inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <span className="h-4 w-4" />
        <span className="hidden sm:inline">主题</span>
      </button>
    );
  }

  return (
    <button
      className="glass-pill inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
      onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === "dark" ? "浅色" : "深色"}</span>
    </button>
  );
}
