import { NextResponse } from 'next/server'
import { resolveOrderDispute } from '@/lib/trustFramework'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { resolution, adminNotes } = body

    if (!resolution) {
      return NextResponse.json({ error: 'resolution is required' }, { status: 400 })
    }

    const result = await resolveOrderDispute({
      disputeId: id,
      resolution,
      adminNotes,
    })

    return NextResponse.json({
      success: true,
      ...result,
      message: `Dispute resolved with resolution: ${resolution}`,
    })
  } catch (error) {
    console.error('Resolve dispute error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
