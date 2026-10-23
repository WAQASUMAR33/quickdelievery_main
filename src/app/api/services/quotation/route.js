import { NextResponse } from 'next/server'
import { acceptServiceQuotation } from '@/lib/verticals/servicesService'

export async function PUT(request) {
  try {
    const body = await request.json()
    const { bookingId, userId } = body

    if (!bookingId || !userId) {
      return NextResponse.json({ error: 'bookingId and userId are required' }, { status: 400 })
    }

    const updated = await acceptServiceQuotation({ bookingId, userId })
    return NextResponse.json({
      success: true,
      booking: updated,
      message: 'Upfront quotation accepted. Technician dispatch initiated.',
    })
  } catch (error) {
    console.error('Accept quotation error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
