import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// GET: Single ride request details with live bids and driver details
export async function GET(request, context) {
  try {
    const { id } = await context.params
    const rideId = Number(id)
    if (!rideId) {
      return NextResponse.json({ success: false, error: 'Invalid ride ID' }, { status: 400 })
    }

    const ride = await prisma.rideRequest.findUnique({
      where: { id: rideId },
      include: {
        customer: {
          select: { id: true, username: true, phoneNumber: true, image: true },
        },
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
    })

    if (!ride) {
      return NextResponse.json({ success: false, error: 'Ride request not found' }, { status: 404 })
    }

    const formattedRide = {
      ...ride,
      customer: ride.customer ? { ...ride.customer, name: ride.customer.username } : null,
      driver: ride.driver ? { ...ride.driver, name: ride.driver.username } : null,
      driverBids: (ride.driverBids || []).map(b => ({
        ...b,
        driver: b.driver ? { ...b.driver, name: b.driver.username } : null,
      })),
    }
    return NextResponse.json({ success: true, data: formattedRide })
  } catch (error) {
    console.error('Failed to get ride:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch ride' }, { status: 500 })
  }
}

// PATCH: Update ride status (Cancel by customer, Arrived by driver, Start trip with OTP, Complete trip)
export async function PATCH(request, context) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const rideId = Number(id)
    const body = await request.json()
    const { action, enteredOtp, proofPhotoUrl } = body

    const existingRide = await prisma.rideRequest.findUnique({
      where: { id: rideId },
    })

    if (!existingRide) {
      return NextResponse.json({ success: false, error: 'Ride not found' }, { status: 404 })
    }

    // ── CANCEL ──
    if (action === 'CANCEL') {
      if (existingRide.status === 'IN_PROGRESS' || existingRide.status === 'COMPLETED') {
        return NextResponse.json({ success: false, error: 'Cannot cancel a trip already in progress or completed' }, { status: 400 })
      }

      const updated = await prisma.rideRequest.update({
        where: { id: rideId },
        data: { status: 'CANCELLED' },
      })
      return NextResponse.json({ success: true, data: updated, message: 'Ride cancelled' })
    }

    // ── DRIVER ARRIVED ──
    if (action === 'DRIVER_ARRIVED') {
      if (existingRide.driverId !== authUser.id && authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Only the assigned driver can update arrival' }, { status: 403 })
      }

      const updated = await prisma.rideRequest.update({
        where: { id: rideId },
        data: { status: 'DRIVER_ARRIVED' },
      })
      return NextResponse.json({ success: true, data: updated, message: 'Customer notified of driver arrival' })
    }

    // ── START TRIP (WITH OTP VALIDATION) ──
    if (action === 'START_TRIP') {
      if (existingRide.driverId !== authUser.id && authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Only the assigned driver can start the trip' }, { status: 403 })
      }

      // Check OTP if entered
      if (enteredOtp && existingRide.rideOtp && enteredOtp.trim() !== existingRide.rideOtp.trim()) {
        return NextResponse.json({ success: false, error: 'Incorrect 4-digit ride OTP. Please ask the customer for the correct PIN.' }, { status: 400 })
      }

      const updated = await prisma.rideRequest.update({
        where: { id: rideId },
        data: { status: 'IN_PROGRESS' },
      })
      return NextResponse.json({ success: true, data: updated, message: 'Trip started successfully' })
    }

    // ── COMPLETE TRIP ──
    if (action === 'COMPLETE_TRIP') {
      if (existingRide.driverId !== authUser.id && authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Only the assigned driver can complete this trip' }, { status: 403 })
      }

      const updated = await prisma.rideRequest.update({
        where: { id: rideId },
        data: {
          status: 'COMPLETED',
          ...(proofPhotoUrl && { proofPhotoUrl }),
        },
      })
      return NextResponse.json({ success: true, data: updated, message: 'Trip successfully completed' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action provided' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update ride status:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update ride' }, { status: 500 })
  }
}
