// src/app/api/customer/categories/route.js
import { prisma } from '@/lib/prisma'

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const vertical = searchParams.get('vertical')

        const where = {
            products: {
                some: {
                    status: true,
                    approvalStatus: 'Approved',
                },
            },
        }

        if (vertical) {
            where.vertical = vertical
        }

        const categories = await prisma.category.findMany({
            where,
            select: {
                id: true,
                name: true,
                code: true,
                image: true,
                vertical: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        return Response.json({ success: true, data: categories })
    } catch (error) {
        console.error('Failed to fetch categories:', error)
        return Response.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
    }
}