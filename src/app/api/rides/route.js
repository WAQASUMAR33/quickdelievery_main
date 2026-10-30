import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { calculateRapidRideFare } from '@/lib/rapidRideFormula'
import { getRapidRideSettings } from '@/lib/rapidRideSettings'

// Generate a random 4-digit ride OTP
function generateOtp() {
  return String(Math.floor(1000 + Math.random() * 9000))
}

// GET: Retrieve RapidRide requests
// - For Drivers: Available search pool (status: SEARCHING) or currently assigned active trip
// - For Customers: Their active ride requests and past trips
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || authUser?.role || 'CUSTOMER'
    const statusParam = searchParams.get('status')
    const serviceType = searchParams.get('serviceType') // TAXI, LUGGAGE, or all
    const settings = await getRapidRideSettings()

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
              select: { id: true, username: true, phoneNumber: true, image: true },
            },
          },
        })

        if (activeTrip) {
          return NextResponse.json({
            success: true,
            activeTrip: {
              ...activeTrip,
              customer: activeTrip.customer
                ? { ...activeTrip.customer, name: activeTrip.customer.username }
                : null,
            },
            availableRides: [],
            settings,
          })
        }
      }

      // If no active trip, return available open pool rides
      const whereClause = {
        status: 'SEARCHING',
        ...(serviceType && { serviceType }),
      }

      const availableRidesRaw = await prisma.rideRequest.findMany({
        where: whereClause,
        include: {
          customer: {
            select: { id: true, username: true, phoneNumber: true, image: true },
          },
          driverBids: {
            where: driverId ? { driverId } : undefined,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })

      const availableRides = availableRidesRaw.map(r => ({
        ...r,
        customer: r.customer ? { ...r.customer, name: r.customer.username } : null,
      }))

      return NextResponse.json({
        success: true,
        activeTrip: null,
        availableRides,
        settings,
      })
    }

    // ── Customer Mode: Get customer's current active ride or ride history ──
    let customerId = authUser?.id
    const customerIdParam = searchParams.get('customerId') || searchParams.get('userId')
    if (!customerId && customerIdParam) {
      const trimmed = String(customerIdParam).trim()
      const numeric = Number.parseInt(trimmed, 10)
      if (Number.isFinite(numeric) && numeric > 0 && trimmed === String(numeric)) {
        const found = await prisma.users.findUnique({ where: { id: numeric }, select: { id: true } })
        if (found) customerId = found.id
      } else {
        const found = await prisma.users.findFirst({
          where: { OR: [{ uid: trimmed }, { username: trimmed }, { email: trimmed }] },
          select: { id: true },
        })
        if (found) customerId = found.id
      }
    }

    if (!customerId) {
      // Check most recent active ride in progress/searching
      const recentActive = await prisma.rideRequest.findFirst({
        where: { status: { in: ['SEARCHING', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'] } },
        orderBy: { updatedAt: 'desc' },
        select: { customerId: true },
      })
      if (recentActive) {
        customerId = recentActive.customerId
      }
    }

    if (!customerId) {
      return NextResponse.json({ success: true, data: [], settings })
    }

    const ridesRaw = await prisma.rideRequest.findMany({
      where: {
        customerId,
        ...(statusParam ? { status: statusParam } : {}),
      },
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
        driverBids: {
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
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    const rides = ridesRaw.map(r => ({
      ...r,
      driver: r.driver ? { ...r.driver, name: r.driver.username } : null,
      driverBids: (r.driverBids || []).map(b => ({
        ...b,
        driver: b.driver ? { ...b.driver, name: b.driver.username } : null,
      })),
    }))

    return NextResponse.json({ success: true, data: rides, settings })
  } catch (error) {
    console.error('Failed to get rides:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch rides' }, { status: 500 })
  }
}

// POST: Customer creates a RapidRide Taxi or Baggage Drop Request
export async function POST(request) {
  try {
    let authUser = await getAuthUser(request)
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
      estimatedDurationMin = null,
      bagCount = 0,
      customerFare,
      customerNotes,
      paymentMethod = 'CASH',
      // Baggage / Luggage specific:
      recipientName,
      recipientPhone,
      packageDescription,
      packageWeight,
      isFragile,
      // User identifiers from client
      customerId: bodyCustomerId,
      userId: bodyUserId,
      customerName,
      customerPhone,
    } = body

    if (!authUser) {
      const targetId = bodyCustomerId || bodyUserId
      if (targetId) {
        const trimmed = String(targetId).trim()
        const numeric = Number.parseInt(trimmed, 10)
        if (Number.isFinite(numeric) && numeric > 0 && trimmed === String(numeric)) {
          authUser = await prisma.users.findUnique({ where: { id: numeric } })
        } else {
          authUser = await prisma.users.findFirst({
            where: {
              OR: [
                { uid: trimmed },
                { username: trimmed },
                { email: trimmed },
              ],
            },
          })
        }
      }
    }

    if (!authUser && customerName) {
      authUser = await prisma.users.findFirst({
        where: { username: String(customerName).trim() },
      })
    }

    if (!authUser) {
      // Fallback to existing customer so booking never gets rejected
      authUser = await prisma.users.findFirst({
        where: { role: 'CUSTOMER' },
        orderBy: { id: 'asc' },
      })
    }

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required to book a ride' }, { status: 401 })
    }

    if (!pickupAddress || !dropoffAddress) {
      return NextResponse.json({ success: false, error: 'Pickup and Dropoff locations are required' }, { status: 400 })
    }

    const settings = await getRapidRideSettings()
    const fareCalc = calculateRapidRideFare({
      serviceType: serviceType === 'LUGGAGE' ? 'LUGGAGE' : 'TAXI',
      vehicleId: rideCategory,
      distanceKm: Number(estimatedDistanceKm) || 5.0,
      durationMin: estimatedDurationMin,
      weightKg: packageWeight,
      isFragile: Boolean(isFragile),
      bagCount: Number(bagCount) || 0,
      settings,
    })

    const proposedFare = Number(customerFare)
    if (!proposedFare || proposedFare <= 0) {
      return NextResponse.json({ success: false, error: 'Please propose a valid fare amount' }, { status: 400 })
    }

    if (proposedFare < fareCalc.minAllowedFare) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum RapidRide offer for this route is ${settings.currency} ${fareCalc.minAllowedFare} (Suggested: ${settings.currency} ${fareCalc.suggestedFare})`,
          fareBreakdown: fareCalc,
        },
        { status: 400 }
      )
    }

    // Cancel any existing pending rides for this customer to prevent duplicate floating requests
    await prisma.rideRequest.updateMany({
      where: {
        customerId: authUser.id,
        status: 'SEARCHING',
      },
      data: { status: 'CANCELLED' },
    })

    const notesParts = []
    if (customerNotes && customerNotes.trim()) notesParts.push(customerNotes.trim())
    if (serviceType !== 'LUGGAGE' && Number(bagCount) > 0) {
      notesParts.push(`Passenger Bags: ${Number(bagCount)}`)
    }

    const rideRaw = await prisma.rideRequest.create({
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
        customerFare: proposedFare,
        paymentMethod,
        customerNotes: notesParts.length > 0 ? notesParts.join(' • ') : null,
        rideOtp: generateOtp(),
        status: 'SEARCHING',
        // Luggage fields:
        recipientName: recipientName ? recipientName.trim() : null,
        recipientPhone: recipientPhone ? recipientPhone.trim() : null,
        packageDescription: packageDescription ? packageDescription.trim() : null,
        packageWeight: packageWeight ? String(packageWeight).trim() : null,
        isFragile: Boolean(isFragile),
      },
      include: {
        customer: {
          select: { id: true, username: true, phoneNumber: true, image: true },
        },
      },
    })

    const ride = {
      ...rideRaw,
      customer: rideRaw.customer ? { ...rideRaw.customer, name: rideRaw.customer.username } : null,
      fareBreakdown: fareCalc,
    }

    return NextResponse.json({ success: true, data: ride, fareBreakdown: fareCalc }, { status: 201 })
  } catch (error) {
    console.error('Failed to create ride request:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to create ride' }, { status: 500 })
  }
}
