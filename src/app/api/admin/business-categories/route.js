import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''

    const where = search
      ? { categoryTitle: { contains: search, mode: 'insensitive' } }
      : {}

    const [categories, total] = await Promise.all([
      prisma.businessCategory.findMany({
        where,
        orderBy: { categoryTitle: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.businessCategory.count({ where }),
    ])

    return Response.json({
      success: true,
      data: categories,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching business categories:', error)
    return Response.json({ success: false, error: 'Failed to fetch business categories' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { categoryTitle } = await request.json()
    if (!categoryTitle?.trim()) {
      return Response.json({ success: false, error: 'Category title is required' }, { status: 400 })
    }

    const category = await prisma.businessCategory.create({
      data: { categoryTitle: categoryTitle.trim() },
    })

    return Response.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    console.error('Error creating business category:', error)
    return Response.json({ success: false, error: 'Failed to create business category' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, categoryTitle } = await request.json()
    if (!id) {
      return Response.json({ success: false, error: 'Category ID is required' }, { status: 400 })
    }
    if (!categoryTitle?.trim()) {
      return Response.json({ success: false, error: 'Category title is required' }, { status: 400 })
    }

    const category = await prisma.businessCategory.update({
      where: { id },
      data: { categoryTitle: categoryTitle.trim() },
    })

    return Response.json({ success: true, data: category })
  } catch (error) {
    console.error('Error updating business category:', error)
    return Response.json({ success: false, error: 'Failed to update business category' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id'))
    if (!id) {
      return Response.json({ success: false, error: 'Category ID is required' }, { status: 400 })
    }

    await prisma.businessCategory.delete({ where: { id } })

    return Response.json({ success: true, message: 'Business category deleted successfully' })
  } catch (error) {
    console.error('Error deleting business category:', error)
    return Response.json({ success: false, error: 'Failed to delete business category' }, { status: 500 })
  }
}
