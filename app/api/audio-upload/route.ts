import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const sessionId = formData.get("sessionId") as string
    const userId = formData.get("userId") as string
    const webhookUrl = formData.get("webhookUrl") as string

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    if (!webhookUrl || webhookUrl === "[PLACE_YOUR_WEBHOOK_URL_HERE]") {
      return NextResponse.json({ error: "Webhook URL not configured. Please set it in the settings." }, { status: 400 })
    }

    // Convert File to ArrayBuffer for sending to webhook
    const audioBuffer = await audioFile.arrayBuffer()
    
    // Create new FormData for webhook
    const webhookFormData = new FormData()
    webhookFormData.append("audio", new Blob([audioBuffer], { type: "audio/ogg" }), "recording.ogg")
    webhookFormData.append("sessionId", sessionId || "")
    webhookFormData.append("userId", userId || "")
    webhookFormData.append("timestamp", new Date().toISOString())

    // Send to webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      body: webhookFormData,
    })

    if (!webhookResponse.ok) {
      throw new Error(`Webhook request failed: ${webhookResponse.status}`)
    }

    const webhookResult = await webhookResponse.text()

    return NextResponse.json({ 
      success: true, 
      message: "Audio uploaded successfully",
      webhookResponse: webhookResult 
    })

  } catch (error) {
    console.error("Audio upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload audio", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
