"use client"

import AIAssistantUI from "../../../components/AIAssistantUI"
import { LocaleProvider } from "../../../components/LocaleProvider"

export default function Page() {
  return (
    <LocaleProvider>
      <AIAssistantUI />
    </LocaleProvider>
  )
}
