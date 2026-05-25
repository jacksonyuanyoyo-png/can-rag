"use client"

import { useEffect, useRef, useState } from "react"

export function useTypewriter(text, { speed = 45, enabled = true, complete = false, resetKey, onComplete } = {}) {
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    if (complete) {
      setIndex(text.length)
      setDone(true)
      return
    }

    if (!enabled) {
      setIndex(0)
      setDone(false)
      return
    }

    setIndex(0)
    setDone(false)

    if (!text.length) {
      setDone(true)
      onCompleteRef.current?.()
      return
    }

    let current = 0
    let timerId = 0

    const tick = () => {
      current += 1
      setIndex(current)
      if (current >= text.length) {
        setDone(true)
        onCompleteRef.current?.()
        return
      }
      timerId = window.setTimeout(tick, speed)
    }

    timerId = window.setTimeout(tick, speed)
    return () => window.clearTimeout(timerId)
  }, [text, speed, enabled, complete, resetKey])

  const displayed = complete ? text : enabled ? text.slice(0, index) : ""

  return { displayed, done: complete || done, index }
}

export function TypewriterCursor({ visible = true }) {
  if (!visible) return null
  return (
    <span
      className="ml-0.5 inline-block w-[2px] animate-pulse bg-current align-middle"
      style={{ height: "0.85em" }}
      aria-hidden
    />
  )
}

export function TypewriterLine({ text, displayed, typing }) {
  const remaining = typing ? text.slice(displayed.length) : ""

  return (
    <span className="inline-block text-left">
      <span aria-live="polite">{displayed}</span>
      <TypewriterCursor visible={typing} />
      {remaining ? <span className="select-none opacity-0" aria-hidden>{remaining}</span> : null}
    </span>
  )
}
