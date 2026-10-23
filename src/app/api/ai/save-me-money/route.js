import { NextResponse } from 'next/server'
import { optimizeSaveMeMoney } from '@/lib/aiOptimizer'

export async function POST(request) {
  try {
    const body = await request.json()
    const { budgetLimit, latitude, longitude, categoryIntent, maxDistanceKm } = body

    if (!budgetLimit) {
      return NextResponse.json({ error: 'budgetLimit is required' }, { status: 400 })
    }

    const result = await optimizeSaveMeMoney({
      budgetLimit,
      latitude,
      longitude,
      categoryIntent,
      maxDistanceKm,
    })

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Save Me Money optimization error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
