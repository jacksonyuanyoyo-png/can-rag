"use client"

import AIAssistantUI from "../../components/AIAssistantUI"
import { AuthGate } from "@/components/auth/AuthGate"

export default function MainAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AIAssistantUI />
      {children}
    </AuthGate>
  )
}
