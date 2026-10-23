import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bookServiceSlot } from '@/lib/verticals/servicesService'

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      userId,
      subOrderId,
      serviceName,
      vendorId,
      customerLat,
      customerLon,
      vendorLat,
      vendorLon,
      maxServiceRadiusKm,
      slotDate,
      slotWindow,
      quotationAmount,
    } = body

    const booking = await bookServiceSlot({
      userId,
      subOrderId,
      serviceName,
      vendorId,
      customerLat,
      customerLon,
      vendorLat,
      vendorLon,
      maxServiceRadiusKm,
      slotDate,
      slotWindow,
      quotationAmount,
    })

    return NextResponse.json({
      success: true,
      booking,
      message: 'Service slot confirmed and technician will be assigned according to the selected window.',
    })
  } catch (error) {
    console.error('Service booking error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
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

    const bookings = await prisma.serviceBooking.findMany({
      where,
      orderBy: { slotDate: 'asc' },
      include: {
        user: { select: { id: true, username: true, phoneNumber: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, bookings })
  } catch (error) {
    console.error('Fetch service bookings error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
