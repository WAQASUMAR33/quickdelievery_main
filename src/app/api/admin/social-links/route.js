import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, ADMIN_ROLES } from '@/lib/auth-server'
import { invalidateSocialLinksCache } from '@/app/api/social-links/route'

/**
 * GET /api/admin/social-links
 * Fetch all social links for administration (including active & inactive)
 */
export async function GET(request) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const links = await prisma.socialLink.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    })

    return NextResponse.json({
      success: true,
      data: links,
    })
  } catch (error) {
    console.error('Failed to get admin social links:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get social links' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/social-links
 * Create a new social media link or batch reorder
 */
export async function POST(request) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await request.json()

    // Handle batch reordering
    if (Array.isArray(body?.items)) {
      await prisma.$transaction(
        body.items.map((item, index) =>
          prisma.socialLink.update({
            where: { id: Number(item.id) },
            data: { sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : index },
          })
        )
      )
      invalidateSocialLinksCache()
      const updated = await prisma.socialLink.findMany({
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      })
      return NextResponse.json({
        success: true,
        message: 'Order updated successfully',
        data: updated,
      })
    }

    const { title, link, icon, isActive = true, sortOrder } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }
    if (!link || !link.trim()) {
      return NextResponse.json({ success: false, error: 'Destination URL is required' }, { status: 400 })
    }

    let finalOrder = sortOrder
    if (finalOrder === undefined || finalOrder === null || isNaN(finalOrder)) {
      const highest = await prisma.socialLink.findFirst({
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      })
      finalOrder = (highest?.sortOrder ?? -1) + 1
    }

    const newLink = await prisma.socialLink.create({
      data: {
        title: title.trim(),
        link: link.trim(),
        icon: (icon || 'globe').trim(),
        isActive: Boolean(isActive),
        sortOrder: Number(finalOrder),
      },
    })

    invalidateSocialLinksCache()

    return NextResponse.json({
      success: true,
      message: 'Social link created successfully',
      data: newLink,
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create social link:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create social link' },
      { status: 500 }
    )
  }
}

