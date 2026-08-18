import { prisma } from '@/lib/prisma'

/**
 * GET /api/driver/location
 * Returns current GPS coordinates of a driver
 * Query params: ?driverId=123 OR ?orderId=456
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverIdParam = searchParams.get('driverId')
    const orderIdParam = searchParams.get('orderId')

    let targetDriverId = driverIdParam ? parseInt(driverIdParam, 10) : null

    // If orderId is provided, resolve the assigned driverId
    if (!targetDriverId && orderIdParam) {
      const order = await prisma.order.findUnique({
        where: { id: parseInt(orderIdParam, 10) },
        select: { driverId: true, status: true },
      })
      if (order && order.driverId) {
        targetDriverId = order.driverId
      }
    }

    if (!targetDriverId) {
      return Response.json(
        { success: false, error: 'Driver ID or valid assigned Order ID required' },
        { status: 400 }
      )
    }

    let db = prisma
    if (!db?.driverLocation) {
      const { PrismaClient } = await import('@prisma/client')
      db = new PrismaClient()
    }

    const location = await db.driverLocation.findUnique({
      where: { driverId: targetDriverId },
    })

    if (!location) {
      // Default to central simulated coordinates if driver hasn't emitted GPS yet
      return Response.json({
        success: true,
        data: {
          driverId: targetDriverId,
          latitude: 31.5204,
          longitude: 74.3587,
          heading: 90,
          speed: 25,
          isSimulated: true,
          updatedAt: new Date().toISOString(),
        },
      })
    }

    return Response.json({ success: true, data: location })
  } catch (error) {
    console.error('Error fetching driver location:', error)
    return Response.json({ success: false, error: error.message || 'Failed to fetch driver location' }, { status: 500 })
  }
}

/**
 * POST /api/driver/location
 * Updates/broadcasts driver's current GPS coordinates
 * Body: { driverId: number, latitude: number, longitude: number, heading?: number, speed?: number }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { driverId, latitude, longitude, heading = 0, speed = 0 } = body

    if (!driverId || latitude === undefined || longitude === undefined) {
      return Response.json(
        { success: false, error: 'driverId, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    let db = prisma
    if (!db?.driverLocation) {
      const { PrismaClient } = await import('@prisma/client')
      db = new PrismaClient()
    }

    const updatedLocation = await db.driverLocation.upsert({
      where: { driverId: parseInt(driverId, 10) },
      update: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        heading: parseFloat(heading || 0),
        speed: parseFloat(speed || 0),
      },
      create: {
        driverId: parseInt(driverId, 10),
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        heading: parseFloat(heading || 0),
        speed: parseFloat(speed || 0),
      },
    })

    return Response.json({ success: true, data: updatedLocation })
  } catch (error) {
    console.error('Error updating driver location:', error)
    return Response.json({ success: false, error: 'Failed to update driver location' }, { status: 500 })
  }
}
