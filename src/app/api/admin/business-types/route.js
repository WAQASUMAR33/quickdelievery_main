import { prisma } from '@/lib/prisma'

const include = { businessCategory: { select: { id: true, categoryTitle: true } } }

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''

    const where = search
      ? { typeTitle: { contains: search, mode: 'insensitive' } }
      : {}

    const [types, total] = await Promise.all([
      prisma.businessType.findMany({
        where,
        include,
        orderBy: { typeTitle: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.businessType.count({ where }),
    ])

    return Response.json({
      success: true,
      data: types,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching business types:', error)
    return Response.json({ success: false, error: 'Failed to fetch business types' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { typeTitle, businessCategoryId } = await request.json()
    if (!typeTitle?.trim()) {
      return Response.json({ success: false, error: 'Type title is required' }, { status: 400 })
    }

    const type = await prisma.businessType.create({
      data: {
        typeTitle: typeTitle.trim(),
        businessCategoryId: businessCategoryId ? parseInt(businessCategoryId) : null,
      },
      include,
    })

    return Response.json({ success: true, data: type }, { status: 201 })
  } catch (error) {
    console.error('Error creating business type:', error)
    return Response.json({ success: false, error: 'Failed to create business type' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, typeTitle, businessCategoryId } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: 'Type ID is required' }, { status: 400 })
    }
    if (!typeTitle?.trim()) {
      return Response.json({ success: false, error: 'Type title is required' }, { status: 400 })
    }

    const type = await prisma.businessType.update({
      where: { id },
      data: {
        typeTitle: typeTitle.trim(),
        businessCategoryId: businessCategoryId ? parseInt(businessCategoryId) : null,
      },
      include,
    })

    return Response.json({ success: true, data: type })
  } catch (error) {
    console.error('Error updating business type:', error)
    return Response.json({ success: false, error: 'Failed to update business type' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id'))
    if (!id) {
      return Response.json({ success: false, error: 'Type ID is required' }, { status: 400 })
    }

    await prisma.businessType.delete({ where: { id } })

    return Response.json({ success: true, message: 'Business type deleted successfully' })
  } catch (error) {
    console.error('Error deleting business type:', error)
    return Response.json({ success: false, error: 'Failed to delete business type' }, { status: 500 })
  }
}
