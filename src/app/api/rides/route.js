import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// Generate a random 4-digit ride OTP
function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// GET: Retrieve ride requests
// - For Drivers: Available search pool (status: SEARCHING) or currently assigned active trip
// - For Customers: Their active ride requests and past trips
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || authUser?.role || 'CUSTOMER'
    const statusParam = searchParams.get('status')
    const serviceType = searchParams.get('serviceType') // TAXI, LUGGAGE, or all

    // ── Driver Mode: Query open rides waiting for bids or currently assigned trip ──
    if (role === 'DRIVER') {
      const driverId = authUser?.id || (searchParams.get('driverId') ? Number(searchParams.get('driverId')) : null)

      // First check if driver is currently assigned to an active trip
      if (driverId) {
        const activeTrip = await prisma.rideRequest.findFirst({
          where: {
            driverId,
            status: { in: ['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] },
          },
          include: {
            customer: {
              select: { id: true, name: true, phoneNumber: true, image: true },
            },
          },
        })

        if (activeTrip) {
          return NextResponse.json({
            success: true,
            activeTrip,
            availableRides: [],
          })
        }
      }

      // If no active trip, return available open pool rides
      const whereClause = {
        status: 'SEARCHING',
        ...(serviceType && { serviceType }),
      }

      const availableRides = await prisma.rideRequest.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { id: true, name: true, phoneNumber: true, image: true },
          },
          driverBids: {
            where: driverId ? { driverId } : undefined,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })

      return NextResponse.json({
        success: true,
        activeTrip: null,
        availableRides,
      })
    }

    // ── Customer Mode: Get customer's current active ride or ride history ──
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const rides = await prisma.rideRequest.findMany({
      where: {
        customerId: authUser.id,
        ...(statusParam ? { status: statusParam } : {}),
      },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            image: true,
            driverProfile: true,
          },
        },
        driverBids: {
          include: {
            driver: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                image: true,
                driverProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, data: rides })
  } catch (error) {
    console.error('Failed to get rides:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch rides' }, { status: 500 })
  }
}

// POST: Customer creates an InDrive Taxi or Luggage Drop Request
export async function POST(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required to book a ride' }, { status: 401 })
    }

    const body = await request.json()
    const {
      serviceType = 'TAXI',
      rideCategory = 'CAR_AC',
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      estimatedDistanceKm = 5.0,
      customerFare,
      customerNotes,
      paymentMethod = 'CASH',
      // Luggage specific:
      recipientName,
      recipientPhone,
      packageDescription,
      packageWeight,
      isFragile,
    } = body

    if (!pickupAddress || !dropoffAddress) {
      return NextResponse.json({ success: false, error: 'Pickup and Dropoff locations are required' }, { status: 400 })
    }

    if (!customerFare || Number(customerFare) <= 0) {
      return NextResponse.json({ success: false, error: 'Please propose a fair fare amount' }, { status: 400 })
    }

    // Cancel any existing pending rides for this customer to prevent duplicate floating requests
    await prisma.rideRequest.updateMany({
      where: {
        customerId: authUser.id,
        status: 'SEARCHING',
      },
      data: { status: 'CANCELLED' },
    })

    const ride = await prisma.rideRequest.create({
      data: {
        customerId: authUser.id,
        serviceType: serviceType === 'LUGGAGE' ? 'LUGGAGE' : 'TAXI',
        rideCategory,
        pickupAddress: pickupAddress.trim(),
        pickupLat: pickupLat ? Number(pickupLat) : null,
        pickupLng: pickupLng ? Number(pickupLng) : null,
        dropoffAddress: dropoffAddress.trim(),
        dropoffLat: dropoffLat ? Number(dropoffLat) : null,
        dropoffLng: dropoffLng ? Number(dropoffLng) : null,
        estimatedDistanceKm: Number(estimatedDistanceKm) || 5.0,
        customerFare: Number(customerFare),
        paymentMethod,
        customerNotes: customerNotes ? customerNotes.trim() : null,
        rideOtp: generateOtp(),
        status: 'SEARCHING',
        // Luggage fields:
        recipientName: recipientName ? recipientName.trim() : null,
        recipientPhone: recipientPhone ? recipientPhone.trim() : null,
        packageDescription: packageDescription ? packageDescription.trim() : null,
        packageWeight: packageWeight ? packageWeight.trim() : null,
        isFragile: Boolean(isFragile),
      },
      include: {
        customer: {
          select: { id: true, name: true, phoneNumber: true, image: true },
        },
      },
    })

    return NextResponse.json({ success: true, data: ride }, { status: 201 })
  } catch (error) {
    console.error('Failed to create ride request:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create ride' }, { status: 500 })
  }
}
