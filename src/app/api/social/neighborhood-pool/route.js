import { NextResponse } from 'next/server'
import { registerInNeighborhoodPool, encodeGeoHash } from '@/lib/socialCommerce'

export async function POST(request) {
  try {
    const body = await request.json()
    const { latitude, longitude, precision = 7 } = body

    if (latitude == null || longitude == null) {
      return NextResponse.json(
        { error: 'latitude and longitude are required' },
        { status: 400 }
      )
    }

    const poolInfo = await registerInNeighborhoodPool(latitude, longitude, precision)

    return NextResponse.json({
      success: true,
      ...poolInfo,
      message: poolInfo.isGroupDiscountUnlocked
        ? '🎉 3+ Neighbors in your zone have pooled orders! Free delivery & 10% group discount unlocked!'
        : `${poolInfo.activeNeighborsCount}/3 orders placed in your neighborhood zone. Order now to trigger group discount!`,
    })
  } catch (error) {
    console.error('Neighborhood pool error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    if (!lat || !lon) {
      return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 })
    }

    const geoHash = encodeGeoHash(lat, lon, 7)
    return NextResponse.json({ success: true, geoHash })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
