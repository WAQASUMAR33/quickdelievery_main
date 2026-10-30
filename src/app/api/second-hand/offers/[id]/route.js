import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// PATCH: Seller responds to offer (ACCEPT, REJECT, COUNTER) or Buyer accepts/declines counter
export async function PATCH(request, context) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const offerId = Number(id)
    const body = await request.json()
    const { action, counterPrice, sellerNote } = body

    const offer = await prisma.secondHandOffer.findUnique({
      where: { id: offerId },
      include: {
        item: true,
        buyer: { select: { id: true, username: true, phoneNumber: true } },
      },
    })

    if (!offer) {
      return NextResponse.json({ success: false, error: 'Offer not found' }, { status: 404 })
    }

    const isSeller = offer.item.sellerId === authUser.id
    const isBuyer = offer.buyerId === authUser.id

    // ── SELLER ACTIONS ──
    if (action === 'ACCEPT') {
      if (!isSeller && authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Only the seller can accept this offer' }, { status: 403 })
      }

      const updated = await prisma.secondHandOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED' },
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Offer accepted! Contact the buyer to finalize collection & delivery.',
      })
    }

    if (action === 'REJECT') {
      if (!isSeller && authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Only the seller can reject this offer' }, { status: 403 })
      }

      const updated = await prisma.secondHandOffer.update({
        where: { id: offerId },
        data: { status: 'REJECTED' },
      })

      return NextResponse.json({ success: true, data: updated, message: 'Offer declined' })
    }

    if (action === 'COUNTER') {
      if (!isSeller && authUser.role !== 'ADMIN') {
        return NextResponse.json({ success: false, error: 'Only the seller can counter-offer' }, { status: 403 })
      }

      if (!counterPrice || Number(counterPrice) <= 0) {
        return NextResponse.json({ success: false, error: 'Valid counter-offer price is required' }, { status: 400 })
      }

      const updated = await prisma.secondHandOffer.update({
        where: { id: offerId },
        data: {
          status: 'COUNTERED',
          counterPrice: Number(counterPrice),
          sellerNote: sellerNote ? sellerNote.trim() : null,
        },
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Counter-offer of Rs. ${Number(counterPrice).toLocaleString()} sent to buyer.`,
      })
    }

    // ── BUYER RESPONDING TO COUNTER ──
    if (action === 'ACCEPT_COUNTER') {
      if (!isBuyer) {
        return NextResponse.json({ success: false, error: 'Only the buyer can accept this counter-offer' }, { status: 403 })
      }

      const updated = await prisma.secondHandOffer.update({
        where: { id: offerId },
        data: { status: 'ACCEPTED' },
      })

      return NextResponse.json({
        success: true,
        data: updated,
        message: 'Counter-offer accepted! Deal confirmed with seller.',
      })
    }

    if (action === 'CANCEL') {
      if (!isBuyer && !isSeller) {
        return NextResponse.json({ success: false, error: 'Unauthorized to cancel this offer' }, { status: 403 })
      }

      const updated = await prisma.secondHandOffer.update({
        where: { id: offerId },
        data: { status: 'CANCELLED' },
      })

      return NextResponse.json({ success: true, data: updated, message: 'Offer cancelled' })
    }

    return NextResponse.json({ success: false, error: 'Invalid action provided' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update offer:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to update offer' }, { status: 500 })
  }
}
