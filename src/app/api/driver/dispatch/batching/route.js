import { NextResponse } from 'next/server'
import { executeOrderBatchingPipeline } from '@/lib/orderBatchingEngine'

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { maxDetourKm = 3.5, maxPrepTimeDiffMinutes = 7 } = body

    const result = await executeOrderBatchingPipeline({
      maxDetourKm,
      maxPrepTimeDiffMinutes,
    })

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Order batching dispatch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await executeOrderBatchingPipeline()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Fetch order batching error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
