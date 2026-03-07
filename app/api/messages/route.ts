import { NextRequest, NextResponse } from "next/server"
import { createJob, updateJob } from "@/lib/job-store"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, image, sessionId, phone, msg_type = 'text', webhookUrl } = body || {}

    if (!message && msg_type !== 'img') {
      return NextResponse.json({ error: "message or image required" }, { status: 400 })
    }

    const job = createJob()
    const origin = new URL(request.url).origin

    // Fire-and-forget async forward to the configured webhook
    ;(async () => {
      try {
        const resolved = webhookUrl || process.env.WEBHOOK_URL
        if (!resolved) throw new Error("Webhook URL not configured")

        const response = await fetch(resolved, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            image,
            sessionId,
            phone,
            msg_type,
            jobId: job.id,
            callbackUrl: `${origin}/api/jobs/${job.id}/complete`,
          }),
        })

        const rawType = response.headers.get('content-type') || ''
        const contentType = rawType.toLowerCase()
        
        console.log('Messages webhook response status:', response.status)
        console.log('Messages webhook response content-type:', rawType)
        
        if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
          const buf = await response.arrayBuffer()
          const b64 = Buffer.from(buf).toString('base64')
          const finalType = contentType === 'application/octet-stream' ? 'audio/mpeg' : (rawType || 'audio/mpeg')
          updateJob(job.id, { status: 'completed', responseType: finalType, responseBinaryBase64: b64 })
        } else {
          const text = await response.text()
          if (!response.ok) throw new Error(text || `Webhook status ${response.status}`)

          // Try to detect audio delivered as base64 JSON or data URL
          let didHandleAsAudio = false
          try {
            const parsed = JSON.parse(text)
            const audioB64Candidate =
              // common keys
              parsed?.audioBase64 || parsed?.audio_b64 || parsed?.audio_base64 || parsed?.audio || parsed?.data || parsed?.responseBinaryBase64
            const declaredType: string | undefined = parsed?.mimeType || parsed?.contentType || parsed?.responseType

            if (typeof audioB64Candidate === 'string') {
              if (audioB64Candidate.startsWith('data:')) {
                // data URL like data:audio/mpeg;base64,AAA
                const match = audioB64Candidate.match(/^data:([^;]+);base64,(.+)$/)
                if (match) {
                  const [, mime, b64] = match
                  updateJob(job.id, { status: 'completed', responseType: mime || 'audio/mpeg', responseBinaryBase64: b64 })
                  didHandleAsAudio = true
                }
              } else {
                const finalType = (declaredType && typeof declaredType === 'string' ? declaredType : 'audio/mpeg')
                updateJob(job.id, { status: 'completed', responseType: finalType, responseBinaryBase64: audioB64Candidate })
                didHandleAsAudio = true
              }
            }
          } catch {}

          if (!didHandleAsAudio) {
            updateJob(job.id, { status: 'completed', responseText: text, responseType: rawType })
          }
        }
      } catch (err: any) {
        updateJob(job.id, { status: 'failed', error: err?.message || 'unknown error' })
      }
    })()

    return NextResponse.json({ jobId: job.id }, { status: 202 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'bad request' }, { status: 400 })
  }
}


