import { NextResponse } from 'next/server'
import { calculateVendorTrustScore } from '@/lib/trustFramework'

export async function GET(request, { params }) {
  try {
    const { vendorId } = await params
    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    const score = await calculateVendorTrustScore(vendorId)
    return NextResponse.json({ success: true, trustScore: score })
  } catch (error) {
    console.error('Fetch vendor trust score error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
