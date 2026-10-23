import { NextResponse } from 'next/server'
import { dispatchTechnician } from '@/lib/verticals/servicesService'

export async function PUT(request) {
  try {
    const body = await request.json()
    const { bookingId, technicianName, technicianPhone } = body

    if (!bookingId || !technicianName || !technicianPhone) {
      return NextResponse.json(
        { error: 'bookingId, technicianName, and technicianPhone are required' },
        { status: 400 }
      )
    }

    const updated = await dispatchTechnician({
      bookingId,
      technicianName,
      technicianPhone,
    })

    return NextResponse.json({
      success: true,
      booking: updated,
      message: `Technician ${technicianName} dispatched successfully.`,
    })
  } catch (error) {
    console.error('Dispatch technician error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
