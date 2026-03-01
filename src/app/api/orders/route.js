import { prisma } from '@/lib/prisma'

// Test prisma connection
if (!prisma) {
  console.error('Prisma client is not initialized')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10

    // Build where clause
    const whereClause = {}
    
    if (userId) {
      whereClause.userId = userId
    }
    
    if (status) {
      whereClause.status = status
    }

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where: whereClause,
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
            phoneNumber: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count
    const totalCount = await prisma.order.count({ where: whereClause })

    return Response.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch orders'
    }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // Check if Prisma client is available and DATABASE_URL is configured
    if (!prisma || !process.env.DATABASE_URL) {
      console.error('❌ Database not configured. DATABASE_URL environment variable is missing.')
      console.log('📋 Please follow DATABASE_SETUP.md for configuration instructions.')
      return Response.json({
        success: false,
        error: 'Database not configured. Please set DATABASE_URL in your .env file.',
        help: 'Check DATABASE_SETUP.md for setup instructions'
      }, { status: 500 })
    }

    const body = await request.json()
    const { userId, items, shippingAddress, paymentMethod, totalAmount } = body
    
    console.log('Order creation request:', { userId, itemCount: items?.length, totalAmount })
    
    // Enhanced validation
    if (!userId) {
      return Response.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({
        success: false,
        error: 'Order items are required'
      }, { status: 400 })
    }

    // Validate items format
    for (const item of items) {
      if (!item.proId || !item.quantity || !item.price) {
        return Response.json({
          success: false,
          error: 'Each item must have proId, quantity, and price'
        }, { status: 400 })
      }
    }

    if (!totalAmount || totalAmount <= 0) {
      return Response.json({
        success: false,
        error: 'Total amount must be greater than 0'
      }, { status: 400 })
    }

    // Check if user exists
    const userExists = await prisma.users.findUnique({
      where: { id: userId }
    })

    if (!userExists) {
      return Response.json({
        success: false,
        error: 'User not found'
      }, { status: 404 })
    }

    // Verify products exist and are available
    const productIds = items.map(item => parseInt(item.proId))
    const products = await prisma.product.findMany({
      where: { 
        proId: { in: productIds },
        approvalStatus: 'Approved' // Only allow approved products
      }
    })

    if (products.length !== productIds.length) {
      return Response.json({
        success: false,
        error: 'Some products are not available or not approved'
      }, { status: 400 })
    }

    // Create order with items in a transaction
    console.log('Starting order creation transaction...')
    
    let order
    try {
      order = await prisma.$transaction(async (tx) => {
        console.log('Inside transaction - creating order...')
        
        const newOrder = await tx.order.create({
          data: {
            userId,
            status: 'PENDING',
            shippingAddress: shippingAddress || '',
            paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
            totalAmount: parseFloat(totalAmount),
            orderItems: {
              create: items.map(item => ({
                productId: parseInt(item.proId),
                quantity: parseInt(item.quantity),
                price: parseFloat(item.price)
              }))
            }
          },
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
                phoneNumber: true
              }
            }
          }
        })

        console.log('Order created successfully:', newOrder.id)
        return newOrder
      })
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError)
      throw transactionError
    }

    return Response.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('Error creating order:', error)
    
    // More detailed error handling for Vercel deployment
    if (error.code === 'P2002') {
      return Response.json({
        success: false,
        error: 'Duplicate order detected'
      }, { status: 409 })
    }
    
    if (error.code === 'P2025') {
      return Response.json({
        success: false,
        error: 'Referenced record not found'
      }, { status: 404 })
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      return Response.json({
        success: false,
        error: 'Database operation failed'
      }, { status: 500 })
    }

    return Response.json({
      success: false,
      error: 'Failed to create order. Please try again.'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { orderId, status, shippingAddress, paymentMethod } = await request.json()
    
    if (!orderId) {
      return Response.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 })
    }

    const updateData = {}
    if (status) updateData.status = status
    if (shippingAddress) updateData.shippingAddress = shippingAddress
    if (paymentMethod) updateData.paymentMethod = paymentMethod

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
            phoneNumber: true
          }
        }
      }
    })

    return Response.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return Response.json({
      success: false,
      error: 'Failed to update order'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      return Response.json({
        success: false,
        error: 'Order ID is required'
      }, { status: 400 })
    }

    // Delete order items first (due to foreign key constraints)
    await prisma.orderItem.deleteMany({
      where: { orderId: orderId }
    })

    // Delete the order
    await prisma.order.delete({
      where: { id: orderId }
    })

    return Response.json({
      success: true,
      message: 'Order deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting order:', error)
    return Response.json({
      success: false,
      error: 'Failed to delete order'
    }, { status: 500 })
  }
}
