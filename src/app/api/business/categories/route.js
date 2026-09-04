import { prisma } from '@/lib/prisma'

// GET /api/business/categories — returns business categories with their types
export async function GET() {
  try {
    const categories = await prisma.businessCategory.findMany({
      include: {
        businessTypes: {
          orderBy: { typeTitle: 'asc' },
        },
      },
      orderBy: { categoryTitle: 'asc' },
    })

    return Response.json({ success: true, data: categories })
  } catch (error) {
    console.error('Error fetching business categories:', error)
    return Response.json({ success: false, error: 'Failed to fetch business categories' }, { status: 500 })
  }
}
