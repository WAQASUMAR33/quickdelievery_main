import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPantrySubscription } from '@/lib/aiOptimizer'

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, productId, frequencyDays = 7, quantity = 1, autoApprove = false } = body

    if (!userId || !productId) {
      return NextResponse.json({ error: 'userId and productId are required' }, { status: 400 })
    }

    const subscription = await createPantrySubscription({
      userId,
      productId,
      frequencyDays,
      quantity,
      autoApprove,
    })

    return NextResponse.json({
      success: true,
      subscription,
      message: `Predictive Pantry active: product will replenish every ${frequencyDays} days.`,
    })
  } catch (error) {
    console.error('Create pantry subscription error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const where = {}
    if (userId) where.userId = parseInt(userId, 10)

    const subscriptions = await prisma.pantrySubscription.findMany({
      where,
      orderBy: { nextReplenishDate: 'asc' },
      include: {
        product: { select: { proId: true, proName: true, price: true, proImages: true } },
      },
    })

    return NextResponse.json({ success: true, subscriptions })
  } catch (error) {
    console.error('Fetch pantry subscriptions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
