import { NextResponse } from 'next/server'
import { processTryAndDecideDecision } from '@/lib/verticals/fashionService'

export async function POST(request) {
  try {
    const body = await request.json()
    const { subOrderId, decisions, courierNotes } = body

    if (!subOrderId || !Array.isArray(decisions) || decisions.length === 0) {
      return NextResponse.json(
        { error: 'subOrderId and decisions array are required' },
        { status: 400 }
      )
    }

    const result = await processTryAndDecideDecision({
      subOrderId,
      decisions,
      courierNotes,
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: `Try & Decide processed. Status: ${result.tryAndDecideStatus}. Instant wallet refund: $${result.totalRefundAmount.toFixed(2)}`,
    })
  } catch (error) {
    console.error('Try & Decide processing error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
