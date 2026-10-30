import { prisma } from '@/lib/prisma'

// GET /api/admin/businesses?all=true  OR  ?email=...  OR  ?id=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const all   = searchParams.get('all')
    const email = searchParams.get('email')
    const id    = searchParams.get('id')

    const includeRelations = {
      category: true,
      businessType: true,
      businessCategory: true,
    }

    if (all === 'true') {
      const businesses = await prisma.business.findMany({
        include: includeRelations,
        orderBy: { createdAt: 'desc' },
      })
      return Response.json({ success: true, data: businesses })
    }

    if (!email && !id) {
      return Response.json({ success: false, error: 'email, id, or all=true query param required' }, { status: 400 })
    }

    const business = email
      ? await prisma.business.findFirst({
          where: { email: { equals: email.trim() } },
          include: includeRelations,
        })
      : await prisma.business.findUnique({
          where: { id: parseInt(id, 10) },
          include: includeRelations,
        })

    // Return success:true even when no record exists so the UI can
    // distinguish "no profile yet" (data: null) from a server error.
    return Response.json({ success: true, data: business ?? null })
  } catch (error) {
    console.error('Error fetching business:', error)
    return Response.json({ success: false, error: 'Failed to fetch business profile' }, { status: 500 })
  }
}

// PUT /api/admin/businesses  { id, verificationStatus, categoryId, latitude, longitude }
export async function PUT(request) {
  try {
    const { id, verificationStatus, categoryId, latitude, longitude } = await request.json()

    if (!id) {
      return Response.json({ success: false, error: 'Business id is required' }, { status: 400 })
    }

    const data = {}
    if (verificationStatus) {
      const allowed = ['PENDING', 'APPROVED', 'REJECTED']
      if (!allowed.includes(verificationStatus)) {
        return Response.json({ success: false, error: 'Invalid verificationStatus value' }, { status: 400 })
      }
      data.verificationStatus = verificationStatus
    }

    if (categoryId !== undefined) {
      data.categoryId = categoryId ? parseInt(categoryId, 10) : null
    }

    if (latitude !== undefined) {
      data.latitude = latitude !== null && latitude !== '' ? parseFloat(latitude) : null
    }

    if (longitude !== undefined) {
      data.longitude = longitude !== null && longitude !== '' ? parseFloat(longitude) : null
    }

    const business = await prisma.business.update({
      where: { id: parseInt(id, 10) },
      data,
      include: {
        category: true,
        businessType: true,
        businessCategory: true,
      },
    })

    return Response.json({ success: true, data: business })
  } catch (error) {
    console.error('Error updating business:', error)
    return Response.json({ success: false, error: 'Failed to update business' }, { status: 500 })
  }
}
