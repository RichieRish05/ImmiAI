"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Shield,
  Send,
  Loader2,
  User,
  HelpCircle,
  Database,
  AlertTriangle,
  Scale,
  Bot,
  Upload,
  X,
  Camera,
  Phone,
  Globe,
  MapPin,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useGlobalChat } from "./chat-provider"
import PanicMode from "@/components/panic-mode"
import { useLanguage } from "@/contexts/language-context"
import LanguageToggle from "@/components/language-toggle"

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

// Simple markdown processor for basic formatting
function processMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const currentIndex = 0
  let key = 0

  // Split by lines to handle line breaks
  const lines = text.split("\n")

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      parts.push(<br key={`br-${key++}`} />)
    }

    const lineIndex2 = 0

    // Process bold text (**text** or __text__)
    const boldRegex = /(\*\*|__)(.*?)\1/g
    let lastIndex = 0
    let match

    while ((match = boldRegex.exec(line)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        const beforeText = line.slice(lastIndex, match.index)
        if (beforeText) {
          parts.push(<span key={`text-${key++}`}>{beforeText}</span>)
        }
      }

      // Add bold text
      parts.push(<strong key={`bold-${key++}`}>{match[2]}</strong>)
      lastIndex = match.index + match[0].length
    }

    // Add remaining text after last match
    if (lastIndex < line.length) {
      const remainingText = line.slice(lastIndex)
      if (remainingText) {
        parts.push(<span key={`text-${key++}`}>{remainingText}</span>)
      }
    }
  })

  return parts
}

// Hook to detect mobile device
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

