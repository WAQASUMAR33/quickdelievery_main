import { NextResponse } from 'next/server'
import { parseConversationalShoppingQuery } from '@/lib/aiOptimizer'

export async function POST(request) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query) {
      return NextResponse.json({ error: 'Conversational query is required' }, { status: 400 })
    }

    const proposal = await parseConversationalShoppingQuery(query)
    return NextResponse.json({
      success: true,
      ...proposal,
    })
  } catch (error) {
    console.error('AI shopping assistant error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
