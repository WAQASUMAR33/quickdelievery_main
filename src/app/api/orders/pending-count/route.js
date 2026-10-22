import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/orders/pending-count
 * Returns the count of pending orders for admin or vendor notification badge
 */
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)

    if (!authUser) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let whereClause = { status: 'PENDING' }

    if (authUser.role === 'VENDOR') {
      whereClause = {
        status: 'PENDING',
        orderItems: {
          some: {
            product: {
              vendorId: authUser.uid,
            },
          },
        },
      }
    }

    const count = await prisma.order.count({
      where: whereClause,
    })

    return Response.json({
      success: true,
      count,
    })
  } catch (error) {
    console.error('Error fetching pending orders count:', error)
    return Response.json({ success: false, error: 'Failed to count pending orders' }, { status: 500 })
  }
}
