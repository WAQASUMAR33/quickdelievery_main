import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const types = await prisma.businessType.findMany({
      orderBy: { typeTitle: 'asc' }
    })
    return Response.json({ success: true, data: types })
  } catch (error) {
    console.error('Business types fetch error:', error)
    return Response.json({ success: false, error: 'Failed to fetch business types' }, { status: 500 })
  }
}
