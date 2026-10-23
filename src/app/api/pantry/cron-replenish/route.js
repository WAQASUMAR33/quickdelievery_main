import { NextResponse } from 'next/server'
import { processDuePantryReplenishments } from '@/lib/aiOptimizer'

export async function POST(request) {
  try {
    const result = await processDuePantryReplenishments()
    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Process pantry replenishment error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
