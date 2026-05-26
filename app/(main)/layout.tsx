"use client"

import AIAssistantUI from "../../components/AIAssistantUI"
import { LocaleProvider } from "../../components/LocaleProvider"

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AIAssistantUI />
      {children}
    </LocaleProvider>
  )
}
