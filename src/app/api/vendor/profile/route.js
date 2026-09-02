import { prisma } from '@/lib/prisma'

// GET /api/vendor/profile?email=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawEmail = searchParams.get('email')

    if (!rawEmail) {
      return Response.json({ success: false, error: 'email query param required' }, { status: 400 })
    }

    const email = rawEmail.trim()

    const business = await prisma.business.findFirst({
      where: {
        email: { equals: email },
      },
      include: {
        category: true,
      },
    })

    return Response.json({ success: true, data: business ?? null })
  } catch (error) {
    console.error('Error fetching vendor profile:', error)
    return Response.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

// PATCH /api/vendor/profile  { email, latitude, longitude, categoryId }
export async function PATCH(request) {
  try {
    const body = await request.json()
    const { email, latitude, longitude, categoryId } = body

    if (!email) {
      return Response.json({ success: false, error: 'email is required' }, { status: 400 })
    }

    const updateData = {}
    if (latitude != null) updateData.latitude = parseFloat(latitude)
    if (longitude != null) updateData.longitude = parseFloat(longitude)
    if (categoryId !== undefined) {
      updateData.categoryId = categoryId ? parseInt(categoryId) : null
    }

    const business = await prisma.business.update({
      where: { email: email.trim() },
      data: updateData,
      include: {
        category: true,
      },
    })

    return Response.json({ success: true, data: business })
  } catch (error) {
    console.error('Error updating vendor profile:', error)
    if (error.code === 'P2025') {
      return Response.json({ success: false, error: 'Business profile not found for this email' }, { status: 404 })
    }
    return Response.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
