"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Shield, Send, Loader2, User, HelpCircle, Database, AlertTriangle, Scale, Map } from "lucide-react"
import { useEffect, useRef } from "react"
import Link from "next/link"
import { useGlobalChat } from "./chat-provider"
import VapiWidget from "@/components/vapi-widget"

const QUICK_PROMPTS = [
  "What are my rights during an ICE encounter?",
  "Do I have to show my documents?",
  "What if ICE comes to my home?",
  "Can I remain silent?",
  "How do I find a lawyer?",
]

// Simple function to extract sources from message content
function extractSources(content: string): { cleanContent: string; sources: string[] } {
  const sourceMatch = content.match(/\[SOURCES:(.*?)\]/)
  if (sourceMatch) {
    const sources = sourceMatch[1] ? sourceMatch[1].split(",").filter(Boolean) : []
    const cleanContent = content.replace(/\[SOURCES:.*?\]/, "").trim()
    return { cleanContent, sources }
  }
  return { cleanContent: content, sources: [] }
}

export default function ImmigrationChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, ragStatus, setRagStatus } =
    useGlobalChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Set initial status when first message is sent
  useEffect(() => {
    if (messages.length > 0 && ragStatus === "checking") {
      setRagStatus("enabled")
    }
  }, [messages.length, ragStatus, setRagStatus])

  const handleQuickPrompt = async (promptText: string) => {
    console.log("Quick prompt clicked:", promptText)
    setRagStatus("checking")
    await append({
      role: "user",
      content: promptText,
    })
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Form submitted with input:", input)
    if (input.trim()) {
      setRagStatus("checking")
    }
    handleSubmit(e)
  }

  const handleContactLawyer = () => {
    window.open("https://www.immigrationadvocates.org/nonprofit/legaldirectory/", "_blank")
  }

  const getRagStatusDisplay = () => {
    switch (ragStatus) {
      case "enabled":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <Database className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-700 font-medium">RAG Enabled</span>
          </div>
        )
      case "fallback":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <span className="text-xs text-yellow-700 font-medium">Fallback Mode</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <Database className="h-3 w-3 text-gray-600" />
            <span className="text-xs text-gray-700 font-medium">Ready</span>
          </div>
        )
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold text-gray-900">Immigration Rights Assistant</h1>
            {getRagStatusDisplay()}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/map">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Map className="h-4 w-4" />
                ICE Raids Map
              </Button>
            </Link>
            <Link href="/faq">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </Button>
            </Link>
            <Link href="/translate-legal">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Translate Legal
              </Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-3xl mx-auto flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto mb-6 text-blue-600" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Know Your Immigration Rights</h2>
                <p className="text-gray-600 mb-4 max-w-md mx-auto">
                  Get reliable information about your rights when encountering immigration authorities.
                </p>
                <p className="text-sm text-green-600 mb-8 flex items-center justify-center gap-2">
                  <Database className="h-4 w-4" />
                  Enhanced with specialized immigration knowledge base
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl mx-auto">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      disabled={isLoading}
                      className="text-sm hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const { cleanContent, sources } = extractSources(message.content)

              return (
                <div key={message.id} className="mb-6">
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-start gap-3 max-w-[80%]">
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`rounded-2xl px-4 py-3 ${
                            message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          <div className="whitespace-pre-wrap leading-relaxed">{cleanContent}</div>
                        </div>
                        {/* Sources or Contact Lawyer Button - only show when message has sources marker */}
                        {message.role === "assistant" && message.content.includes("[SOURCES:") && (
                          <div className="mt-2">
                            {sources.length > 0 && !sources.includes("fallback-kb") ? (
                              <div className="flex flex-wrap gap-1">
                                {sources.map((source, index) => (
                                  <span
                                    key={index}
                                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                                  >
                                    {source}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleContactLawyer}
                                className="flex items-center gap-2 text-orange-700 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                              >
                                <Scale className="h-3 w-3" />
                                <span className="text-xs">Information not verified - Contact a lawyer</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="h-4 w-4 text-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="mb-6">
                <div className="flex justify-start">
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                        <span className="text-gray-600">
                          {ragStatus === "enabled" ? "Searching knowledge base..." : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-2">
            <form onSubmit={onSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask about your immigration rights..."
                className="flex-1 border-0 focus-visible:ring-0 text-base"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()} size="sm" className="px-3">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </Card>

          <p className="text-xs text-gray-500 text-center mt-2">
            This provides general information only. Consult an immigration attorney for legal advice.
          </p>
        </div>
      </div>

      {/* Vapi Voice Widget */}
      {process.env.NEXT_PUBLIC_VAPI_API_KEY && process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID && (
        <VapiWidget
          apiKey={process.env.NEXT_PUBLIC_VAPI_API_KEY}
          assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}
        />
      )}
    </div>
  )
}
