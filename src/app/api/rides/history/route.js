import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const role = (searchParams.get('role') || authUser?.role || 'CUSTOMER').toUpperCase()
    const statusParam = searchParams.get('status')
    const serviceType = searchParams.get('serviceType')

    let customerId = null
    let driverId = null

    if (role === 'DRIVER') {
      driverId = authUser?.id || (searchParams.get('driverId') ? Number(searchParams.get('driverId')) : null)
      if (!driverId && searchParams.get('userId')) {
        driverId = Number(searchParams.get('userId'))
      }
    } else {
      // Customer mode
      customerId = authUser?.id || (searchParams.get('customerId') ? Number(searchParams.get('customerId')) : null)
      if (!customerId && searchParams.get('userId')) {
        const uidParam = searchParams.get('userId').trim()
        const numeric = Number.parseInt(uidParam, 10)
        if (Number.isFinite(numeric) && numeric > 0 && uidParam === String(numeric)) {
          customerId = numeric
        } else {
          const userObj = await prisma.users.findFirst({
            where: { OR: [{ uid: uidParam }, { username: uidParam }, { email: uidParam }] },
            select: { id: true },
          })
          if (userObj) customerId = userObj.id
        }
      }
    }

    const whereClause = {}

    if (role === 'DRIVER') {
      if (driverId) {
        whereClause.driverId = driverId
      }
      // For drivers, show trips they were assigned to (completed, cancelled, or in progress)
      if (statusParam && statusParam !== 'ALL') {
        whereClause.status = statusParam
      } else {
        whereClause.status = { in: ['COMPLETED', 'CANCELLED', 'IN_PROGRESS', 'DRIVER_ARRIVED', 'ACCEPTED'] }
      }
    } else {
      // Customer mode
      if (customerId) {
        whereClause.customerId = customerId
      }
      if (statusParam && statusParam !== 'ALL') {
        whereClause.status = statusParam
      }
    }

    if (serviceType && serviceType !== 'ALL') {
      whereClause.serviceType = serviceType
    }

    const [ridesRaw, totalCount] = await Promise.all([
      prisma.rideRequest.findMany({
        where: whereClause,
        include: {
          driver: {
            select: {
              id: true,
              username: true,
              phoneNumber: true,
              image: true,
              driverProfile: true,
            },
          },
          customer: {
            select: {
              id: true,
              username: true,
              phoneNumber: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.rideRequest.count({ where: whereClause }),
    ])

    const formattedRides = ridesRaw.map((r) => {
      const driverObj = r.driver
        ? {
            id: r.driver.id,
            name: r.driver.username,
            phoneNumber: r.driver.phoneNumber,
            image: r.driver.image,
            vehicleType: r.driver.driverProfile?.vehicleType || r.rideCategory,
            vehicleNumber: r.driver.driverProfile?.vehiclePlate || 'N/A',
          }
        : null

      const customerObj = r.customer
        ? {
            id: r.customer.id,
            name: r.customer.username,
            phoneNumber: r.customer.phoneNumber,
            image: r.customer.image,
          }
        : null

      return {
        id: r.id,
        serviceType: r.serviceType,
        rideCategory: r.rideCategory,
        status: r.status,
        pickupAddress: r.pickupAddress,
        pickupLat: r.pickupLat,
        pickupLng: r.pickupLng,
        dropoffAddress: r.dropoffAddress,
        dropoffLat: r.dropoffLat,
        dropoffLng: r.dropoffLng,
        estimatedDistanceKm: r.estimatedDistanceKm,
        customerFare: r.customerFare ? Number(r.customerFare) : 0,
        finalFare: r.finalFare ? Number(r.finalFare) : Number(r.customerFare || 0),
        paymentMethod: r.paymentMethod,
        customerNotes: r.customerNotes,
        rideOtp: r.rideOtp,
        recipientName: r.recipientName,
        recipientPhone: r.recipientPhone,
        packageDescription: r.packageDescription,
        packageWeight: r.packageWeight,
        isFragile: r.isFragile,
        proofPhotoUrl: r.proofPhotoUrl,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        driver: driverObj,
        customer: customerObj,
      }
    })

    const summary = {
      total: totalCount,
      completed: formattedRides.filter((r) => r.status === 'COMPLETED').length,
      cancelled: formattedRides.filter((r) => r.status === 'CANCELLED').length,
      inProgress: formattedRides.filter((r) => ['IN_PROGRESS', 'ACCEPTED', 'DRIVER_ARRIVED'].includes(r.status)).length,
      totalSpent: formattedRides
        .filter((r) => r.status === 'COMPLETED')
        .reduce((sum, r) => sum + (r.finalFare || 0), 0),
    }

    return NextResponse.json({
      success: true,
      data: formattedRides,
      total: totalCount,
      summary,
    })
  } catch (error) {
    console.error('Failed to get ride history:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ride history' },
      { status: 500 }
    )
  }
}
