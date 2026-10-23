import { NextResponse } from 'next/server'
import { reviewPrescription } from '@/lib/verticals/pharmacyService'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, licenseNumber, pharmacistNotes, reviewedBy } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    const updated = await reviewPrescription({
      prescriptionId: id,
      status,
      licenseNumber,
      pharmacistNotes,
      reviewedBy,
    })

    return NextResponse.json({
      success: true,
      prescription: updated,
      message: `Prescription status updated to ${status}`,
    })
  } catch (error) {
    console.error('Prescription review error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
