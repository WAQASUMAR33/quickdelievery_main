import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPriceOffer } from '@/lib/socialCommerce'

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, productId, vendorId, originalPrice, offeredPrice } = body

    if (!userId || !productId || !vendorId || !originalPrice || !offeredPrice) {
      return NextResponse.json(
        { error: 'userId, productId, vendorId, originalPrice, and offeredPrice are required' },
        { status: 400 }
      )
    }

    const offer = await createPriceOffer({
      userId,
      productId,
      vendorId,
      originalPrice,
      offeredPrice,
    })

    return NextResponse.json({
      success: true,
      offer,
      message: 'Offer submitted to merchant. 2-hour response window initiated.',
    })
  } catch (error) {
    console.error('Create offer error:', error)
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

    const offers = await prisma.priceOffer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { proId: true, proName: true, price: true, proImages: true } },
        user: { select: { id: true, username: true } },
      },
    })

    return NextResponse.json({ success: true, offers })
  } catch (error) {
    console.error('Fetch offers error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
