import { prisma } from '../prisma.js'
import { recordWalletTransaction, TRANSACTION_CATEGORIES } from '../walletLedger.js'

/**
 * Fashion & Apparel Specialized Service
 * SKU matrix & "Try & Decide" reverse logistics
 */

export const TRY_DECISION_STATUS = {
  NONE: 'NONE',
  PENDING_DECISION: 'PENDING_DECISION',
  PARTIAL_RETURN: 'PARTIAL_RETURN',
  ACCEPTED_ALL: 'ACCEPTED_ALL',
  REJECTED_ALL: 'REJECTED_ALL',
}

/**
 * Fetch SKU variant matrix and fit guide for fashion product
 */
export async function getProductSkuMatrix(productId) {
  const pId = parseInt(productId, 10)
  const product = await prisma.product.findUnique({
    where: { proId: pId },
    include: {
      skuVariants: true,
    },
  })

  if (!product) throw new Error('Fashion product not found')

  let parsedFitGuide = null
  if (product.fitGuideJson) {
    try {
      parsedFitGuide = JSON.parse(product.fitGuideJson)
    } catch {
      parsedFitGuide = product.fitGuideJson
    }
  }

  return {
    productId: product.proId,
    productName: product.proName,
    fitGuide: parsedFitGuide,
    variants: product.skuVariants,
  }
}

/**
 * Detect dual-size Try & Decide selection in cart items
 */
export function detectTryAndDecideRequirement(items) {
  const productSizeMap = new Map()

  for (const item of items) {
    if (item.vertical === 'FASHION' && item.selectedSize) {
      const prodKey = item.productId || item.id
      if (!productSizeMap.has(prodKey)) {
        productSizeMap.set(prodKey, [])
      }
      productSizeMap.get(prodKey).push(item.selectedSize)
    }
  }

  let isTryAndDecide = false
  for (const [prodId, sizes] of productSizeMap.entries()) {
    if (sizes.length > 1) {
      isTryAndDecide = true
      break
    }
  }

  return isTryAndDecide
}

/**
 * Process Try & Decide Rider-Side Decision:
 * Customer keeps preferred size, hands back rejected size to courier.
 * Automatically refunds returned items directly into customer's Rewards Wallet.
 */
export async function processTryAndDecideDecision({
  subOrderId,
  decisions, // [{ itemId, decisionStatus: 'KEPT' | 'RETURNED_TO_RIDER' }]
  courierNotes,
}) {
  const sId = parseInt(subOrderId, 10)
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: sId },
    include: {
      items: true,
      masterOrder: true,
    },
  })

  if (!subOrder) throw new Error('Sub-order not found')

  let totalRefundAmount = 0
  const updatedItemDecisions = []

  for (const dec of decisions) {
    const item = subOrder.items.find((i) => i.id === parseInt(dec.itemId, 10))
    if (!item) continue

    const isReturned = dec.decisionStatus === 'RETURNED_TO_RIDER'

    await prisma.subOrderItem.update({
      where: { id: item.id },
      data: {
        decisionStatus: isReturned ? 'RETURNED_TO_RIDER' : 'KEPT',
      },
    })

    if (isReturned) {
      totalRefundAmount += parseFloat(item.price) * item.quantity
    }

    updatedItemDecisions.push({
      itemId: item.id,
      productName: item.productName,
      decision: isReturned ? 'RETURNED_TO_RIDER' : 'KEPT',
      refundAmount: isReturned ? parseFloat(item.price) * item.quantity : 0,
    })
  }

  let finalTryStatus = TRY_DECISION_STATUS.PARTIAL_RETURN
  if (totalRefundAmount === 0) {
    finalTryStatus = TRY_DECISION_STATUS.ACCEPTED_ALL
  } else if (totalRefundAmount >= parseFloat(subOrder.subtotal)) {
    finalTryStatus = TRY_DECISION_STATUS.REJECTED_ALL
  }

  // Update sub-order status
  await prisma.subOrder.update({
    where: { id: sId },
    data: {
      tryAndDecideStatus: finalTryStatus,
    },
  })

  // If items were returned to rider, issue instant wallet refund
  let walletRefundTx = null
  if (totalRefundAmount > 0) {
    walletRefundTx = await recordWalletTransaction({
      userId: subOrder.masterOrder.userId,
      type: 'CREDIT',
      category: TRANSACTION_CATEGORIES.REFUND,
      amount: totalRefundAmount,
      referenceType: 'SUB_ORDER',
      referenceId: subOrder.id,
      description: `Try & Decide: Instant refund for size return on Order #${subOrder.subOrderNumber}`,
    })
  }

  return {
    subOrderId: subOrder.id,
    tryAndDecideStatus: finalTryStatus,
    totalRefundAmount,
    walletRefund: walletRefundTx,
    items: updatedItemDecisions,
    courierNotes: courierNotes || 'Courier verified returned garments on site',
  }
}
