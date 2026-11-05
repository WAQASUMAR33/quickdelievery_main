import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, ADMIN_ROLES } from '@/lib/auth-server'
import { invalidateSocialLinksCache } from '@/app/api/social-links/route'

/**
 * PUT /api/admin/social-links/[id]
 * Update an existing social media link
 */
export async function PUT(request, { params }) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const linkId = Number(id)
    if (isNaN(linkId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })
    }

    const body = await request.json()
    const { title, link, icon, isActive, sortOrder } = body

    const existing = await prisma.socialLink.findUnique({
      where: { id: linkId },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Social link not found' }, { status: 404 })
    }

    const updateData = {}
    if (title !== undefined) updateData.title = title.trim()
    if (link !== undefined) updateData.link = link.trim()
    if (icon !== undefined) updateData.icon = icon.trim()
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (sortOrder !== undefined && !isNaN(Number(sortOrder))) updateData.sortOrder = Number(sortOrder)

    const updated = await prisma.socialLink.update({
      where: { id: linkId },
      data: updateData,
    })

    invalidateSocialLinksCache()

    return NextResponse.json({
      success: true,
      message: 'Social link updated successfully',
      data: updated,
    })
  } catch (error) {
    console.error('Failed to update social link:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update social link' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/social-links/[id]
 * Remove an existing social media link
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const linkId = Number(id)
    if (isNaN(linkId)) {
      return NextResponse.json({ success: false, error: 'Invalid ID' }, { status: 400 })
    }

    const existing = await prisma.socialLink.findUnique({
      where: { id: linkId },
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Social link not found' }, { status: 404 })
    }

    await prisma.socialLink.delete({
      where: { id: linkId },
    })

    invalidateSocialLinksCache()

    return NextResponse.json({
      success: true,
      message: 'Social link deleted successfully',
      id: linkId,
    })
  } catch (error) {
    console.error('Failed to delete social link:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete social link' },
      { status: 500 }
    )
  }
}

