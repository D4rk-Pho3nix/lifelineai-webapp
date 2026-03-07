import { NextResponse } from "next/server"
import { getJob } from "@/lib/job-store"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const job = getJob(params.id)
  if (!job) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({
    id: job.id,
    status: job.status,
    responseText: job.responseText,
    responseType: job.responseType,
    responseBinaryBase64: job.responseBinaryBase64,
    error: job.error,
  })
}


