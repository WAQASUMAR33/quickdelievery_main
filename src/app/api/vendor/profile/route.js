import { prisma } from '@/lib/prisma'

// GET /api/vendor/profile?email=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return Response.json({ success: false, error: 'email query param required' }, { status: 400 })
    }

    const business = await prisma.business.findUnique({
      where: { email },
      include: { businessType: true, businessCategory: true },
    })

    return Response.json({ success: true, data: business ?? null })
  } catch (error) {
    console.error('Error fetching vendor profile:', error)
    return Response.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH /api/vendor/profile  { email, latitude, longitude }
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { email, latitude, longitude } = body

    if (!email) {
      return Response.json({ success: false, error: 'email is required' }, { status: 400 })
    }
    if (latitude == null || longitude == null) {
      return Response.json({ success: false, error: 'latitude and longitude are required' }, { status: 400 })
    }

    const business = await prisma.business.update({
      where: { email },
      data: {
        latitude:  parseFloat(latitude),
        longitude: parseFloat(longitude),
      },
    })

    return Response.json({ success: true, data: { latitude: business.latitude, longitude: business.longitude } })
  } catch (error) {
    console.error('Error updating vendor location:', error)
    if (error.code === 'P2025') {
      return Response.json({ success: false, error: 'Business profile not found for this email' }, { status: 404 })
    }
    return Response.json({ success: false, error: 'Failed to update location' }, { status: 500 })
  }
}
