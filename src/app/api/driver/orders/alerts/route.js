import { prisma } from '@/lib/prisma'

/**
 * GET /api/driver/orders/alerts
 * Fetches real-time available orders ready for driver pickup (vendor accepted)
 */
export async function GET(request) {
  try {
    const unassignedOrders = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
        driverId: null,
      },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    username: true,
                    phoneNumber: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    })

    return Response.json({
      success: true,
      data: unassignedOrders,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching driver order alerts:', error)
    return Response.json({ success: false, error: 'Failed to fetch order alerts' }, { status: 500 })
  }
}
