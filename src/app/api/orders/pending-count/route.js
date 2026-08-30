import { authenticateRequest } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return Response.json({ success: false, count: 0 }, { status: 401 })
    }

    let whereClause = {
      status: 'PENDING'
    }

    if (user.role === 'VENDOR') {
      whereClause.orderItems = {
        some: {
          product: {
            OR: [
              { vendorId: user.uid },
              { vendorId: String(user.id) }
            ]
          }
        }
      }
    } else if (user.role === 'CUSTOMER') {
      whereClause.userId = user.id
    } else if (user.role === 'DRIVER') {
      whereClause.OR = [
        { driverId: user.id, status: 'PENDING' },
        { driverId: null, status: 'PENDING' }
      ]
    }
    // For ADMIN / SUPER_ADMIN: all PENDING orders across the system

    const count = await prisma.order.count({
      where: whereClause
    })

    return Response.json({
      success: true,
      count
    })
  } catch (error) {
    return Response.json({ success: false, count: 0, error: error.message }, { status: 500 })
  }
}
