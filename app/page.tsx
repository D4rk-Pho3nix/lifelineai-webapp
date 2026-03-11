"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Phone, Bot, ChevronUp, Calendar } from "lucide-react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatMessage } from "@/components/chat-message"
import { ChatInput } from "@/components/chat-input"
import { CallerModal } from "@/components/caller-modal"
import { AppointmentModal } from "@/components/appointment-modal"
import { WebhookConfig } from "@/components/webhook-config"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  image?: string
  userId?: string // Add userId to Message interface
  audioBlobUrl?: string // For cleanup of blob URLs
}

export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
  pinned?: boolean
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCallerModalOpen, setIsCallerModalOpen] = useState(false)
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [sessionResolved, setSessionResolved] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const topOfChatRef = useRef<HTMLDivElement | null>(null)

  // Cleanup blob URLs when component unmounts or sessions change
  useEffect(() => {
    return () => {
      // Cleanup all blob URLs when component unmounts
      sessions.forEach(session => {
        session.messages.forEach(message => {
          if (message.audioBlobUrl) {
            URL.revokeObjectURL(message.audioBlobUrl)
          }
        })
      })
    }
  }, [sessions])

  // Helper function to validate audio data
  const isValidAudioData = (bytes: Uint8Array): boolean => {
    if (bytes.length < 4) return false
    
    // Check for common audio file signatures
    const firstBytes = Array.from(bytes.slice(0, 4))
    
    // MP3 signature (ID3 tag or frame sync)
    if (firstBytes[0] === 0x49 && firstBytes[1] === 0x44 && firstBytes[2] === 0x33) return true // ID3
    if (firstBytes[0] === 0xFF && (firstBytes[1] & 0xE0) === 0xE0) return true // MP3 frame sync
    
    // WAV signature
    if (firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x46) return true
    
    // OGG signature
    if (firstBytes[0] === 0x4F && firstBytes[1] === 0x67 && firstBytes[2] === 0x67 && firstBytes[3] === 0x53) return true
    
    // WebM signature
    if (firstBytes[0] === 0x1A && firstBytes[1] === 0x45 && firstBytes[2] === 0xDF && firstBytes[3] === 0xA3) return true
    
    return true // If we can't detect, assume it's valid and let the browser handle it
  }

  const { data: session, status } = useSession()
  const router = useRouter()

  const createAndSelectNewSession = (): string => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
    return newSession.id
  }

  const startEventChat = async (eventType: 'caller' | 'appointment') => {
    // Always open a fresh chat for each event
    const newId = createAndSelectNewSession()

    const label = eventType === 'caller' ? 'Caller request' : 'Appointment request'
    const userMessage: Message = {
      id: (Date.now()).toString(),
      content: `[${label}]`,
      role: "user",
      timestamp: new Date(),
    }

    setSessions((prev) =>
      prev.map((s) =>
        s.id === newId
          ? { ...s, messages: [...s.messages, userMessage], title: label, updatedAt: new Date() }
          : s,
      ),
    )

    setIsLoading(true)
    try {
      const webhookUrl = localStorage.getItem("webhook-url") || "[PLACE_YOUR_WEBHOOK_URL_HERE]"
      if (webhookUrl === "[PLACE_YOUR_WEBHOOK_URL_HERE]") {
        throw new Error("Please configure your webhook URL in settings")
      }

      const phoneCombined = session?.user?.phone
        ? `${(session.user.countryCode || '').replace('+', '')}${session.user.phone}`
        : undefined

      const postRes = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `${eventType}_request`,
          image: undefined,
          sessionId: newId,
          phone: phoneCombined,
          msg_type: eventType,
          webhookUrl,
        }),
      })

      if (!postRes.ok) throw new Error('Failed to start event')
      const { jobId } = await postRes.json()

      // Poll for completion and handle possible audio payloads (reuse logic similar to addMessage)
      const result = await (async () => {
        while (true) {
          const res = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' })
          if (res.ok) {
            const json = await res.json()
            if (json.status === 'completed') return json
            if (json.status === 'failed') throw new Error(json.error || 'Job failed')
          }
          await new Promise((r) => setTimeout(r, 1200))
        }
      })()

      if (
        result?.responseType &&
        typeof result.responseType === 'string' &&
        result.responseType.startsWith('audio/') &&
        result.responseBinaryBase64
      ) {
        const url = `/api/jobs/${jobId}/audio`
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "[Audio Reply]",
          role: "assistant",
          timestamp: new Date(),
          image: url,
        }
        setSessions((prev) =>
          prev.map((s) => (s.id === newId ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: new Date() } : s)),
        )
      } else {
        const aiResponse = result?.responseText as string | undefined
        const normalizeAiResponseText = (input: string): string => {
          if (!input) return ""
          let candidate = input
          try {
            const parsed = JSON.parse(input)
            if (parsed && typeof parsed === "object") {
              const chosen = parsed.raw_content ?? parsed.message ?? parsed.content ?? parsed.text ?? ""
              candidate = typeof chosen === 'string' ? chosen : JSON.stringify(chosen)
            }
          } catch {}
          candidate = candidate
            .replace(/<br\s*\/?\>/gi, "\n")
            .replace(/<\/(p|div)\s*>/gi, "\n\n")
            .replace(/<\/(h[1-6])\s*>/gi, "\n\n")
            .replace(/<li\s*>/gi, "- ")
            .replace(/<\/(li)\s*>/gi, "\n")
            .replace(/<\/(ul|ol)\s*>/gi, "\n")
          candidate = candidate.replace(/<[^>]*>/g, " ")
          return candidate
            .replace(/[\u00A0\u2007\u202F]/g, " ")
            .replace(/\r\n/g, "\n")
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\s+$/gm, "")
            .trim()
        }
        const cleanedText = normalizeAiResponseText(aiResponse || '')
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: cleanedText,
          role: "assistant",
          timestamp: new Date(),
        }
        setSessions((prev) =>
          prev.map((s) => (s.id === newId ? { ...s, messages: [...s.messages, assistantMessage], updatedAt: new Date() } : s)),
        )
      }
    } catch (error) {
      // Add error message to the new chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          error instanceof Error && error.message.includes("configure")
            ? "Please configure your webhook URL in the settings (gear icon in the top bar)."
            : "Sorry, something went wrong starting the request. Please check your webhook URL configuration and try again.",
        role: "assistant",
        timestamp: new Date(),
      }
      setSessions((prev) =>
        prev.map((s) => (s.id === newId ? { ...s, messages: [...s.messages, errorMessage], updatedAt: new Date() } : s)),
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem("chat-sessions")
    if (savedSessions) {
      const parsedSessions = JSON.parse(savedSessions).map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        })),
      }))
      setSessions(parsedSessions)

      // Set the most recent session as current
      if (parsedSessions.length > 0) {
        setCurrentSessionId(parsedSessions[0].id)
      }
    }
  }, [])

  // Save sessions to localStorage whenever sessions change (with size safeguards)
  useEffect(() => {
    const sanitizeSessionsForStorage = (input: ChatSession[]): ChatSession[] => {
      const MAX_SESSIONS = 10
      const MAX_MESSAGES_PER_SESSION = 50

      return input
        .slice(0, MAX_SESSIONS)
        .map((s) => ({
          ...s,
          // Only keep the most recent messages
          messages: s.messages
            .slice(-MAX_MESSAGES_PER_SESSION)
            .map((m) => ({
              ...m,
              // Strip large data URLs (audio/image) before persisting
              image:
                typeof m.image === "string" && m.image.startsWith("data:")
                  ? undefined
                  : m.image,
            })),
        }))
    }

    try {
      if (sessions.length > 0) {
        const minimal = sanitizeSessionsForStorage(sessions)
        localStorage.setItem("chat-sessions", JSON.stringify(minimal))
      } else {
        localStorage.removeItem("chat-sessions")
      }
    } catch (err) {
      // Attempt a more aggressive trim (remove all images)
      try {
        const aggressivelyTrimmed = sessions.map((s) => ({
          ...s,
          messages: s.messages.map((m) => ({ ...m, image: undefined })),
        }))
        localStorage.setItem("chat-sessions", JSON.stringify(aggressivelyTrimmed))
      } catch {
        // As a last resort, clear the stored sessions to avoid runtime errors
        localStorage.removeItem("chat-sessions")
      }
    }
  }, [sessions])

  useEffect(() => {
    if (status === "unauthenticated" && sessionResolved) {
      router.push("/login")
    }
  }, [status, router, sessionResolved])

  // Fix infinite loading with safe timeout fallback
  useEffect(() => {
    if (status !== "loading") {
      setSessionResolved(true)
    }
    const timer = setTimeout(() => {
      setSessionResolved(true)
    }, 3000)
    return () => clearTimeout(timer)
  }, [status])

  // Track scroll (window and/or ScrollArea viewport) to toggle Scroll-to-Top button
  useEffect(() => {
    const update = () => {
      const viewport = messagesContainerRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement | null
      const currentScroll = viewport ? viewport.scrollTop : window.scrollY
      setShowScrollTop(currentScroll > 200)
    }

    const viewport = messagesContainerRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLElement | null

    window.addEventListener("scroll", update, { passive: true })
    viewport?.addEventListener("scroll", update, { passive: true })
    update()
    return () => {
      window.removeEventListener("scroll", update)
      viewport?.removeEventListener("scroll", update)
    }
  }, [currentSessionId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const currentSession = sessions.find((s) => s.id === currentSessionId)
    if (currentSession?.messages.length) {
      const viewport = messagesContainerRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLElement | null
      if (viewport) {
        // Small delay to ensure DOM is updated
        setTimeout(() => {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" })
        }, 100)
      }
    }
  }, [sessions, currentSessionId, isLoading])

  if (status === "loading" && !sessionResolved) {
    return <div>Loading application...</div> 
  }

  if (status === "unauthenticated" && !session) {
    return null // Will be redirected by useEffect
  }

  const currentSession = sessions.find((s) => s.id === currentSessionId)

  const pollJob = async (jobId: string, intervalMs = 1200, maxWaitMs = 180000): Promise<string> => {
    // Wait indefinitely until backend marks the job as completed or failed.
    // Ignore transient network errors and keep polling.
    // Only throw when backend explicitly reports failure.
    // eslint-disable-next-line no-constant-condition
    const start = Date.now()
    while (true) {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' })
        if (res.ok) {
          const json = await res.json()
          if (json.status === 'completed') return json.responseText || ''
          if (json.status === 'failed') throw new Error(json.error || 'Job failed')
        }
      } catch {
        // swallow and continue polling
      }
      await new Promise((r) => setTimeout(r, intervalMs))
      if (Date.now() - start > maxWaitMs) {
        // keep waiting longer for audio; extend soft timeout to avoid premature error
        // Increase interval progressively up to a cap to reduce server load
        intervalMs = Math.min(intervalMs + 800, 5000)
      }
    }
  }

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setSessions((prev) => [newSession, ...prev])
    setCurrentSessionId(newSession.id)
  }

  const addMessage = async (content: string, image?: string, userId?: string) => {
    if (!currentSessionId) {
      createNewSession()
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: "user",
      timestamp: new Date(),
      image,
    }

    // Update session with user message
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: [...session.messages, userMessage],
              title: session.messages.length === 0 ? content.slice(0, 30) + "..." : session.title,
              updatedAt: new Date(),
            }
          : session,
      ),
    )

    setIsLoading(true)

    try {
      const webhookUrl = localStorage.getItem("webhook-url") || "[PLACE_YOUR_WEBHOOK_URL_HERE]"

      if (webhookUrl === "[PLACE_YOUR_WEBHOOK_URL_HERE]") {
        throw new Error("Please configure your webhook URL in settings")
      }

      const response = await fetch('/api/messages', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          image: image,
          sessionId: currentSessionId,
          phone: session?.user?.phone ? `${(session.user.countryCode || '').replace('+', '')}${session.user.phone}` : undefined,
          msg_type: image ? 'img' : 'text',
          webhookUrl,
        }),
      })

      if (response.ok) {
        const { jobId } = await response.json()
        const result = await (async () => {
          // Wait for completion; handle audio responses (binary) and text
          // We request JSON from /api/jobs/:id which may include base64 audio
          // The upstream pollJob returns only text; inline logic here to parse audio
          while (true) {
            const res = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' })
            if (res.ok) {
              const json = await res.json()
              console.log('Job status:', json.status)
              console.log('Job response type:', json.responseType)
              console.log('Job has audio data:', !!json.responseBinaryBase64)
              
              if (json.status === 'completed') return json
              if (json.status === 'failed') throw new Error(json.error || 'Job failed')
            }
            await new Promise((r) => setTimeout(r, 1200))
          }
        })()

        // If webhook returned audio, render a playable audio message
        console.log('Processing result:', {
          hasResponseType: !!result?.responseType,
          responseType: result?.responseType,
          hasAudioData: !!result?.responseBinaryBase64,
          audioDataLength: result?.responseBinaryBase64?.length
        })
        
        if (
          result?.responseType &&
          typeof result.responseType === 'string' &&
          result.responseType.startsWith('audio/') &&
          result.responseBinaryBase64
        ) {
          try {
            // Safely decode base64 with better error handling
            const base64Data = result.responseBinaryBase64 as string
            
            // Clean base64 string (remove any whitespace or data URL prefix)
            const cleanBase64 = base64Data
              .replace(/^data:audio\/[^;]+;base64,/, '') // Remove data URL prefix if present
              .replace(/\s/g, '') // Remove any whitespace
            
            // Validate base64 format
            if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
              throw new Error('Invalid base64 format')
            }
            
            const byteChars = atob(cleanBase64)
            const bytes = new Uint8Array(byteChars.length)
            for (let i = 0; i < byteChars.length; i++) {
              bytes[i] = byteChars.charCodeAt(i)
            }
            
            // Validate that we have actual audio data
            if (bytes.length === 0) {
              throw new Error('Empty audio data')
            }
            
            // Validate audio data format
            if (!isValidAudioData(bytes)) {
              throw new Error('Invalid audio data format')
            }
            
            // Create blob with proper MIME type
            const mimeType = result.responseType || 'audio/mpeg'
            const blob = new Blob([bytes], { type: mimeType })
            
            // Validate blob
            if (blob.size === 0) {
              throw new Error('Created blob is empty')
            }
            
            const url = URL.createObjectURL(blob)
            console.log('Created audio blob URL:', url)
            console.log('Blob size:', blob.size)
            console.log('Blob type:', blob.type)

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: "[Audio Reply]",
              role: "assistant",
              timestamp: new Date(),
              image: url,
              // Store cleanup function for blob URL
              audioBlobUrl: url,
            }

            setSessions((prev) =>
              prev.map((session) =>
                session.id === currentSessionId
                  ? {
                      ...session,
                      messages: [...session.messages, assistantMessage],
                      updatedAt: new Date(),
                    }
                  : session,
              ),
            )
          } catch (error) {
            console.error('Error creating audio blob:', error)
            
            // Fallback: show error message
            const errorMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: "Failed to process audio response. Please try again.",
              role: "assistant",
              timestamp: new Date(),
            }

            setSessions((prev) =>
              prev.map((session) =>
                session.id === currentSessionId
                  ? {
                      ...session,
                      messages: [...session.messages, errorMessage],
                      updatedAt: new Date(),
                    }
                  : session,
              ),
            )
          }
        } else {
          const aiResponse = result?.responseText as string | undefined

          const normalizeAiResponseText = (input: string): string => {
            if (!input) return ""
            let candidate = input
            try {
              const parsed = JSON.parse(input)
              if (parsed && typeof parsed === "object") {
                const chosen =
                  parsed.raw_content ?? parsed.message ?? parsed.content ?? parsed.text ?? ""
                candidate = typeof chosen === 'string' ? chosen : JSON.stringify(chosen)
              }
            } catch {}

            candidate = candidate
              .replace(/<br\s*\/?>/gi, "\n")
              .replace(/<\/(p|div)\s*>/gi, "\n\n")
              .replace(/<\/(h[1-6])\s*>/gi, "\n\n")
              .replace(/<li\s*>/gi, "- ")
              .replace(/<\/(li)\s*>/gi, "\n")
              .replace(/<\/(ul|ol)\s*>/gi, "\n")
            candidate = candidate.replace(/<[^>]*>/g, " ")
            return candidate
              .replace(/[\u00A0\u2007\u202F]/g, " ")
              .replace(/\r\n/g, "\n")
              .replace(/\n{3,}/g, "\n\n")
              .replace(/\s+$/gm, "")
              .trim()
          }

          const cleanedText = normalizeAiResponseText(aiResponse || '')

          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: cleanedText,
            role: "assistant",
            timestamp: new Date(),
          }

          setSessions((prev) =>
            prev.map((session) =>
              session.id === currentSessionId
                ? {
                    ...session,
                    messages: [...session.messages, assistantMessage],
                    updatedAt: new Date(),
                  }
                : session,
            ),
          )
        }
      } else {
        throw new Error("Failed to get AI response")
      }
    } catch (error) {
      console.error("Error sending message:", error)

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          error instanceof Error && error.message.includes("configure")
            ? "Please configure your webhook URL in the settings (gear icon in the top bar)."
            : "Sorry, I encountered an error. Please check your webhook URL configuration and try again.",
        role: "assistant",
        timestamp: new Date(),
      }

      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, errorMessage],
                updatedAt: new Date(),
              }
            : session,
        ),
      )
    } finally {
      setIsLoading(false)
    }
  }

  const addAudioMessage = async (audioBlob: Blob, userId?: string) => {
    if (!currentSessionId) {
      createNewSession()
      return
    }

    // Convert audio blob to base64 for storage
    const reader = new FileReader()
    reader.onload = async () => {
      const audioDataUrl = reader.result as string
      
      const userMessage: Message = {
        id: Date.now().toString(),
        content: "[Audio Recording]",
        role: "user",
        timestamp: new Date(),
        image: audioDataUrl, // Reusing image field for audio data
      }

      // Update session with user message
      setSessions((prev) =>
        prev.map((session) =>
          session.id === currentSessionId
            ? {
                ...session,
                messages: [...session.messages, userMessage],
                title: session.messages.length === 0 ? "Audio Recording..." : session.title,
                updatedAt: new Date(),
              }
            : session,
        ),
      )

      setIsLoading(true)

      try {
        const webhookUrl = localStorage.getItem("webhook-url") || "[PLACE_YOUR_WEBHOOK_URL_HERE]"

        if (webhookUrl === "[PLACE_YOUR_WEBHOOK_URL_HERE]") {
          throw new Error("Please configure your webhook URL in settings")
        }

        // Create FormData to send audio file to webhook
        const formData = new FormData()
        formData.append('audio', audioBlob, 'recording.ogg')
        formData.append('sessionId', currentSessionId)
        formData.append('userId', userId || '')
        formData.append('phone', session?.user?.phone ? `${(session.user.countryCode || '').replace('+', '')}${session.user.phone}` : '')
        formData.append('timestamp', new Date().toISOString())
        formData.append('msg_type', 'audio')

        const response = await fetch('/api/audio', {
          method: "POST",
          body: (() => { formData.append('webhookUrl', webhookUrl); return formData })(),
        })

        if (response.ok) {
          const { jobId } = await response.json()
          // Poll for completion and handle possible audio payloads
          const result = await (async () => {
            while (true) {
              const res = await fetch(`/api/jobs/${jobId}`, { cache: 'no-store' })
              if (res.ok) {
                const json = await res.json()
                console.log('Audio job status:', json.status)
                console.log('Audio job response type:', json.responseType)
                console.log('Audio job has audio data:', !!json.responseBinaryBase64)
                
                if (json.status === 'completed') return json
                if (json.status === 'failed') throw new Error(json.error || 'Job failed')
              }
              await new Promise((r) => setTimeout(r, 1200))
            }
          })()

          console.log('Audio processing result:', {
            hasResponseType: !!result?.responseType,
            responseType: result?.responseType,
            hasAudioData: !!result?.responseBinaryBase64,
            audioDataLength: result?.responseBinaryBase64?.length
          })

          if (
            result?.responseType &&
            typeof result.responseType === 'string' &&
            result.responseType.startsWith('audio/') &&
            result.responseBinaryBase64
          ) {
            // Serve via API route to avoid large data URLs and browser codec quirks
            const url = `/api/jobs/${jobId}/audio`
            console.log('Created audio URL:', url)

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: "[Audio Reply]",
              role: "assistant",
              timestamp: new Date(),
              image: url,
            }

            setSessions((prev) =>
              prev.map((session) =>
                session.id === currentSessionId
                  ? {
                      ...session,
                      messages: [...session.messages, assistantMessage],
                      updatedAt: new Date(),
                    }
                  : session,
              ),
            )
          } else {
            const aiResponse = result?.responseText as string | undefined

            const normalizeAiResponseText = (input: string): string => {
              if (!input) return ""
              let candidate = input
              try {
                const parsed = JSON.parse(input)
                if (parsed && typeof parsed === "object") {
                  const chosen =
                    parsed.raw_content ?? parsed.message ?? parsed.content ?? parsed.text ?? ""
                  candidate = typeof chosen === 'string' ? chosen : JSON.stringify(chosen)
                }
              } catch {}

              candidate = candidate
                .replace(/<br\s*\/?\>/gi, "\n")
                .replace(/<\/(p|div)\s*>/gi, "\n\n")
                .replace(/<\/(h[1-6])\s*>/gi, "\n\n")
                .replace(/<li\s*>/gi, "- ")
                .replace(/<\/(li)\s*>/gi, "\n")
                .replace(/<\/(ul|ol)\s*>/gi, "\n")
              candidate = candidate.replace(/<[^>]*>/g, " ")
              return candidate
                .replace(/[\u00A0\u2007\u202F]/g, " ")
                .replace(/\r\n/g, "\n")
                .replace(/\n{3,}/g, "\n\n")
                .replace(/\s+$/gm, "")
                .trim()
            }

            const cleanedText = normalizeAiResponseText(aiResponse || '')

            const assistantMessage: Message = {
              id: (Date.now() + 1).toString(),
              content: cleanedText,
              role: "assistant",
              timestamp: new Date(),
            }

            setSessions((prev) =>
              prev.map((session) =>
                session.id === currentSessionId
                  ? {
                      ...session,
                      messages: [...session.messages, assistantMessage],
                      updatedAt: new Date(),
                    }
                  : session,
              ),
            )
          }
        } else {
          throw new Error("Failed to get AI response")
        }
      } catch (error) {
        console.error("Error sending audio message:", error)

        // Add error message
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content:
            error instanceof Error && error.message.includes("configure")
              ? "Please configure your webhook URL in the settings (gear icon in the top bar)."
              : "Processing your audio is taking longer than expected. Still trying... If this persists, please verify your webhook URL settings and try again.",
          role: "assistant",
          timestamp: new Date(),
        }

        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSessionId
              ? {
                  ...session,
                  messages: [...session.messages, errorMessage],
                  updatedAt: new Date(),
                }
              : session,
          ),
        )
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsDataURL(audioBlob)
  }

  const renameSession = (sessionId: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, title: newTitle, updatedAt: new Date() } : session,
      ),
    )
  }

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => {
      const updatedSessions = prev.filter((session) => session.id !== sessionId)

      // If we're deleting the current session, switch to another one or null
      if (sessionId === currentSessionId) {
        if (updatedSessions.length > 0) {
          setCurrentSessionId(updatedSessions[0].id)
        } else {
          setCurrentSessionId(null)
        }
      }

      // Update localStorage
      if (updatedSessions.length === 0) {
        localStorage.removeItem("chat-sessions")
      }

      return updatedSessions
    })
  }

  const toggleBookmark = (sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, pinned: !session.pinned, updatedAt: new Date() } : session,
      ),
    )
  }

  const filteredSessions = sessions
    .filter(
      (session) =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages.some((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase())),
    )
    .sort((a, b) => {
      // Sort pinned chats first, then by updatedAt
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ChatSidebar
        sessions={filteredSessions}
        currentSessionId={currentSessionId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSessionSelect={setCurrentSessionId}
        onNewChat={createNewSession}
        onRenameSession={renameSession}
        onDeleteSession={deleteSession}
        onToggleBookmark={toggleBookmark}
        session={session} // Pass session data
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Top Bar */}
        <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between sticky top-0 z-30">
          <h1 className="text-lg font-medium text-foreground">Lifeline AI</h1>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WebhookConfig />
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsAppointmentModalOpen(true); startEventChat('appointment') }}
              className="flex items-center gap-2 text-sm"
            >
              <Calendar className="h-4 w-4" />
              Book an Appointment
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsCallerModalOpen(true); startEventChat('caller') }}
              className="flex items-center gap-2 text-sm"
            >
              <Phone className="h-4 w-4" />
              Caller
            </Button>
          </div>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 flex flex-col relative">
          {currentSession ? (
            <>
              <div ref={messagesContainerRef} className="flex-1 pb-20">
                <ScrollArea className="h-full px-4 py-6">
                <div ref={topOfChatRef} />
                <div className="space-y-6 max-w-3xl mx-auto">
                  {currentSession.messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isLoading && (
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="flex items-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                </ScrollArea>
              </div>

              {/* Chat Input - Fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-background p-4">
                <div className="max-w-3xl mx-auto">
                  <ChatInput onSendMessage={addMessage} onSendAudio={addAudioMessage} disabled={isLoading} userId={session?.user?.id} />
                </div>
              </div>

              <Button
                size="icon"
                aria-label="Scroll to top"
                onClick={() => {
                  const container = messagesContainerRef.current
                  const viewportGlobal = document.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
                  const viewportRef = container?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement | null
                  const viewport = viewportRef || viewportGlobal
                  // Scroll the chat viewport if present, otherwise fallback to window
                  if (viewport) {
                    viewport.scrollTo({ top: 0, behavior: "smooth" })
                  }
                  try { window.scrollTo({ top: 0, behavior: "smooth" }) } catch {}
                }}
                className="fixed right-6 bottom-6 h-10 w-10 rounded-full shadow-lg z-50"
              >
                <ChevronUp className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-2xl mx-auto px-4">
                <h2 className="text-3xl font-semibold mb-8 text-foreground">Lifeline AI</h2>
                <div className="mb-8">
                  <ChatInput onSendMessage={addMessage} onSendAudio={addAudioMessage} disabled={isLoading} placeholder="Ask anything" userId={session?.user?.id} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Caller Modal */}
      <CallerModal isOpen={isCallerModalOpen} onClose={() => setIsCallerModalOpen(false)} />
      {/* Appointment Modal */}
      <AppointmentModal isOpen={isAppointmentModalOpen} onClose={() => setIsAppointmentModalOpen(false)} />
    </div>
  )
}
