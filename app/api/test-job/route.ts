import { NextResponse } from "next/server"
import { createJob, getJob, updateJob, debugJobs } from "@/lib/job-store"

export async function GET() {
  try {
    // Create a test job
    const job = createJob()
    console.log('Created test job:', job.id)
    
    // Update it with some test data
    updateJob(job.id, { 
      status: 'completed', 
      responseType: 'audio/mpeg',
      responseBinaryBase64: 'dGVzdA==', // "test" in base64
      responseText: 'Test response'
    })
    
    // Try to retrieve it
    const retrievedJob = getJob(job.id)
    
    // Debug all jobs
    debugJobs()
    
    return NextResponse.json({
      success: true,
      createdJob: job.id,
      retrievedJob: retrievedJob ? {
        id: retrievedJob.id,
        status: retrievedJob.status,
        hasAudioData: !!retrievedJob.responseBinaryBase64,
        responseType: retrievedJob.responseType
      } : null
    })
  } catch (error) {
    console.error('Test job error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
