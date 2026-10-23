import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTableBooking, updateTableBookingStatus } from '@/lib/verticals/foodService'

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, vendorId, bookingDate, guestCount, specialRequests, dineInPreOrders } = body

    if (!userId || !vendorId || !bookingDate || !guestCount) {
      return NextResponse.json(
        { error: 'userId, vendorId, bookingDate, and guestCount are required' },
        { status: 400 }
      )
    }

    const booking = await createTableBooking({
      userId,
      vendorId,
      bookingDate,
      guestCount,
      specialRequests,
      dineInPreOrders,
    })

    return NextResponse.json({
      success: true,
      booking,
      message: 'Table reservation created successfully. Awaiting restaurant confirmation.',
    })
  } catch (error) {
    console.error('Create table booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const vendorId = searchParams.get('vendorId')

    const where = {}
    if (userId) where.userId = parseInt(userId, 10)
    if (vendorId) where.vendorId = vendorId

    const bookings = await prisma.tableBooking.findMany({
      where,
      orderBy: { bookingDate: 'asc' },
      include: {
        user: { select: { id: true, username: true, phoneNumber: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, bookings })
  } catch (error) {
    console.error('Fetch table bookings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { bookingId, status, tableNumber } = body

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 })
    }

    const updated = await updateTableBookingStatus({
      bookingId,
      status,
      tableNumber,
    })

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Reservation status transitioned to ${status}`,
    })
  } catch (error) {
    console.error('Update table booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
