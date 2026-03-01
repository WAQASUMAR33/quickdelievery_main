import { prisma } from '@/lib/prisma'

// GET /api/admin/businesses?email=...  OR  ?id=...
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const id    = searchParams.get('id')

    if (!email && !id) {
      return Response.json({ success: false, error: 'email or id query param required' }, { status: 400 })
    }

    const where = email ? { email } : { id: parseInt(id) }

    const business = await prisma.business.findUnique({
      where,
      include: {
        businessType:     true,
        businessCategory: true,
      },
    })

    // Return success:true even when no record exists so the UI can
    // distinguish "no profile yet" (data: null) from a server error.
    return Response.json({ success: true, data: business ?? null })
  } catch (error) {
    console.error('Error fetching business:', error)
    return Response.json({ success: false, error: 'Failed to fetch business profile' }, { status: 500 })
  }
}

// PUT /api/admin/businesses  { id, verificationStatus }
export async function PUT(request) {
  try {
    const { id, verificationStatus } = await request.json()

    if (!id) {
      return Response.json({ success: false, error: 'Business id is required' }, { status: 400 })
    }

    const allowed = ['PENDING', 'APPROVED', 'REJECTED']
    if (!allowed.includes(verificationStatus)) {
      return Response.json({ success: false, error: 'Invalid verificationStatus value' }, { status: 400 })
    }

    const business = await prisma.business.update({
      where: { id },
      data:  { verificationStatus },
    })

    return Response.json({ success: true, data: business })
  } catch (error) {
    console.error('Error updating business verification:', error)
    return Response.json({ success: false, error: 'Failed to update business' }, { status: 500 })
  }
}
