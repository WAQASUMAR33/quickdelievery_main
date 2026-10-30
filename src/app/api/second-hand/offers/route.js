import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// GET: Fetch offers for the logged in user
// - type=received: Offers on items the user is selling
// - type=sent: Offers the user made on other items
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'received'

    if (type === 'sent') {
      const offers = await prisma.secondHandOffer.findMany({
        where: { buyerId: authUser.id },
        include: {
          item: {
            include: {
              seller: {
                select: { id: true, username: true, phoneNumber: true, image: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
      const formatted = offers.map(o => ({
        ...o,
        item: o.item
          ? {
              ...o.item,
              seller: o.item.seller ? { ...o.item.seller, name: o.item.seller.username } : null,
            }
          : null,
      }))
      return NextResponse.json({ success: true, data: formatted })
    }

    // Default: received offers on user's listed items
    const offers = await prisma.secondHandOffer.findMany({
      where: {
        item: {
          sellerId: authUser.id,
        },
      },
      include: {
        buyer: {
          select: { id: true, username: true, phoneNumber: true, image: true },
        },
        item: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    const formatted = offers.map(o => ({
      ...o,
      buyer: o.buyer ? { ...o.buyer, name: o.buyer.username } : null,
    }))

    return NextResponse.json({ success: true, data: formatted })
  } catch (error) {
    console.error('Failed to get offers:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch offers' }, { status: 500 })
  }
}

// POST: Buyer submits an offer on a second hand item
export async function POST(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Please log in to make an offer' }, { status: 401 })
    }

    const body = await request.json()
    const { itemId, offerPrice, message } = body

    if (!itemId || !offerPrice || Number(offerPrice) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid item and offer price are required' }, { status: 400 })
    }

    const item = await prisma.secondHandItem.findUnique({
      where: { id: Number(itemId) },
    })

    if (!item) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 })
    }

    if (item.sellerId === authUser.id) {
      return NextResponse.json({ success: false, error: 'You cannot make an offer on your own item' }, { status: 400 })
    }

    if (!item.allowOffers) {
      return NextResponse.json({ success: false, error: 'This seller has disabled offers for this item' }, { status: 400 })
    }

    if (item.status !== 'AVAILABLE') {
      return NextResponse.json({ success: false, error: 'Item is no longer available' }, { status: 400 })
    }

    if (item.minOfferPrice && Number(offerPrice) < Number(item.minOfferPrice)) {
      return NextResponse.json({
        success: false,
        error: `Minimum acceptable offer for this item is Rs. ${Number(item.minOfferPrice).toLocaleString()}`,
      }, { status: 400 })
    }

    const offer = await prisma.secondHandOffer.create({
      data: {
        itemId: item.id,
        buyerId: authUser.id,
        offerPrice: Number(offerPrice),
        message: message ? message.trim() : null,
        status: 'PENDING',
      },
      include: {
        item: true,
        buyer: {
          select: { id: true, username: true, phoneNumber: true, image: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...offer,
        buyer: offer.buyer ? { ...offer.buyer, name: offer.buyer.username } : null,
      },
      message: 'Your offer has been submitted! The seller will be notified to review.',
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create offer:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit offer' }, { status: 500 })
  }
}
