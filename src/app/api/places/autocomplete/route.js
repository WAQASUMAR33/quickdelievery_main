import { NextResponse } from 'next/server'

// Top Pakistani cities and hubs fallback
const PK_HUBS = [
  { mainText: 'Mandi Bahauddin', secondaryText: 'Punjab, Pakistan', lat: 32.5798, lng: 73.4813 },
  { mainText: 'Phalia', secondaryText: 'Mandi Bahauddin, Punjab, Pakistan', lat: 32.4287, lng: 73.5794 },
  { mainText: 'Malakwal', secondaryText: 'Mandi Bahauddin, Punjab, Pakistan', lat: 32.5539, lng: 73.2131 },
  { mainText: 'Gujrat City', secondaryText: 'Punjab, Pakistan', lat: 32.5742, lng: 74.0754 },
  { mainText: 'Kharian', secondaryText: 'Gujrat, Punjab, Pakistan', lat: 32.8136, lng: 73.8824 },
  { mainText: 'Gulberg III', secondaryText: 'Lahore, Punjab, Pakistan', lat: 31.5126, lng: 74.3524 },
  { mainText: 'DHA Phase 5', secondaryText: 'Lahore, Punjab, Pakistan', lat: 31.4648, lng: 74.4057 },
  { mainText: 'Model Town', secondaryText: 'Lahore, Punjab, Pakistan', lat: 31.4889, lng: 74.3218 },
  { mainText: 'Johar Town', secondaryText: 'Lahore, Punjab, Pakistan', lat: 31.4697, lng: 74.2728 },
  { mainText: 'Allama Iqbal Town', secondaryText: 'Lahore, Punjab, Pakistan', lat: 31.5134, lng: 74.2868 },
  { mainText: 'Blue Area', secondaryText: 'Islamabad, Pakistan', lat: 33.7128, lng: 73.0645 },
  { mainText: 'F-6 Markaz', secondaryText: 'Islamabad, Pakistan', lat: 33.7297, lng: 73.0762 },
  { mainText: 'F-7 Markaz (Jinnah Super)', secondaryText: 'Islamabad, Pakistan', lat: 33.7214, lng: 73.0558 },
  { mainText: 'F-10 Markaz', secondaryText: 'Islamabad, Pakistan', lat: 33.6938, lng: 73.0118 },
  { mainText: 'G-11 Markaz', secondaryText: 'Islamabad, Pakistan', lat: 33.6698, lng: 72.9984 },
  { mainText: 'Saddar', secondaryText: 'Rawalpindi, Punjab, Pakistan', lat: 33.5986, lng: 73.0538 },
  { mainText: 'Bahria Town Phase 4', secondaryText: 'Rawalpindi, Pakistan', lat: 33.5358, lng: 73.1094 },
  { mainText: 'Clifton Block 2', secondaryText: 'Karachi, Sindh, Pakistan', lat: 24.8185, lng: 67.0322 },
  { mainText: 'DHA Phase 6', secondaryText: 'Karachi, Sindh, Pakistan', lat: 24.7892, lng: 67.0658 },
  { mainText: 'Gulshan-e-Iqbal', secondaryText: 'Karachi, Sindh, Pakistan', lat: 24.9207, lng: 67.0928 },
  { mainText: 'Faisalabad Clock Tower', secondaryText: 'Faisalabad, Punjab, Pakistan', lat: 31.4187, lng: 73.0791 },
  { mainText: 'Multan Cantt', secondaryText: 'Multan, Punjab, Pakistan', lat: 30.1833, lng: 71.4500 },
  { mainText: 'Sialkot Cantt', secondaryText: 'Sialkot, Punjab, Pakistan', lat: 32.5278, lng: 74.5422 },
  { mainText: 'Peshawar University Town', secondaryText: 'Peshawar, KPK, Pakistan', lat: 34.0086, lng: 71.4925 },
]

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const input = (searchParams.get('input') || '').trim()

    if (!input || input.length < 2) {
      return NextResponse.json({ success: true, predictions: [] })
    }

    const apiKey =
      process.env.GOOGLE_GEOCODING_API_KEY ||
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      'AIzaSyAcrb8vKlJwdIpLc3BJUeUxgjwL79P3xfc'

    // 1. Try Google Places Autocomplete API
    if (apiKey) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input
        )}&components=country:pk&key=${apiKey}`
        const res = await fetch(url, { headers: { Accept: 'application/json' } })
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'OK' && Array.isArray(data.predictions) && data.predictions.length > 0) {
            const predictions = data.predictions.map(item => ({
              description: item.description || '',
              placeId: item.place_id || '',
              mainText: item.structured_formatting?.main_text || item.description || '',
              secondaryText: item.structured_formatting?.secondary_text || 'Pakistan',
            }))
            return NextResponse.json({ success: true, predictions, source: 'google' })
          }
        }
      } catch (err) {
        console.warn('[Places API] Google Places error:', err)
      }
    }

    // 2. Fallback: Filter curated Pakistani hubs
    const qLower = input.toLowerCase()
    const matchedHubs = PK_HUBS.filter(
      h =>
        h.mainText.toLowerCase().includes(qLower) ||
        h.secondaryText.toLowerCase().includes(qLower)
    ).slice(0, 5)

    if (matchedHubs.length > 0) {
      const predictions = matchedHubs.map((h, i) => ({
        description: `${h.mainText}, ${h.secondaryText}`,
        placeId: `hub_${i}_${h.lat}_${h.lng}`,
        mainText: h.mainText,
        secondaryText: h.secondaryText,
        lat: h.lat,
        lng: h.lng,
      }))
      return NextResponse.json({ success: true, predictions, source: 'curated' })
    }

    // 3. Fallback: OpenStreetMap Nominatim
    try {
      const osmUrl = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pk&limit=6&q=${encodeURIComponent(
        input
      )}`
      const osmRes = await fetch(osmUrl, {
        headers: { 'User-Agent': 'MartZona-Places/1.0' },
      })
      if (osmRes.ok) {
        const osmData = await osmRes.json()
        if (Array.isArray(osmData) && osmData.length > 0) {
          const predictions = osmData.map(item => {
            const parts = (item.display_name || '').split(',')
            const main = parts[0]?.trim() || input
            const sec = parts.slice(1, 4).join(',').trim() || 'Pakistan'
            return {
              description: item.display_name,
              placeId: `osm_${item.place_id || item.osm_id}`,
              mainText: main,
              secondaryText: sec,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
            }
          })
          return NextResponse.json({ success: true, predictions, source: 'nominatim' })
        }
      }
    } catch (osmErr) {
      console.warn('[Places API] Nominatim error:', osmErr)
    }

    return NextResponse.json({ success: true, predictions: [] })
  } catch (error) {
    console.error('Places autocomplete error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

