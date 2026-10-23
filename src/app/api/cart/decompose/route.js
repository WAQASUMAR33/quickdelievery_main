import { NextResponse } from 'next/server'
import { decomposeCartItems } from '@/lib/fulfillmentEngine'

export async function POST(req) {
  try {
    const body = await req.json()
    const { items = [], options = {} } = body

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Items must be an array' }, { status: 400 })
    }

    const decomposed = decomposeCartItems(items, options)

    return NextResponse.json({
      success: true,
      data: decomposed,
    })
  } catch (error) {
    console.error('Cart decomposition error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
