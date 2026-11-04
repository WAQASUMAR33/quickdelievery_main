import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const placeId = (searchParams.get('placeId') || '').trim()

    if (!placeId) {
      return NextResponse.json({ success: false, error: 'placeId is required' }, { status: 400 })
    }

    // Check if it's a curated hub ID: hub_{i}_{lat}_{lng}
    if (placeId.startsWith('hub_')) {
      const parts = placeId.split('_')
      if (parts.length >= 4) {
        const lat = parseFloat(parts[2])
        const lng = parseFloat(parts[3])
        if (!isNaN(lat) && !isNaN(lng)) {
          return NextResponse.json({
            success: true,
            result: {
              lat,
              lng,
              formattedAddress: searchParams.get('description') || '',
              name: '',
            },
          })
        }
      }
    }

    const apiKey =
      process.env.GOOGLE_GEOCODING_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (apiKey && !placeId.startsWith('osm_') && !placeId.startsWith('hub_')) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId
        )}&fields=geometry,formatted_address,name&key=${apiKey}`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'OK' && data.result) {
            const loc = data.result.geometry?.location
            if (loc && loc.lat && loc.lng) {
              return NextResponse.json({
                success: true,
                result: {
                  lat: loc.lat,
                  lng: loc.lng,
                  formattedAddress: data.result.formatted_address || data.result.name || '',
                  name: data.result.name || '',
                },
              })
            }
          }
        }
      } catch (err) {
        console.warn('[Places Details] Google Places details error:', err)
      }
    }

    return NextResponse.json({ success: false, error: 'Could not fetch place details' }, { status: 404 })
  } catch (error) {
    console.error('Places details error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

