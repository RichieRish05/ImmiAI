"use client"

import type React from "react"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useChat } from "@ai-sdk/react"

interface ChatContextType {
  messages: any[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  append: (message: { role: string; content: string }) => Promise<void>
  ragStatus: "checking" | "enabled" | "fallback"
  setRagStatus: (status: "checking" | "enabled" | "fallback") => void
  setInput: (input: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [ragStatus, setRagStatus] = useState<"checking" | "enabled" | "fallback">("checking")

  const chatProps = useChat({
    api: "/api/chat",
    onError: (error) => {
      console.error("Chat error:", error)
      setRagStatus("fallback")
    },
    onResponse: (response) => {
      console.log("Chat response:", response)
      setRagStatus("enabled")
    },
    onFinish: (message) => {
      console.log("Chat finished:", message)
      // Check if the response indicates RAG was used
      if (message.content.includes("knowledge base") || message.content.includes("context")) {
        setRagStatus("enabled")
      }
    },
    experimental_attachments: true, // Enable attachment support
  })

  return <ChatContext.Provider value={{ ...chatProps, ragStatus, setRagStatus }}>{children}</ChatContext.Provider>
}

export function useGlobalChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error("useGlobalChat must be used within a ChatProvider")
  }
  return context
}
