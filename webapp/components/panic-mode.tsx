"use client"
import { useState, useRef, useEffect } from "react"
import { AlertTriangle, Settings, Video, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/contexts/language-context"

interface PanicModeProps {
  className?: string
}

export default function PanicMode({ className = "" }: PanicModeProps) {
  const { t } = useLanguage()
  const [lawyerEmail, setLawyerEmail] = useState<string>("")
  const [showSetup, setShowSetup] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSending, setIsSending] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Load lawyer email from cookie on mount
  useEffect(() => {
    const savedEmail = getCookie("panic_lawyer_email")
    if (savedEmail) {
      setLawyerEmail(savedEmail)
    }
  }, [])

  // Timer for recording
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1
          // Auto-stop at 5 minutes (300 seconds)
          if (newTime >= 300) {
            stopRecording()
          }
          return newTime
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setRecordingTime(0)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording])

  // Cookie helpers
  const setCookie = (name: string, value: string, days = 365) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
  }

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "="
    const ca = document.cookie.split(";")
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i]
      while (c.charAt(0) === " ") c = c.substring(1, c.length)
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length)
    }
    return null
  }

  const handleSetupSave = () => {
    if (lawyerEmail.trim()) {
      setCookie("panic_lawyer_email", lawyerEmail.trim())
      setShowSetup(false)
    }
  }

  // Helper function to detect if device is mobile
  const isMobile = () => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    )
  }

  const startRecording = async () => {
    try {
      // Use back camera on mobile, front camera on desktop
      const facingMode = isMobile() ? "environment" : "user"

      // Request both camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode, // "environment" = back camera, "user" = front camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      streamRef.current = stream
      recordedChunksRef.current = []

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9,opus",
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
        await handleVideoComplete(blob)

        // Clean up stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert(t("error.camera"))
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleVideoComplete = async (videoBlob: Blob) => {
    setIsSending(true)

    try {
      await send_video_to_lawyer(videoBlob, lawyerEmail)
      alert(t("success.videoSent"))
    } catch (error) {
      console.error("Error sending video:", error)
      alert(t("error.videoSend"))
    } finally {
      setIsSending(false)
    }
  }

  // Implemented function to send video to lawyer via Resend API
  const send_video_to_lawyer = async (videoBlob: Blob, email: string) => {
    console.log("send_video_to_lawyer called with:", {
      videoSize: videoBlob.size,
      videoType: videoBlob.type,
      lawyerEmail: email,
      timestamp: new Date().toISOString(),
    })

    try {
      // Convert blob to base64
      const base64Video = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result)
          } else {
            reject(new Error("Failed to convert video to base64"))
          }
        }
        reader.onerror = () => reject(new Error("FileReader error"))
        reader.readAsDataURL(videoBlob)
      })

      // Send to our API endpoint
      const response = await fetch("/api/send-emergency-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoBase64: base64Video,
          lawyerEmail: email,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Video sent successfully:", result)
      return result
    } catch (error) {
      console.error("Error in send_video_to_lawyer:", error)
      throw error
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePanicClick = () => {
    if (!lawyerEmail) {
      setShowSetup(true)
    } else if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <div className={className}>
      {/* Setup Modal */}
      {showSetup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <Settings className="h-5 w-5" />
                {t("panic.setupTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="lawyer-email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t("panic.emailLabel")}
                </label>
                <Input
                  id="lawyer-email"
                  type="email"
                  placeholder={t("panic.emailPlaceholder")}
                  value={lawyerEmail}
                  onChange={(e) => setLawyerEmail(e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">{t("panic.emailDescription")}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowSetup(false)} variant="outline" className="flex-1">
                  {t("panic.cancel")}
                </Button>
                <Button
                  onClick={handleSetupSave}
                  disabled={!lawyerEmail.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {t("panic.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panic Button */}
      <Button
        onClick={handlePanicClick}
        disabled={isSending}
        className={`
          ${!lawyerEmail ? "bg-orange-600 hover:bg-orange-700" : "bg-red-600 hover:bg-red-700"}
          ${isRecording ? "animate-pulse" : ""}
          text-white font-bold py-2 px-3 text-sm shadow-lg whitespace-nowrap
        `}
      >
        {isSending ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            {t("panic.sending")}
          </>
        ) : !lawyerEmail ? (
          <>
            <Settings className="h-5 w-5 mr-2" />
            {t("panic.setup")}
          </>
        ) : isRecording ? (
          <>
            <Square className="h-5 w-5 mr-2" />
            {t("panic.stopRecording")} ({formatTime(recordingTime)})
          </>
        ) : (
          <>
            <AlertTriangle className="h-5 w-5 mr-2" />
            {t("panic.panicMode")}
          </>
        )}
      </Button>

      {/* Recording Status */}
      {isRecording && (
        <div className="mt-2 text-center">
          <div className="flex items-center justify-center gap-2 text-red-600 text-sm font-medium">
            <Video className="h-4 w-4" />
            <span>
              {t("panic.recording")}: {formatTime(recordingTime)} / 5:00
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
            <div
              className="bg-red-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(recordingTime / 300) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
