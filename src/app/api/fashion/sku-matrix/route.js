import { NextResponse } from 'next/server'
import { getProductSkuMatrix } from '@/lib/verticals/fashionService'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId parameter is required' }, { status: 400 })
    }

    const data = await getProductSkuMatrix(productId)
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Fetch SKU matrix error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
