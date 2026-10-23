import { NextResponse } from 'next/server'
import { uploadLiveQualityCheck } from '@/lib/trustFramework'

export async function POST(request) {
  try {
    const body = await request.json()
    const { subOrderId, photoUrl, videoUrl } = body

    if (!subOrderId) {
      return NextResponse.json({ error: 'subOrderId is required' }, { status: 400 })
    }

    const updated = await uploadLiveQualityCheck({
      subOrderId,
      photoUrl,
      videoUrl,
    })

    return NextResponse.json({
      success: true,
      subOrder: updated,
      message: 'In-store live quality verification uploaded and verified prior to dispatch.',
    })
  } catch (error) {
    console.error('Quality check upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
