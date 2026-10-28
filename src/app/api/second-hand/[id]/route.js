import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// GET: Single 2nd hand item details
export async function GET(request, context) {
  try {
    const { id } = await context.params
    const itemId = Number(id)
    if (!itemId) {
      return NextResponse.json({ success: false, error: 'Invalid item ID' }, { status: 400 })
    }

    const item = await prisma.secondHandItem.findUnique({
      where: { id: itemId },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            image: true,
            role: true,
            createdAt: true,
          },
        },
        offers: {
          include: {
            buyer: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    // Increment view count asynchronously
    prisma.secondHandItem.update({
      where: { id: itemId },
      data: { viewsCount: { increment: 1 } },
    }).catch(() => {})

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('Failed to get 2nd hand item:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch item' }, { status: 500 })
  }
}

// PUT: Update 2nd hand item or status (AVAILABLE, SOLD, INACTIVE)
export async function PUT(request, context) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const itemId = Number(id)
    const body = await request.json()

    const existing = await prisma.secondHandItem.findUnique({
      where: { id: itemId },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    if (existing.sellerId !== authUser.id && authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only the seller can update this item' }, { status: 403 })
    }

    const updated = await prisma.secondHandItem.update({
      where: { id: itemId },
      data: {
        ...(body.title && { title: body.title.trim() }),
        ...(body.description !== undefined && { description: body.description.trim() }),
        ...(body.category && { category: body.category }),
        ...(body.condition && { condition: body.condition }),
        ...(body.price && { price: Number(body.price) }),
        ...(body.status && { status: body.status }),
        ...(body.city && { city: body.city.trim() }),
        ...(body.location !== undefined && { location: body.location ? body.location.trim() : null }),
        ...(body.contactPhone !== undefined && { contactPhone: body.contactPhone ? body.contactPhone.trim() : null }),
        ...(body.allowOffers !== undefined && { allowOffers: Boolean(body.allowOffers) }),
      },
    })

    return NextResponse.json({ success: true, data: updated, message: 'Item updated successfully' })
  } catch (error) {
    console.error('Failed to update 2nd hand item:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update item' }, { status: 500 })
  }
}

// DELETE: Delete 2nd hand item
export async function DELETE(request, context) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const itemId = Number(id)

    const existing = await prisma.secondHandItem.findUnique({
      where: { id: itemId },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    if (existing.sellerId !== authUser.id && authUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Only the seller can delete this item' }, { status: 403 })
    }

    await prisma.secondHandItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true, message: 'Item removed successfully' })
  } catch (error) {
    console.error('Failed to delete 2nd hand item:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to delete item' }, { status: 500 })
  }
}
