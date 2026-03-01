// src/app/api/customer/categories/route.js
import { prisma } from '@/lib/prisma'

export async function GET() {
	try {
		const categories = await prisma.category.findMany({
			where: {
				// Only fetch categories that have active products associated with them
				products: {
					some: {
						status: true,
						approvalStatus: 'Approved',
					},
				},
			},
			select: {
				id: true,
				name: true,
				// You can add more fields if needed, like an icon field or image
			},
			orderBy: {
				name: 'asc', // Order categories alphabetically
			},
		})

		return Response.json({ success: true, data: categories })
	} catch (error) {
		console.error('Failed to fetch categories:', error)
		return Response.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
	}
}