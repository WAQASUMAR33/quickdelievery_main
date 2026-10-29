import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// POST: Driver places an offer/bid on a ride (either accepting customer's fare or proposing a counter-fare)
export async function POST(request, context) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Driver login required.' }, { status: 401 })
    }

    const { id } = await context.params
    const rideId = Number(id)
    const body = await request.json()
    const { bidAmount, etaMinutes = 5 } = body

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
        driverId: authUser.id,
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
          driverId: authUser.id,
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
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const rideId = Number(id)
    const body = await request.json()
    const { bidId } = body

    if (!bidId) {
      return NextResponse.json({ success: false, error: 'Bid ID is required' }, { status: 400 })
    }

    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: { driverBids: true },
    })

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 })
    }

    if (ride.customerId !== authUser.id && authUser.role !== 'ADMIN') {
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
