import { NextResponse } from 'next/server'
import { respondToPriceOffer } from '@/lib/socialCommerce'

export async function PUT(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { response, counterPrice } = body

    if (!response) {
      return NextResponse.json({ error: 'response is required (ACCEPT, COUNTER, REJECT)' }, { status: 400 })
    }

    const updated = await respondToPriceOffer({
      offerId: id,
      response,
      counterPrice,
    })

    return NextResponse.json({
      success: true,
      offer: updated,
      message: `Offer status transitioned to ${updated.status}`,
    })
  } catch (error) {
    console.error('Respond offer error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
