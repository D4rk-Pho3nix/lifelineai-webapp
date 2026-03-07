import { NextResponse } from "next/server"
import { getJob, debugJobs } from "@/lib/job-store"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log('Audio endpoint called with jobId:', params.id)
  
  // Debug all jobs in store
  debugJobs()
  
  const job = getJob(params.id)
  console.log('Job found:', !!job)
  console.log('Job data:', job ? {
    id: job.id,
    status: job.status,
    hasAudioData: !!job.responseBinaryBase64,
    responseType: job.responseType
  } : 'null')
  
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 })

  if (!job.responseBinaryBase64) {
    console.log('Job found but no audio data')
    return NextResponse.json({ error: "no audio for this job" }, { status: 404 })
  }

  const buffer = Buffer.from(job.responseBinaryBase64, 'base64')
  const contentType = job.responseType || 'audio/mpeg'

  // Byte-range support for reliable playback and seeking
  // Manually parse Range header from the global request (Next.js edge/runtime nuance)
  const range = request.headers.get('range') || undefined

  if (range) {
    const size = buffer.length
    const match = /bytes=(\d+)-(\d+)?/.exec(range)
    const start = match ? parseInt(match[1], 10) : 0
    const end = match && match[2] ? Math.min(parseInt(match[2], 10), size - 1) : size - 1
    if (start >= size || end < start) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          'Content-Range': `bytes */${size}`,
        },
      })
    }

    const chunk = buffer.subarray(start, end + 1)
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(chunk.length),
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline; filename="response"',
      },
    })
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-store',
      'Content-Length': String(buffer.length),
      'Content-Disposition': 'inline; filename="response"',
    },
  })
}


