import { prisma } from '@/lib/prisma'
import { computeServiceCharge, computeOrderTotalWithService } from '@/lib/serviceCharge'
import { sendOrderStatusPushNotification } from '@/lib/firebaseAdmin'

// Test prisma connection
if (!prisma) {
  console.error('Prisma client is not initialized')
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const vertical = searchParams.get('vertical') // 'FOOD' or 'GROCERY'

    // Build where clause — orders store numeric users.id; callers may send id or firebase uid string
    const whereClause = {}
    if (vertical) {
      whereClause.vertical = vertical
    }


    const rawUid = searchParams.get('userId')
    if (rawUid !== null && String(rawUid).trim() !== '') {
      const trimmed = String(rawUid).trim()
      const numeric = Number.parseInt(trimmed, 10)
      let dbUserPk = null
      if (
        Number.isFinite(numeric) &&
        numeric > 0 &&
        trimmed === String(numeric)
      ) {
        dbUserPk = numeric
      } else {
        const row = await prisma.users.findUnique({
          where: { uid: trimmed },
          select: { id: true },
        })
        if (row) dbUserPk = row.id
      }
      if (dbUserPk != null) whereClause.userId = dbUserPk
      else whereClause.userId = -1
    }
    
    if (status) {
      whereClause.status = status
    }

    // Vendor scoping: only orders that contain at least one product from this vendor.
    const vendorId = searchParams.get('vendorId')
    if (vendorId !== null && String(vendorId).trim() !== '') {
      whereClause.orderItems = {
        some: { product: { vendorId: String(vendorId).trim() } }
      }
    }

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        review: true,
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
    const { userId, items, shippingAddress, paymentMethod, totalAmount, deliveryLatitude, deliveryLongitude } = body
    
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

    const subtotal = items.reduce(
      (sum, item) => sum + parseFloat(item.price) * parseInt(item.quantity, 10),
      0,
    )
    const roundedSubtotal = Math.round(subtotal * 100) / 100
    const serviceChargeAmt = computeServiceCharge(roundedSubtotal)
    const expectedTotal = computeOrderTotalWithService(roundedSubtotal)
    const clientTotal = Math.round(parseFloat(totalAmount) * 100) / 100
    if (Math.abs(expectedTotal - clientTotal) > 0.02) {
      return Response.json(
        {
          success: false,
          error:
            `Total mismatch (items + service charges). Expected $${expectedTotal.toFixed(2)} including service charge.`,
        },
        { status: 400 },
      )
    }

    // Resolve DB user — client may send numeric `Users.id`, Firebase `Users.uid`, or (invalid) placeholder `guest`.
    const idStr = userId !== null && userId !== undefined ? String(userId).trim() : ''
    if (!idStr || idStr === 'guest') {
      return Response.json({
        success: false,
        error: 'Sign in or register to place an order. Guest checkout is not linked to your database account.',
      }, { status: 403 })
    }

    let userExists = null
    const idParsed = Number.parseInt(idStr, 10)
    if (Number.isFinite(idParsed) && idParsed > 0 && idStr === String(idParsed)) {
      userExists = await prisma.users.findUnique({ where: { id: idParsed } })
    } else {
      userExists = await prisma.users.findUnique({ where: { uid: idStr } })
    }

    if (!userExists) {
      return Response.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    const orderUserDbId = userExists.id

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

    const orderCreateInclude = {
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

    const baseOrderCreateData = {
      userId: orderUserDbId,
      status: 'PENDING',
      vertical: body.vertical || 'FOOD',
      shippingAddress: shippingAddress || '',
      paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
      totalAmount: parseFloat(totalAmount),
      ...(deliveryLatitude !== undefined && deliveryLatitude !== null ? { deliveryLatitude: parseFloat(deliveryLatitude) } : {}),
      ...(deliveryLongitude !== undefined && deliveryLongitude !== null ? { deliveryLongitude: parseFloat(deliveryLongitude) } : {}),
      orderItems: {
        create: items.map(item => ({
          productId: parseInt(item.proId),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price),
          variationJson: item.selectedVariation ? JSON.stringify(item.selectedVariation) : null
        }))
      }
    }


    // Backward-compatible create: production DB/Prisma client may not have serviceCharge yet.
    let order
    try {
      order = await prisma.order.create({
        data: {
          ...baseOrderCreateData,
          serviceCharge: serviceChargeAmt,
        },
        include: orderCreateInclude,
      })
    } catch (createError) {
      const msg = String(createError?.message || '')
      if (!msg.includes('Unknown argument `serviceCharge`')) throw createError
      order = await prisma.order.create({
        data: baseOrderCreateData,
        include: orderCreateInclude,
      })
    }

    // Trigger push notification to Customer & Topics upon new order creation
    sendOrderStatusPushNotification({
      orderId: order.id,
      status: 'PENDING',
      customTitle: '🛍️ Order Placed Successfully!',
      customBody: `Your order #${order.id} has been received and is being processed.`,
    }).catch(err => console.error('Order creation push notification error:', err))

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
        review: true,
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

    // Automatically send Push Notification to Flutter app / Web on status update
    if (status) {
      sendOrderStatusPushNotification({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
      }).catch(err => console.error('Push notification trigger error:', err))
    }

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
