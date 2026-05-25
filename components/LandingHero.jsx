"use client"

import { useState, useEffect, useRef } from "react"
import { AnimatePresence, motion } from "framer-motion"
import FidelityLogo from "./FidelityLogo"
import Composer from "./Composer"
import { useTypewriter, TypewriterLine } from "./TypewriterText"
import { useLocale } from "./LocaleProvider"

export default function LandingHero({ composerRef, selectedModel, onModelChange, onSend, busy, setBusy }) {
  const { t, locale } = useLocale()
  const [titleDone, setTitleDone] = useState(false)
  const [subtitleDone, setSubtitleDone] = useState(false)
  const [skipAnimation, setSkipAnimation] = useState(false)
  const previousLocale = useRef(locale)

  const titleText = t("landingTitle")
  const subtitleText = t("landingSubtitle")

  useEffect(() => {
    if (previousLocale.current === locale) {
      return
    }
    previousLocale.current = locale
    setSkipAnimation(true)
    setTitleDone(true)
    setSubtitleDone(true)
  }, [locale])

  const animating = !skipAnimation

  const title = useTypewriter(titleText, {
    speed: 55,
    enabled: animating,
    complete: skipAnimation,
    resetKey: locale,
    onComplete: () => setTitleDone(true),
  })

  const subtitle = useTypewriter(subtitleText, {
    speed: 32,
    enabled: animating && titleDone,
    complete: skipAnimation,
    resetKey: locale,
    onComplete: () => setSubtitleDone(true),
  })

  const showComposer = skipAnimation || subtitleDone
  const typingTitle = animating && !title.done
  const typingSubtitle = animating && titleDone && !subtitle.done

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-[8vh] sm:px-8">
      <div className="flex w-full max-w-3xl items-center justify-center gap-3 sm:gap-4">
        <motion.div
          initial={skipAnimation ? false : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: skipAnimation ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <FidelityLogo variant="mark" className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" alt="Fidelity" />
        </motion.div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl md:text-5xl dark:text-white">
          <span className="inline-block min-h-[1.15em] text-left">
            <TypewriterLine text={titleText} displayed={title.displayed} typing={typingTitle} />
          </span>
        </h1>
      </div>

      <p className="mx-auto mt-3 flex min-h-[1.5rem] w-full max-w-xl justify-center text-sm leading-6 text-zinc-500 dark:text-slate-400">
        <span className="inline-block min-h-[1.5rem] text-left">
          <TypewriterLine text={subtitleText} displayed={subtitle.displayed} typing={typingSubtitle} />
        </span>
      </p>

      <AnimatePresence>
        {showComposer && (
          <motion.div
            key="landing-composer"
            className="mt-8 w-full"
            initial={skipAnimation ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: skipAnimation ? 0 : 0.25, ease: "easeOut" }}
          >
            <Composer
              ref={composerRef}
              landing
              landingReveal={animating}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              onSend={async (text) => {
                if (!text.trim()) return
                setBusy(true)
                await onSend?.(text)
                setBusy(false)
              }}
              busy={busy}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
