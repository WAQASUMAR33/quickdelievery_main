import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decomposeCartItems, FULFILLMENT_TRACKS } from '@/lib/fulfillmentEngine'
import { recordWalletTransaction, TRANSACTION_CATEGORIES } from '@/lib/walletLedger'
import { validatePrescriptionForItems } from '@/lib/verticals/pharmacyService'
import { detectTryAndDecideRequirement } from '@/lib/verticals/fashionService'
import crypto from 'crypto'

export async function POST(req) {
  try {
    const body = await req.json()
    const {
      userId,
      items = [],
      shippingAddress,
      deliveryLatitude,
      deliveryLongitude,
      paymentMethod = 'CREDIT_CARD',
      useWalletBalance = false,
      enableRoundUpDonation = true,
      donationInitiative = 'Local Community Kitchen & Food Bank',
      prescriptionId = null,
      serviceSlotDate = null,
      serviceSlotWindow = null,
    } = body

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User ID and non-empty items array are required' },
        { status: 400 }
      )
    }

    const numericUserId = parseInt(userId, 10)
    const user = await prisma.users.findUnique({ where: { id: numericUserId } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Prescription Enforcement Guard
    await validatePrescriptionForItems({
      userId: numericUserId,
      items,
      prescriptionId,
    })

    // 1. Decompose cart into Tracks & Merchants
    const decomposed = decomposeCartItems(items, {
      customerLocation: { lat: deliveryLatitude, lng: deliveryLongitude },
      enableRoundUpDonation,
    })

    const masterOrderNumber = `MO-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`

    // 2. Execute Atomic Creation of MasterOrder + SubOrders + Items + Donations
    const result = await prisma.$transaction(async (tx) => {
      // Create Master Order
      const masterOrder = await tx.masterOrder.create({
        data: {
          masterOrderNumber,
          userId: numericUserId,
          status: 'PROCESSING',
          paymentMethod,
          paymentStatus: 'PAID',
          totalAmount: decomposed.finalMasterTotal,
          serviceCharge: decomposed.serviceCharge,
          deliveryFee: decomposed.totalDeliveryFee,
          roundUpDonation: decomposed.roundUpDonation,
          shippingAddress: shippingAddress || 'Default Customer Address',
          deliveryLatitude: deliveryLatitude ? parseFloat(deliveryLatitude) : null,
          deliveryLongitude: deliveryLongitude ? parseFloat(deliveryLongitude) : null,
        },
      })

      // Create Sub-Orders
      const createdSubOrders = []
      const now = new Date()

      for (let i = 0; i < decomposed.subOrders.length; i++) {
        const sub = decomposed.subOrders[i]
        const subOrderNumber = `${masterOrderNumber}-S${i + 1}`

        // On-the-way add-on window active for 10 minutes on Track A orders
        let onTheWayAddonUntil = null
        if (sub.fulfillmentTrack === FULFILLMENT_TRACKS.TRACK_A.code) {
          onTheWayAddonUntil = new Date(now.getTime() + 10 * 60 * 1000)
        }

        // Detect if dual sizes were requested for Try & Decide
        const isTryAndDecide = detectTryAndDecideRequirement(sub.items)

        const subOrder = await tx.subOrder.create({
          data: {
            subOrderNumber,
            masterOrderId: masterOrder.id,
            vendorId: sub.vendorId,
            fulfillmentTrack: sub.fulfillmentTrack,
            status: 'ACCEPTED',
            subtotal: sub.subtotal,
            deliveryFee: sub.deliveryFee,
            slaDeadline: sub.slaDeadline,
            scheduledSlotStart: sub.scheduledSlot ? new Date(now.setHours(sub.scheduledSlot.startHour, 0, 0, 0)) : null,
            scheduledSlotEnd: sub.scheduledSlot ? new Date(now.setHours(sub.scheduledSlot.endHour, 0, 0, 0)) : null,
            onTheWayAddonUntil,
            prescriptionId: prescriptionId ? parseInt(prescriptionId, 10) : null,
            isTryAndDecide,
            tryAndDecideStatus: isTryAndDecide ? 'PENDING_DECISION' : 'NONE',
            trackingNumber: `TRK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          },
        })

        // Create SubOrderItems
        for (const itm of sub.items) {
          await tx.subOrderItem.create({
            data: {
              subOrderId: subOrder.id,
              productId: parseInt(itm.proId || itm.id, 10),
              productName: itm.proName || itm.name || 'Product Item',
              quantity: parseInt(itm.quantity, 10),
              price: parseFloat(itm.unitPrice),
              variationJson: itm.variation ? JSON.stringify(itm.variation) : null,
              vertical: itm.vertical || 'FOOD',
              prescriptionId: prescriptionId ? parseInt(prescriptionId, 10) : null,
              modifierSelectionsJson: itm.selectedModifiers ? JSON.stringify(itm.selectedModifiers) : null,
              cookingInstructions: itm.cookingInstructions || null,
              selectedSize: itm.selectedSize || null,
              selectedColor: itm.selectedColor || null,
              isTryAndDecideVariant: Boolean(itm.selectedSize && isTryAndDecide),
            },
          })
        }

        createdSubOrders.push(subOrder)
      }

      // Record Community Donation if round-up was enabled
      if (decomposed.roundUpDonation > 0) {
        await tx.communityDonation.create({
          data: {
            masterOrderId: masterOrder.id,
            userId: numericUserId,
            amount: decomposed.roundUpDonation,
            initiativeName: donationInitiative,
          },
        })
      }

      return { masterOrder, subOrders: createdSubOrders }
    })

    // 3. Process Wallet Ledger transaction if wallet was used or reward cashback generated
    // Universal Cashback: Credit 2% instant cashback to Rewards Wallet on non-food items
    const nonFoodTotal = decomposed.subOrders
      .filter((s) => s.fulfillmentTrack !== FULFILLMENT_TRACKS.TRACK_A.code)
      .reduce((sum, s) => sum + s.subtotal, 0)

    if (nonFoodTotal > 0) {
      const cashbackAmount = Math.round(nonFoodTotal * 0.02 * 100) / 100
      if (cashbackAmount > 0) {
        // Escrow protection for retail items: cleared in 72 hours
        await recordWalletTransaction({
          userId: numericUserId,
          type: 'CREDIT',
          category: TRANSACTION_CATEGORIES.CASHBACK,
          amount: cashbackAmount,
          referenceType: 'MASTER_ORDER',
          referenceId: result.masterOrder.id,
          description: `2% Universal Cashback for Order #${result.masterOrder.masterOrderNumber}`,
          pendingClearanceHours: 72,
        }).catch((err) => console.warn('Could not record cashback:', err.message))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order placed successfully and split into fulfillment tracks',
      data: {
        masterOrder: result.masterOrder,
        subOrders: result.subOrders,
        breakdown: decomposed,
        onTheWayAddonAvailable: decomposed.hasTrackA,
      },
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
