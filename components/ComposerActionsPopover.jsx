"use client"

import { useState, useMemo } from "react"
import { Paperclip, Bot, Search, Palette, BookOpen, MoreHorizontal, Globe, ChevronRight } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { useLocale } from "./LocaleProvider"

export default function ComposerActionsPopover({ children }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const mainActions = useMemo(
    () => [
      { icon: Paperclip, labelKey: "addPhotosFiles", action: () => {} },
      { icon: Bot, labelKey: "agentMode", badgeKey: "newBadge", action: () => {} },
      { icon: Search, labelKey: "deepResearch", action: () => {} },
      { icon: Palette, labelKey: "createImage", action: () => {} },
      { icon: BookOpen, labelKey: "studyLearn", action: () => {} },
    ],
    [],
  )

  const moreActions = useMemo(
    () => [
      { icon: Globe, labelKey: "webSearch", action: () => {} },
      { icon: Palette, labelKey: "canvas", action: () => {} },
      {
        icon: () => (
          <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-[var(--fi-primary)] via-cyan-400 to-amber-300">
            <div className="h-2.5 w-2.5 rounded-sm bg-white" />
          </div>
        ),
        isCustomIcon: true,
        labelKey: "connectGoogleDrive",
        action: () => {},
      },
      {
        icon: () => (
          <div className="flex h-5 w-5 items-center justify-center rounded bg-[var(--fi-primary)]">
            <div className="h-2.5 w-2.5 rounded-sm bg-white" />
          </div>
        ),
        isCustomIcon: true,
        labelKey: "connectOneDrive",
        action: () => {},
      },
      {
        icon: () => (
          <div className="flex h-5 w-5 items-center justify-center rounded bg-teal-500">
            <div className="h-2.5 w-2.5 rounded-sm bg-white" />
          </div>
        ),
        isCustomIcon: true,
        labelKey: "connectSharepoint",
        action: () => {},
      },
    ],
    [],
  )

  const handleAction = (action) => {
    action()
    setOpen(false)
    setShowMore(false)
  }

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen)
    if (!newOpen) setShowMore(false)
  }

  const renderActionList = (actions, onMoreClick, moreActive = false) => (
    <div className="space-y-0.5">
      {actions.map((action, index) => {
        const IconComponent = action.icon
        return (
          <button
            key={index}
            type="button"
            onClick={() => handleAction(action.action)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {action.isCustomIcon ? (
              <IconComponent />
            ) : (
              <IconComponent className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
            )}
            <span>{t(action.labelKey)}</span>
            {action.badgeKey && (
              <span className="ml-auto rounded-full bg-[color:color-mix(in_srgb,var(--fi-primary)_14%,white)] px-2 py-0.5 text-xs font-medium text-[var(--fi-primary)] dark:bg-[color:color-mix(in_srgb,var(--fi-primary)_25%,transparent)] dark:text-slate-200">
                {t(action.badgeKey)}
              </span>
            )}
          </button>
        )
      })}
      <div className="my-1 border-t border-zinc-200 dark:border-zinc-700" />
      <button
        type="button"
        onClick={onMoreClick}
        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 ${moreActive ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
      >
        <MoreHorizontal className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
        <span>{t("more")}</span>
        <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
      </button>
    </div>
  )

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side="top">
        {!showMore ? (
          <div className="min-w-[220px] p-2">{renderActionList(mainActions, () => setShowMore(true))}</div>
        ) : (
          <div className="flex min-w-[440px]">
            <div className="flex-1 border-r border-zinc-200 p-2 dark:border-zinc-700">
              {renderActionList(mainActions, () => setShowMore(false), true)}
            </div>
            <div className="flex-1 p-2">
              <div className="space-y-0.5">
                {moreActions.map((action, index) => {
                  const IconComponent = action.icon
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAction(action.action)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {action.isCustomIcon ? (
                        <IconComponent />
                      ) : (
                        <IconComponent className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                      )}
                      <span>{t(action.labelKey)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
