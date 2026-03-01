import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const categories = await prisma.businessCategory.findMany({
      orderBy: { categoryTitle: 'asc' }
    })
    return Response.json({ success: true, data: categories })
  } catch (error) {
    console.error('Business categories fetch error:', error)
    return Response.json({ success: false, error: 'Failed to fetch business categories' }, { status: 500 })
  }
}
