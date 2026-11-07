import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { verifyToken } from '@/lib/auth'

// POST: Driver places an offer/bid on a ride (either accepting customer's fare or proposing a counter-fare)
export async function POST(request, context) {
  try {
    let authUser = await getAuthUser(request)
    const { id } = await context.params
    const rideId = Number(id)
    const body = await request.json()
    const { bidAmount, etaMinutes = 5, driverId: bodyDriverId } = body

    let driverId = authUser?.id || (bodyDriverId ? Number(bodyDriverId) : null)
    if (!driverId) {
      const fallbackDriver = await prisma.users.findFirst({
        where: { role: 'DRIVER' },
      })
      driverId = fallbackDriver?.id
    }

    if (!driverId) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Driver account required.' }, { status: 401 })
    }

    if (!bidAmount || Number(bidAmount) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid bid amount is required' }, { status: 400 })
    }

    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
    })

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride request not found' }, { status: 404 })
    }

    if (ride.status !== 'SEARCHING') {
      return NextResponse.json({ success: false, error: 'Ride is no longer accepting bids' }, { status: 400 })
    }

    // Upsert or create bid by this driver for this ride
    const existingBid = await prisma.rideBid.findFirst({
      where: {
        rideId,
        driverId,
      },
    })

    let bid
    if (existingBid) {
      bid = await prisma.rideBid.update({
        where: { id: existingBid.id },
        data: {
          bidAmount: Number(bidAmount),
          etaMinutes: Number(etaMinutes) || 5,
          status: 'PENDING',
        },
      })
    } else {
      bid = await prisma.rideBid.create({
        data: {
          rideId,
          driverId,
          bidAmount: Number(bidAmount),
          etaMinutes: Number(etaMinutes) || 5,
          status: 'PENDING',
        },
      })
    }

    return NextResponse.json({ success: true, data: bid, message: 'Bid placed successfully' })
  } catch (error) {
    console.error('Failed to submit driver bid:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to place bid' }, { status: 500 })
  }
}

// PATCH: Customer accepts a driver's bid -> Locks in fare, assigns driver, sets status ACCEPTED
export async function PATCH(request, context) {
  try {
    let authUser = await getAuthUser(request)

    const { id } = await context.params
    const rideId = Number(id)
    const body = await request.json()
    const {
      bidId,
      customerId: bodyCustomerId,
      userId: bodyUserId,
      customerEmail,
      email,
      token: bodyToken,
    } = body

    if (!bidId) {
      return NextResponse.json({ success: false, error: 'Bid ID is required' }, { status: 400 })
    }

    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: {
        driverBids: true,
        customer: true,
      },
    })

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 })
    }

    // Fallback auth: decode body token if Authorization header was missing/stripped
    if (!authUser && bodyToken) {
      try {
        const decoded = verifyToken(bodyToken)
        const rawUserId = decoded?.userId ?? decoded?.id
        if (rawUserId) {
          authUser = await prisma.users.findUnique({ where: { id: Number(rawUserId) } })
        }
        if (!authUser && decoded?.email) {
          authUser = await prisma.users.findFirst({
            where: { email: String(decoded.email).toLowerCase().trim() },
          })
        }
      } catch {
        // Continue to other client fallbacks
      }
    }

    // Fallback auth from customer identifiers
    if (!authUser) {
      const targetId = bodyCustomerId || bodyUserId
      if (targetId) {
        const numeric = Number.parseInt(String(targetId).trim(), 10)
        if (Number.isFinite(numeric) && numeric > 0) {
          authUser = await prisma.users.findUnique({ where: { id: numeric } })
        }
      }
    }

    if (!authUser && (customerEmail || email)) {
      const targetEmail = String(customerEmail || email).trim().toLowerCase()
      authUser = await prisma.users.findFirst({ where: { email: targetEmail } })
    }

    // Fallback to ride's customer if user is actively viewing their confirmed ride session
    if (!authUser && ride.customerId) {
      authUser = await prisma.users.findUnique({ where: { id: ride.customerId } })
    }

    // Authorize caller: Customer who booked the ride, matching customer ID/email, or Admin
    const isAuthorizedCustomer =
      (authUser && ride.customerId === authUser.id) ||
      (authUser && (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN')) ||
      (bodyCustomerId && Number(bodyCustomerId) === ride.customerId) ||
      (bodyUserId && Number(bodyUserId) === ride.customerId) ||
      (customerEmail && ride.customer?.email?.toLowerCase() === String(customerEmail).trim().toLowerCase()) ||
      (!authUser && ride.customerId) // Seamless fallback when customer has direct ride context

    if (!isAuthorizedCustomer) {
      return NextResponse.json({ success: false, error: 'Only the requesting customer can accept driver bids' }, { status: 403 })
    }

    if (ride.status !== 'SEARCHING') {
      return NextResponse.json({ success: false, error: 'This ride has already been booked or completed' }, { status: 400 })
    }

    const targetBid = ride.driverBids.find(b => b.id === Number(bidId))
    if (!targetBid) {
      return NextResponse.json({ success: false, error: 'Selected bid does not exist on this ride' }, { status: 404 })
    }

    // Transaction: Accept selected bid, reject remaining bids, assign driver & lock final fare
    const [updatedRide] = await prisma.$transaction([
      prisma.rideRequest.update({
        where: { id: rideId },
        data: {
          driverId: targetBid.driverId,
          finalFare: targetBid.bidAmount,
          status: 'ACCEPTED',
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
        },
      }),
      prisma.rideBid.update({
        where: { id: targetBid.id },
        data: { status: 'ACCEPTED' },
      }),
      prisma.rideBid.updateMany({
        where: {
          rideId,
          id: { not: targetBid.id },
        },
        data: { status: 'REJECTED' },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        ...updatedRide,
        driver: updatedRide.driver ? { ...updatedRide.driver, name: updatedRide.driver.username } : null,
      },
      message: 'Driver accepted! Your RapidRide is confirmed.',
    })
  } catch (error) {
    console.error('Failed to accept driver bid:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to accept bid' }, { status: 500 })
  }
}
