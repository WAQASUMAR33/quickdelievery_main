import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { verifyAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function POST(request, { params }) {
  try {
    const authResult = await verifyAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = authResult.user.id
    const orderId = parseInt(params.id)

    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 })
    }

    const { rating, comment } = await request.json()

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ success: false, error: 'Rating must be a number between 1 and 5' }, { status: 400 })
    }

    // Check if order exists, belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    }

    if (order.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Not authorized to rate this order' }, { status: 403 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment?.trim() || null,
        orderId,
        userId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Rating submitted successfully',
      data: review
    })

  } catch (error) {
    console.error('Error submitting rating:', error)
    // Handle unique constraint failure if order is already rated
    if (error.code === 'P2002' && error.meta?.target?.includes('order_id')) {
      return NextResponse.json({ success: false, error: 'Order has already been rated' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
