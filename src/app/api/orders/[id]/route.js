import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    
    // Check if Prisma client is available
    if (!prisma) {
      return Response.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 })
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
                vendor: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            phoneNumber: true,
            role: true
          }
        }
      }
    })

    if (!order) {
      return Response.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 })
    }

    return Response.json({
      success: true,
      data: order
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch order details'
    }, { status: 500 })
  }
}
