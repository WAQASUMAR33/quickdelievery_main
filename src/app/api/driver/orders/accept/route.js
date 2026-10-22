import { prisma } from '@/lib/prisma'
import { broadcastRealtimeEvent } from '@/lib/realtime'

/**
 * POST /api/driver/orders/accept
 * Driver claims an unassigned order from the open pool.
 * Body: { orderId: number, driverId: number }
 */
export async function POST(request) {
  try {
    const { orderId, driverId } = await request.json()

    if (!orderId || !driverId) {
      return Response.json(
        { success: false, error: 'orderId and driverId are required' },
        { status: 400 }
      )
    }

    const numOrderId = parseInt(orderId, 10)
    const numDriverId = parseInt(driverId, 10)

    // Check if order exists and is unassigned
    const order = await prisma.order.findUnique({
      where: { id: numOrderId },
    })

    if (!order) {
      return Response.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.driverId !== null && order.driverId !== numDriverId) {
      return Response.json(
        { success: false, error: 'This order has already been accepted by another driver.' },
        { status: 409 }
      )
    }

    // Enforce Foodpanda stacking limit: maximum 2 active orders per rider
    const activeOrdersCount = await prisma.order.count({
      where: {
        driverId: numDriverId,
        status: { in: ['PENDING', 'PROCESSING', 'SHIPPED'] },
      },
    })

    if (activeOrdersCount >= 2) {
      return Response.json(
        { success: false, error: 'Stacking limit reached: You can only hold 2 active orders simultaneously.' },
        { status: 400 }
      )
    }

    // Accept order and update driver duty status
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: numOrderId },
        data: {
          driverId: numDriverId,
          status: 'PROCESSING',
        },
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

      // Update driver dutyStatus to ON_DELIVERY
      await tx.driverProfile.updateMany({
        where: { userId: numDriverId },
        data: { dutyStatus: 'ON_DELIVERY' },
      })

      return updatedOrder
    })

    // Broadcast real-time order update to customer and dispatchers
    try {
      broadcastRealtimeEvent('ORDER_UPDATED', {
        orderId: result.id,
        status: result.status,
        driverId: result.driverId,
        order: result,
      })
    } catch (err) {
      console.warn('Realtime accept broadcast error:', err)
    }

    return Response.json({
      success: true,
      data: result,
      message: 'Order accepted successfully. Proceed to vendor for pickup.',
    })
  } catch (error) {
    console.error('Error accepting driver order:', error)
    return Response.json(
      { success: false, error: error.message || 'Failed to accept order' },
      { status: 500 }
    )
  }
}
