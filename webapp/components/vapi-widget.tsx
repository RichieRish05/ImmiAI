"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Mic, PhoneOff } from "lucide-react"

interface VapiWidgetProps {
  apiKey: string
  assistantId: string
  config?: Record<string, unknown>
}

const VapiWidget: React.FC<VapiWidgetProps> = ({ apiKey, assistantId, config = {} }) => {
  const [vapi, setVapi] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string }>>([])

  useEffect(() => {
    // Dynamically import Vapi to avoid SSR issues
    const initVapi = async () => {
      try {
        const { default: Vapi } = await import("@vapi-ai/web")
        const vapiInstance = new Vapi(apiKey)
        setVapi(vapiInstance)

        // Event listeners
        vapiInstance.on("call-start", () => {
          console.log("Call started")
          setIsConnected(true)
          setTranscript([]) // Clear transcript on new call
        })

        vapiInstance.on("call-end", () => {
          console.log("Call ended")
          setIsConnected(false)
          setIsSpeaking(false)
        })

        vapiInstance.on("speech-start", () => {
          console.log("Assistant started speaking")
          setIsSpeaking(true)
        })

        vapiInstance.on("speech-end", () => {
          console.log("Assistant stopped speaking")
          setIsSpeaking(false)
        })

        vapiInstance.on("message", (message: any) => {
          console.log("Received message:", message) // Debug log

          if (message.type === "transcript") {
            setTranscript((prev) => {
              const newTranscript = [...prev]

              // Check if the last message is from the same role
              const lastMessage = newTranscript[newTranscript.length - 1]

              if (lastMessage && lastMessage.role === message.role) {
                // Update the existing message with new text
                lastMessage.text = message.transcript
              } else {
                // Add new message for different role
                newTranscript.push({
                  role: message.role,
                  text: message.transcript,
                })
              }

              return newTranscript
            })
          }
        })

        vapiInstance.on("error", (error: any) => {
          console.error("Vapi error:", error)
        })
      } catch (error) {
        console.error("Failed to initialize Vapi:", error)
      }
    }

    initVapi()

    return () => {
      vapi?.stop()
    }
  }, [apiKey])

  const startCall = () => {
    if (vapi) {
      vapi.start(assistantId)
    }
  }

  const endCall = () => {
    if (vapi) {
      vapi.stop()
    }
  }

  if (!vapi) return null

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {!isConnected ? (
          <button
            onClick={startCall}
            className="bg-blue-600 hover:bg-blue-700 text-white border-none rounded-full p-4 text-base font-bold cursor-pointer shadow-lg transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl flex items-center gap-2"
          >
            <Mic className="h-5 w-5" />
            <span className="hidden sm:inline">Talk to Assistant</span>
          </button>
        ) : (
          <div className="bg-white rounded-xl p-5 w-80 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${isSpeaking ? "bg-red-500 animate-pulse" : "bg-green-500"}`}
                ></div>
                <span className="font-bold text-gray-800">{isSpeaking ? "Assistant Speaking..." : "Listening..."}</span>
              </div>
              <button
                onClick={endCall}
                className="bg-red-500 hover:bg-red-600 text-white border-none rounded-md px-3 py-1 text-xs cursor-pointer flex items-center gap-1"
              >
                <PhoneOff className="h-3 w-3" />
                End Call
              </button>
            </div>

            <div className="max-h-48 overflow-y-auto mb-3 p-2 bg-gray-50 rounded-lg">
              {transcript.length === 0 ? (
                <p className="text-gray-600 text-sm m-0">Conversation will appear here...</p>
              ) : (
                transcript.map((msg, i) => (
                  <div key={i} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <span
                      className={`inline-block px-3 py-2 rounded-xl text-sm max-w-[80%] ${
                        msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-white"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default VapiWidget