export default function ImmigrationChatbot() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, append, ragStatus, setRagStatus, setInput } =
    useGlobalChat()
  const { t } = useLanguage()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const isMobile = useIsMobile()
  const [mobileDebug, setMobileDebug] = useState<string[]>([])

  // Quick prompts using translations
  const QUICK_PROMPTS = [
    t("prompts.iceRights"),
    t("prompts.documents"),
    t("prompts.homeVisit"),
    t("prompts.remainSilent"),
    t("prompts.findLawyer"),
  ]

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

  // Single function to handle ALL file selections (both regular upload and camera)
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length !== files.length) {
      alert(t("error.imageOnly"))
    }

    if (imageFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...imageFiles])

      // Auto-fill text input with space if empty when image is uploaded
      if (!input.trim()) {
        setInput(" ")
      }
    }

    // Clear the input value so the same file can be selected again
    event.target.value = ""
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAttachmentClick = () => {
    fileInputRef.current?.click()
  }

  const handleCameraClick = () => {
    cameraInputRef.current?.click()
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    console.log("Form submitted with input:", input, "files:", selectedFiles.length)

    try {
      // Allow submission if there's text OR files
      if (!input.trim() && selectedFiles.length === 0) {
        return
      }

      // If we have files but no text, use a space to ensure submission works
      const messageContent = input.trim() || (selectedFiles.length > 0 ? " " : "")

      if (input.trim() || selectedFiles.length > 0) {
        setRagStatus("checking")
      }

      // Convert files to base64 with error handling and size limits
      const attachments = await Promise.all(
        selectedFiles.map(async (file, index) => {
          try {
            // Check file size (limit to 5MB to prevent crashes)
            if (file.size > 5 * 1024 * 1024) {
              throw new Error(
                t("error.fileSize", {
                  fileName: file.name,
                  size: Math.round(file.size / 1024 / 1024).toString(),
                }),
              )
            }

            // Compress image if it's too large
            let processedFile = file
            if (file.size > 1024 * 1024) {
              processedFile = await compressImage(file)
            }

            const base64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()

              reader.onload = () => {
                if (typeof reader.result === "string") {
                  resolve(reader.result)
                } else {
                  reject(new Error("Failed to read file as string"))
                }
              }

              reader.onerror = () => {
                reject(new Error(`Failed to read file: ${file.name}`))
              }

              reader.onabort = () => {
                reject(new Error(`File reading aborted: ${file.name}`))
              }

              // Add timeout for file reading
              setTimeout(() => {
                reject(new Error(`File reading timeout: ${file.name}`))
              }, 30000) // 30 second timeout

              reader.readAsDataURL(processedFile)
            })

            return {
              name: file.name,
              contentType: file.type,
              url: base64,
            }
          } catch (error) {
            throw error
          }
        }),
      )

      // Clear selected files
      setSelectedFiles([])

      // Submit with attachments - use messageContent (space if only images)
      const formEvent = { ...e, target: { ...e.target, elements: { ...e.target.elements } } }
      // Temporarily override the input value for submission
      const originalValue = input
      setInput(messageContent)
      await handleSubmit(formEvent, {
        experimental_attachments: attachments.length > 0 ? attachments : undefined,
      })
      // Restore original input (which should be empty after successful submission)
      if (originalValue === "") {
        setInput("")
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      // Show user-friendly error
      alert(t("error.processing", { error: errorMessage }))

      // Reset loading state
      setRagStatus("enabled")
    }
  }

  // Add image compression function
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      const img = new Image()

      img.onload = () => {
        try {
          // Calculate new dimensions (max 1200px on longest side)
          const maxSize = 1200
          let { width, height } = img

          if (width > height && width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          } else if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }

          canvas.width = width
          canvas.height = height

          // Draw and compress
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                reject(new Error("Failed to compress image"))
              }
            },
            "image/jpeg",
            0.8, // 80% quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image for compression"))
      img.src = URL.createObjectURL(file)
    })
  }

  // Update the handleImageAction function to use translated prompts
  const handleImageAction = async (promptKey: string) => {
    if (selectedFiles.length === 0) return

    const promptText = t(promptKey)
    console.log("Image action clicked:", promptText)
    setRagStatus("checking")

    // Convert files to attachments first
    const attachments = await Promise.all(
      selectedFiles.map(async (file) => {
        // Compress image if it's too large
        let processedFile = file
        if (file.size > 1024 * 1024) {
          processedFile = await compressImage(file)
        }

        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result)
            } else {
              reject(new Error("Failed to read file as string"))
            }
          }
          reader.onerror = () => reject(new Error("FileReader error"))
          reader.readAsDataURL(processedFile)
        })

        return {
          name: file.name,
          contentType: file.type,
          url: base64,
        }
      }),
    )

    // Clear selected files
    setSelectedFiles([])

    // Use append with attachments - same as quick prompts but with images
    await append({
      role: "user",
      content: promptText,
      experimental_attachments: attachments,
    })
  }

  const handleContactLawyer = () => {
    window.open("https://www.immigrationadvocates.org/nonprofit/legaldirectory/", "_blank")
  }

  const handleCallAssistant = () => {
    window.location.href = "tel:5109062617"
  }

  const getRagStatusDisplay = () => {
    switch (ragStatus) {
      case "enabled":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 rounded-full">
            <Database className="h-3 w-3 text-green-600" />
            <span className="text-xs text-green-700 font-medium">{t("header.ragEnabled")}</span>
          </div>
        )
      case "fallback":
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-3 w-3 text-yellow-600" />
            <span className="text-xs text-yellow-700 font-medium">{t("header.fallbackMode")}</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
            <Database className="h-3 w-3 text-gray-600" />
            <span className="text-xs text-gray-700 font-medium">{t("header.ready")}</span>
          </div>
        )
    }
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 p-2 md:p-4">
        <div className="w-full max-w-none md:max-w-[75%] mx-auto">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <h1 className="text-base font-semibold text-gray-900 truncate">{t("header.title.short")}</h1>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <LanguageToggle />
              <Link href="/map">
                <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                  <MapPin className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="p-2 h-8 w-8 text-orange-600 border-orange-200 hover:bg-orange-50"
                onClick={handleCallAssistant}
              >
                <Phone className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Shield className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <h1 className="text-xl font-semibold text-gray-900">{t("header.title")}</h1>
              {getRagStatusDisplay()}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full border border-green-200">
                <Bot className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">{t("header.poweredBy")}</span>
              </div>
              <LanguageToggle />
              <PanicMode />
              <Link href="/map">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("header.map")}
                </Button>
              </Link>
              <Link href="/faq">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  {t("header.faq")}
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile Status Row */}
          <div className="flex md:hidden items-center justify-between mt-2 px-1">
            <div className="flex items-center gap-2">
              {getRagStatusDisplay()}
              <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded-full border border-green-200">
                <Bot className="h-3 w-3 text-green-600" />
                <span className="text-xs text-green-700 font-medium">{t("header.poweredBy")}</span>
              </div>
            </div>
            <PanicMode className="scale-75" />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full w-full max-w-none md:max-w-[75%] mx-auto flex flex-col">
          <div className="flex-1 overflow-y-auto px-3 md:px-4 py-3 md:py-6">
            {messages.length === 0 && (
              <div className="text-center py-6 md:py-12">
                <Shield className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 md:mb-6 text-blue-600" />
                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-2">{t("welcome.title")}</h2>
                <p className="text-sm md:text-base text-gray-600 mb-3 md:mb-4 max-w-md mx-auto px-4">
                  {t("welcome.subtitle")}
                </p>
                <p className="text-xs md:text-sm text-blue-600 mb-1 md:mb-2 flex items-center justify-center gap-2">
                  <Bot className="h-3 w-3 md:h-4 md:w-4" />
                  {t("welcome.multimodal")}
                </p>
                <p className="text-xs md:text-sm text-green-600 mb-2 md:mb-4 flex items-center justify-center gap-2">
                  <Database className="h-3 w-3 md:h-4 md:w-4" />
                  {t("welcome.knowledgeBase")}
                </p>
                {/* Update the call assistant button to be smaller */}
                <p className="text-xs md:text-sm text-orange-600 mb-4 md:mb-6 flex items-center justify-center gap-2">
                  <Phone className="h-3 w-3 md:h-4 md:w-4" />
                  <button onClick={handleCallAssistant} className="hover:underline text-xs md:text-sm">
                    {t("welcome.callAssistant")}
                  </button>
                </p>
                <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto px-2 mb-4">
                  {QUICK_PROMPTS.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickPrompt(prompt)}
                      disabled={isLoading}
                      className="text-xs md:text-sm hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 px-2 md:px-3 py-1 md:py-2"
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
                {/* Disclaimer only shown on welcome screen */}
                <p className="text-xs text-gray-500 text-center mt-4 px-4">{t("welcome.disclaimer")}</p>
              </div>
            )}

            {messages.map((message) => {
              const { cleanContent, sources } = extractSources(message.content)

              return (
                <div key={message.id} className="mb-4 md:mb-6">
                  <div className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className="flex items-start gap-2 md:gap-3 max-w-[85%] md:max-w-[80%]">
                      {message.role === "assistant" && (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                          <Shield className="h-3 w-3 md:h-4 md:w-4 text-white" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        {/* Display images if present - align right for user messages */}
                        {message.experimental_attachments && message.experimental_attachments.length > 0 && (
                          <div
                            className={`mb-2 flex flex-wrap gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {message.experimental_attachments.map((attachment: any, index: number) => (
                              <div key={index} className="relative">
                                <img
                                  src={attachment.url || "/placeholder.svg"}
                                  alt={attachment.name || `Uploaded image ${index + 1}`}
                                  className="max-w-[250px] md:max-w-xs max-h-32 md:max-h-48 rounded-lg border border-gray-200 object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        {/* Only show text bubble if there's actual content */}
                        {cleanContent && (
                          <div
                            className={`rounded-2xl px-3 md:px-4 py-2 md:py-3 ${
                              message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <div className="leading-relaxed text-sm md:text-base">
                              {message.role === "assistant" ? processMarkdown(cleanContent) : cleanContent}
                            </div>
                          </div>
                        )}
                        {/* Sources or Contact Lawyer Button - FIXED LOGIC */}
                        {/* Sources or Contact Lawyer Button - SIMPLIFIED LOGIC */}
                        {message.role === "assistant" && (
                          <div className="mt-2">
                            {/* Check if we have valid sources to display */}
                            {message.content.includes("[SOURCES:") &&
                            sources.length > 0 &&
                            !sources.includes("fallback-kb") &&
                            !sources.includes("") &&
                            !sources.some((s) => s.toLowerCase().includes("none")) ? (
                              // Show source tags
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
                              // Always show contact lawyer button if no valid sources
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleContactLawyer}
                                className="flex items-center gap-2 text-orange-700 border-orange-200 hover:bg-orange-50 hover:border-orange-300 text-xs"
                              >
                                <Scale className="h-3 w-3" />
                                <span>{t("chat.contactLawyer")}</span>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="h-3 w-3 md:h-4 md:w-4 text-gray-700" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="mb-4 md:mb-6">
                <div className="flex justify-start">
                  <div className="flex items-start gap-2 md:gap-3 max-w-[85%] md:max-w-[80%]">
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Shield className="h-3 w-3 md:h-4 md:w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-3 md:px-4 py-2 md:py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin text-gray-600" />
                        <span className="text-gray-600 text-sm md:text-base">
                          {ragStatus === "enabled" ? t("chat.searching") : t("chat.thinking")}
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
      <div className="border-t border-gray-200 p-2 md:p-4">
        <div className="w-full max-w-none md:max-w-[75%] mx-auto">
          {/* Mobile Camera Button - Show full button when no files, show plus icon when files exist */}
          {isMobile && (
            <div className="mb-2">
              {selectedFiles.length === 0 ? (
                <Button
                  type="button"
                  onClick={handleCameraClick}
                  className="w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 text-sm font-medium"
                  disabled={isLoading}
                >
                  <Camera className="h-4 w-4" />
                  <span>{t("input.photographDocuments")}</span>
                </Button>
              ) : null}
            </div>
          )}

          {/* File Preview */}
          {selectedFiles.length > 0 && (
            <div className="mb-2">
              <div className="flex flex-wrap gap-2 items-center">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2">
                    <Upload className="h-3 w-3 md:h-4 md:w-4 text-gray-600" />
                    <span className="text-xs md:text-sm text-gray-700 truncate max-w-24 md:max-w-32">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {/* Green plus button for mobile when files exist */}
                {isMobile && (
                  <button
                    type="button"
                    onClick={handleCameraClick}
                    className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center flex-shrink-0"
                    disabled={isLoading}
                  >
                    <span className="text-lg font-bold">+</span>
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Image Action Buttons - Show when files are selected */}
          {selectedFiles.length > 0 && (
            <div className="mb-2 flex gap-2">
              <Button
                type="button"
                onClick={() => handleImageAction("prompts.explainDocument")}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 py-3 text-sm font-medium"
              >
                <Bot className="h-4 w-4" />
                <span>{t("input.explain")}</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleImageAction("prompts.translateDocument")}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-3 text-sm font-medium"
              >
                <Globe className="h-4 w-4" />
                <span>{t("input.translate")}</span>
              </Button>
            </div>
          )}
          <Card className="p-2">
            <form onSubmit={onSubmit} className="flex gap-2">
              <Button
                type="button"
                onClick={handleAttachmentClick}
                variant="outline"
                size="sm"
                className="flex-shrink-0 flex items-center gap-1 md:gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 text-xs md:text-sm px-2 md:px-3"
                disabled={isLoading}
              >
                <Upload className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{t("input.shareDocuments")}</span>
                <span className="sm:hidden">{t("input.upload")}</span>
              </Button>
              <Input
                value={input}
                onChange={handleInputChange}
                placeholder={isMobile ? t("input.placeholder.mobile") : t("input.placeholder.desktop")}
                className="flex-1 border-0 focus-visible:ring-0 text-sm md:text-base"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
                size="sm"
                className="px-2 md:px-3"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <Send className="h-3 w-3 md:h-4 md:w-4" />
                )}
              </Button>
            </form>
            {/* Hidden file inputs - BOTH use the same handler now */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </Card>
        </div>
      </div>

      {/* Vapi Voice Widget - Only show on desktop - COMMENTED OUT */}
      {/* 
{!isMobile && process.env.NEXT_PUBLIC_VAPI_API_KEY && process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID && (
  <VapiWidget
    apiKey={process.env.NEXT_PUBLIC_VAPI_API_KEY}
    assistantId={process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID}
  />
)}
*/}
    </div>
  )
}
