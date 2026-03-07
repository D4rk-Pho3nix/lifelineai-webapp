import { NextRequest, NextResponse } from "next/server"
import { getJob, updateJob } from "@/lib/job-store"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = getJob(params.id)
    if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const body = await request.json()
    const responseType = (body?.responseType as string) || 'text/plain'
    const responseText = (body?.responseText as string) || undefined
    const responseBinaryBase64 = (body?.responseBinaryBase64 as string) || undefined

    if (responseType.startsWith('audio/')) {
      if (!responseBinaryBase64) return NextResponse.json({ error: 'responseBinaryBase64 required for audio' }, { status: 400 })
      updateJob(job.id, { status: 'completed', responseType, responseBinaryBase64 })
    } else {
      updateJob(job.id, { status: 'completed', responseType, responseText: responseText || '' })
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'bad request' }, { status: 400 })
  }
}



