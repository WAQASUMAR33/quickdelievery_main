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

    const rawTrimmed = address.trim()
    const country = (searchParams.get('country') || 'PK').trim().toUpperCase()
    const region = country.toLowerCase()

    // Common Pakistani city shorthand / colloquial aliases so manual Enter/blur resolves to the major city
    const PK_CITY_ALIASES = {
      mandi: 'Mandi Bahauddin, Pakistan',
      mbdin: 'Mandi Bahauddin, Pakistan',
      mbd: 'Mandi Bahauddin, Pakistan',
      gujrat: 'Gujrat, Punjab, Pakistan',
      lhr: 'Lahore, Pakistan',
      isb: 'Islamabad, Pakistan',
      rwp: 'Rawalpindi, Pakistan',
      fsd: 'Faisalabad, Pakistan',
      grw: 'Gujranwala, Pakistan',
      skt: 'Sialkot, Pakistan',
      khi: 'Karachi, Pakistan',
    }
    const trimmed =
      country === 'PK' && PK_CITY_ALIASES[rawTrimmed.toLowerCase()]
        ? PK_CITY_ALIASES[rawTrimmed.toLowerCase()]
        : rawTrimmed

    // Try Google Geocoding API first (scoped to Pakistan by default so shared city names like Mandi Bahauddin / Gujrat / Hyderabad never resolve to India)
    if (googleKey) {
      try {
        const strictUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&region=${encodeURIComponent(region)}&components=country:${encodeURIComponent(country)}&key=${googleKey}`
        let gRes = await fetch(strictUrl)
        let gData = await gRes.json()

        // If strict country filter returned ZERO_RESULTS (e.g. explicit international address), retry with region bias only
        if (gData.status === 'ZERO_RESULTS') {
          const biasedUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(trimmed)}&region=${encodeURIComponent(region)}&key=${googleKey}`
          gRes = await fetch(biasedUrl)
          gData = await gRes.json()
        }

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

    // Fallback: OpenStreetMap Nominatim (prioritizing Pakistan)
    try {
      const osmStrictUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=${encodeURIComponent(region)}&limit=5&q=${encodeURIComponent(trimmed)}`
      let osmRes = await fetch(osmStrictUrl, {
        headers: { 'User-Agent': 'QuickDelivery-Geocoding/1.0' },
      })
      let osmData = await osmRes.json()

      if (!Array.isArray(osmData) || osmData.length === 0) {
        const osmFallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(trimmed)}`
        osmRes = await fetch(osmFallbackUrl, {
          headers: { 'User-Agent': 'QuickDelivery-Geocoding/1.0' },
        })
        osmData = await osmRes.json()
      }

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
