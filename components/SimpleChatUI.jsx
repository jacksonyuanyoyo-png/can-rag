"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Plus, Mic, ImageIcon, Edit3, Globe } from "./icons/FidelityIcons"

export default function SimpleChatUI() {
  const [mounted, setMounted] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { role: "user", content: input }])
      setInput("")
    }
  }

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-white">
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--fi-primary)]"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h1 className="text-3xl font-semibold text-gray-800">你在忙什么？</h1>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-sm rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-[var(--fi-primary)] text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-2xl">
          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <ImageIcon className="h-4 w-4" />
                生成图片
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Edit3 className="h-4 w-4" />
                撰写或编辑
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                <Globe className="h-4 w-4" />
                查找资料
              </button>
            </div>
          )}

          {/* Input Field */}
          <div className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 hover:border-gray-400 focus-within:border-[var(--fi-primary)] focus-within:ring-2 focus-within:ring-[color:color-mix(in_srgb,var(--fi-primary)_20%,transparent)]">
            <Plus className="h-5 w-5 text-gray-600" />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="有问题，尽管问"
              className="flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-500"
            />
            <button
              onClick={() => {}}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Voice input"
            >
              <Mic className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="rounded-full bg-gray-900 p-2 text-white hover:bg-gray-800 disabled:opacity-50"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
