"use client"

import { useState } from "react"
import { Globe, HelpCircle, LogOut, Settings, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useLocale } from "./LocaleProvider"
import { LOCALES } from "../lib/locale"
import { cls } from "./utils"

const USER = { initials: "FI" }

export default function SettingsPopover({ children }) {
  const [open, setOpen] = useState(false)
  const { locale, setLocale, t } = useLocale()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        className="z-[200] w-72 p-0"
        align="start"
        side="top"
        sideOffset={8}
        collisionPadding={16}
      >
        <div className="p-3">
          <div className="mb-3 flex items-center gap-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#1D1D1B] text-sm font-semibold text-white">
              {USER.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{t("userName")}</div>
              <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">{t("workspace")}</div>
            </div>
          </div>

          <div className="space-y-0.5">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="h-4 w-4 shrink-0 text-zinc-500" />
              <span>{t("settings")}</span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <HelpCircle className="h-4 w-4 shrink-0 text-zinc-500" />
              <span>{t("getHelp")}</span>
            </button>
          </div>

          <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />

          <div className="mb-1 flex items-center gap-2 px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
            <Globe className="h-3.5 w-3.5 shrink-0" />
            {t("language")}
          </div>
          <div className="flex gap-1.5">
            {LOCALES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLocale(item.id)}
                className={cls(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm transition-colors",
                  locale === item.id
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                )}
              >
                <span className="truncate">{item.label}</span>
                {locale === item.id && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            ))}
          </div>

          <div className="my-3 border-t border-zinc-200 dark:border-zinc-700" />

          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-800"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{t("logOut")}</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
