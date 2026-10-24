import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const address = searchParams.get('address')
    const googleKey = process.env.GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

    // 1. IP Geolocation request
    if (type === 'ip') {
      const forwarded = request.headers.get('x-forwarded-for')
      const clientIp = forwarded ? forwarded.split(',')[0].trim() : ''
      const isLocal = !clientIp || clientIp === '127.0.0.1' || clientIp === '::1' || clientIp.startsWith('192.168.') || clientIp.startsWith('10.')
      
      const ipUrl = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${clientIp}`
      const ipRes = await fetch(ipUrl, { next: { revalidate: 3600 } })
      const ipData = await ipRes.json()

      if (ipData && ipData.success !== false && ipData.latitude && ipData.longitude) {
        return NextResponse.json({
          success: true,
          latitude: ipData.latitude,
          longitude: ipData.longitude,
          city: ipData.city || '',
          region: ipData.region || '',
          country: ipData.country || '',
          postal: ipData.postal || '',
        })
      }

      return NextResponse.json({ success: false, message: 'Could not determine IP location' }, { status: 404 })
    }

    // 2. Address Geocoding request
    if (!address || !address.trim()) {
      return NextResponse.json({ success: false, message: 'Address parameter is required' }, { status: 400 })
    }

    const trimmed = address.trim()

    // Try Google Geocoding API first
    if (googleKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&key=${googleKey}`
        const gRes = await fetch(gUrl)
        const gData = await gRes.json()

        if (gData.status === 'OK' && gData.results?.length > 0) {
          const first = gData.results[0]
          return NextResponse.json({
            success: true,
            latitude: first.geometry.location.lat,
            longitude: first.geometry.location.lng,
            displayName: first.formatted_address,
            placeId: first.place_id,
            source: 'google',
          })
        }
      } catch (err) {
        console.warn('Google Geocoding error:', err)
      }
    }

    // Fallback: OpenStreetMap Nominatim
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}`
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'QuickDelivery-Geocoding/1.0' },
      })
      const osmData = await osmRes.json()

      if (Array.isArray(osmData) && osmData.length > 0) {
        const first = osmData[0]
        return NextResponse.json({
          success: true,
          latitude: parseFloat(first.lat),
          longitude: parseFloat(first.lon),
          displayName: first.display_name,
          source: 'nominatim',
        })
      }
    } catch (err) {
      console.warn('Nominatim error:', err)
    }

    return NextResponse.json({ success: false, message: `Could not locate address: "${trimmed}"` }, { status: 404 })
  } catch (error) {
    console.error('Geocode route error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Internal server error' }, { status: 500 })
  }
}
