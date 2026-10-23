import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAddonWindowActive, getNearbyOnTheWayAddons } from '@/lib/addonEngine'

/**
 * GET /api/orders/on-the-way-addons?subOrderId=123
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const subOrderId = searchParams.get('subOrderId')

    if (!subOrderId) {
      return NextResponse.json({ success: false, error: 'subOrderId is required' }, { status: 400 })
    }

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: parseInt(subOrderId, 10) },
      include: {
        masterOrder: true,
      },
    })

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'SubOrder not found' }, { status: 404 })
    }

    const isActive = isAddonWindowActive(subOrder)
    const remainingSeconds = isActive
      ? Math.max(0, Math.round((new Date(subOrder.onTheWayAddonUntil).getTime() - Date.now()) / 1000))
      : 0

    if (!isActive) {
      return NextResponse.json({
        success: true,
        isActive: false,
        message: 'The 10-minute On-The-Way Add-On window for this order has expired.',
        remainingSeconds: 0,
        items: [],
      })
    }

    const nearbyResult = await getNearbyOnTheWayAddons(
      subOrder.masterOrder.deliveryLatitude,
      subOrder.masterOrder.deliveryLongitude,
      0.8 // 800-meter radius
    )

    return NextResponse.json({
      success: true,
      isActive: true,
      remainingSeconds,
      expiresAt: subOrder.onTheWayAddonUntil,
      subOrderId: subOrder.id,
      subOrderNumber: subOrder.subOrderNumber,
      radiusKm: 0.8,
      items: nearbyResult.items || [],
    })
  } catch (error) {
    console.error('On-the-way addon fetch error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/orders/on-the-way-addons
 * Appends an item to the active Sub-Order with $0 delivery fee
 */
export async function POST(req) {
  try {
    const body = await req.json()
    const { subOrderId, productId, quantity = 1 } = body

    if (!subOrderId || !productId) {
      return NextResponse.json(
        { success: false, error: 'subOrderId and productId are required' },
        { status: 400 }
      )
    }

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: parseInt(subOrderId, 10) },
      include: { masterOrder: true },
    })

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'SubOrder not found' }, { status: 404 })
    }

    if (!isAddonWindowActive(subOrder)) {
      return NextResponse.json(
        { success: false, error: 'On-the-way add-on window has expired for this order' },
        { status: 400 }
      )
    }

    const product = await prisma.product.findUnique({
      where: { proId: parseInt(productId, 10) },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const qty = parseInt(quantity, 10) || 1
    const price = parseFloat(product.salePrice || product.price)
    const itemTotal = price * qty

    // Append to sub-order atomically with $0 delivery fee
    const result = await prisma.$transaction(async (tx) => {
      const addedItem = await tx.subOrderItem.create({
        data: {
          subOrderId: subOrder.id,
          productId: product.proId,
          productName: product.proName,
          quantity: qty,
          price,
          vertical: product.vertical || 'FOOD',
          isOnTheWayAddon: true,
        },
      })

      // Update SubOrder subtotal
      const newSubtotal = Math.round((parseFloat(subOrder.subtotal) + itemTotal) * 100) / 100
      const updatedSubOrder = await tx.subOrder.update({
        where: { id: subOrder.id },
        data: {
          subtotal: newSubtotal,
        },
      })

      // Update MasterOrder totalAmount
      const newMasterTotal = Math.round((parseFloat(subOrder.masterOrder.totalAmount) + itemTotal) * 100) / 100
      await tx.masterOrder.update({
        where: { id: subOrder.masterOrderId },
        data: { totalAmount: newMasterTotal },
      })

      return { addedItem, updatedSubOrder }
    })

    return NextResponse.json({
      success: true,
      message: `Added ${product.proName} to your ongoing delivery with $0 delivery fee!`,
      data: result,
    })
  } catch (error) {
    console.error('On-the-way addon add error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
