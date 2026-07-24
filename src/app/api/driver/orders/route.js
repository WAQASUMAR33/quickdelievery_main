import { prisma } from '@/lib/prisma'

/**
 * GET  /api/driver/orders
 * Fetch orders available/assigned to a driver.
 *  - ?status=PENDING|PROCESSING|SHIPPED|DELIVERED|CANCELLED
 *  - ?driverId=<uid>   (future: when driver assignment column exists)
 *  - ?history=true      only delivered/cancelled orders
 *  - ?page=1&limit=10
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status    = searchParams.get('status')
    const history   = searchParams.get('history') === 'true'
    const page      = parseInt(searchParams.get('page'))  || 1
    const limit     = parseInt(searchParams.get('limit')) || 20
    const driverId  = parseInt(searchParams.get('driverId'))

    const whereClause = {}
    if (driverId) {
      whereClause.driverId = driverId
    }

    if (history) {
      // Only completed orders
      whereClause.status = { in: ['DELIVERED', 'CANCELLED'] }
    } else if (status) {
      whereClause.status = status
    } else {
      // Active orders: everything except delivered & cancelled
      whereClause.status = { in: ['PENDING', 'PROCESSING', 'SHIPPED'] }
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                vendor: {
                  select: {
                    id: true,
                    uid: true,
                    username: true,
                    email: true,
                    phoneNumber: true,
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
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalCount = await prisma.order.count({ where: whereClause })

    return Response.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching driver orders:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch driver orders' },
      { status: 500 },
    )
  }
}

/**
 * PUT  /api/driver/orders
 * Driver updates delivery status of an order.
 * Body: { orderId: number, status: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' }
 */
export async function PUT(request) {
  try {
    const { orderId, status } = await request.json()

    if (!orderId) {
      return Response.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 },
      )
    }

    const validStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(status)) {
      return Response.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 },
      )
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                vendor: {
                  select: {
                    id: true,
                    uid: true,
                    username: true,
                    email: true,
                    phoneNumber: true,
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
            email: true,
            phoneNumber: true,
          },
        },
      },
    })

    return Response.json({
      success: true,
      data: updatedOrder,
      message: `Order status updated to ${status}`,
    })
  } catch (error) {
    console.error('Error updating driver order:', error)
    return Response.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 },
    )
  }
}
