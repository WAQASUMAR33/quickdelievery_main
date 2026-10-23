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

    // Format and parse product proImages into arrays
    const formattedOrder = {
      ...order,
      orderItems: (order.orderItems || []).map(item => {
        let images = []
        if (item.product?.proImages) {
          if (Array.isArray(item.product.proImages)) {
            images = item.product.proImages
          } else if (typeof item.product.proImages === 'string') {
            try {
              const parsed = JSON.parse(item.product.proImages)
              images = Array.isArray(parsed) ? parsed : [parsed]
            } catch {
              if (item.product.proImages.startsWith('http')) {
                images = [item.product.proImages]
              }
            }
          }
        }
        return {
          ...item,
          product: item.product ? {
            ...item.product,
            proImages: images
          } : item.product
        }
      })
    }

    return Response.json({
      success: true,
      data: formattedOrder
    })
  } catch (error) {
    console.error('Error fetching order:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch order details'
    }, { status: 500 })
  }
}
