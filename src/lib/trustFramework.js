import { prisma } from './prisma.js'
import { recordWalletTransaction, TRANSACTION_CATEGORIES } from './walletLedger.js'

/**
 * Trust, Verification & Guarantee Framework
 */

export const DISPUTE_STATUS = {
  PENDING: 'PENDING',
  ESCROW_HELD: 'ESCROW_HELD',
  APPROVED_REFUNDED: 'APPROVED_REFUNDED',
  REJECTED: 'REJECTED',
}

export const DISPUTE_REASONS = {
  DAMAGED: 'DAMAGED',
  EXPIRED: 'EXPIRED',
  MISSING_ITEMS: 'MISSING_ITEMS',
  WRONG_ITEM: 'WRONG_ITEM',
}

/**
 * Multi-Factor Trust Score algorithm for Vendors (0.00 to 5.00)
 * Weighted factors:
 * - Order cancellation rate (Weight: 30%)
 * - Average prep/fulfillment delay (Weight: 25%)
 * - Dispute / refund frequency (Weight: 25%)
 * - Hygiene / licensing document verification (Weight: 20%)
 */
export async function calculateVendorTrustScore(vendorId) {
  // 1. Gather vendor metrics from SubOrders
  const subOrders = await prisma.subOrder.findMany({
    where: { vendorId },
    include: { disputes: true },
  })

  const totalOrders = subOrders.length
  let cancelledCount = 0
  let totalDisputes = 0
  let totalDelayMinutes = 0
  let delayedOrderCount = 0

  for (const o of subOrders) {
    if (o.status === 'CANCELLED') cancelledCount++
    if (o.disputes && o.disputes.length > 0) totalDisputes += o.disputes.length

    // If SLA deadline was exceeded
    if (o.slaDeadline && o.updatedAt > o.slaDeadline && o.status === 'DELIVERED') {
      const delay = Math.max(0, (o.updatedAt.getTime() - o.slaDeadline.getTime()) / (60 * 1000))
      totalDelayMinutes += delay
      delayedOrderCount++
    }
  }

  const cancellationRate = totalOrders > 0 ? cancelledCount / totalOrders : 0.0
  const disputeFrequency = totalOrders > 0 ? totalDisputes / totalOrders : 0.0
  const avgPrepDelayMinutes = delayedOrderCount > 0 ? totalDelayMinutes / delayedOrderCount : 0.0

  // 2. Fetch or create vendor trust score record to check license verification
  let existingScore = await prisma.vendorTrustScore.findUnique({
    where: { vendorId },
  })

  const isLicenseVerified = existingScore ? existingScore.isLicenseVerified : true

  // 3. Compute Multi-Factor Score (0.00 to 5.00)
  let score = 5.00

  // Penalty for cancellations: every 5% cancellation reduces score by 0.50
  const cancelPenalty = Math.min(2.0, (cancellationRate / 0.05) * 0.5)
  score -= cancelPenalty

  // Penalty for disputes: every 2% disputes reduces score by 0.50
  const disputePenalty = Math.min(2.0, (disputeFrequency / 0.02) * 0.5)
  score -= disputePenalty

  // Penalty for delays: >15 min avg delay penalizes up to 1.0
  if (avgPrepDelayMinutes > 15) {
    score -= Math.min(1.0, ((avgPrepDelayMinutes - 15) / 15) * 0.5)
  }

  // License verification: unverified documents capped at 3.20 max
  if (!isLicenseVerified) {
    score = Math.min(score, 3.20)
  }

  // Clamp score between 0.00 and 5.00
  const finalTrustScore = Math.max(0.00, Math.min(5.00, Math.round(score * 100) / 100))

  const updatedScore = await prisma.vendorTrustScore.upsert({
    where: { vendorId },
    update: {
      cancellationRate,
      avgPrepDelayMinutes,
      disputeFrequency,
      trustScore: finalTrustScore,
      totalOrdersEvaluated: totalOrders,
      isLicenseVerified,
    },
    create: {
      vendorId,
      cancellationRate,
      avgPrepDelayMinutes,
      disputeFrequency,
      trustScore: finalTrustScore,
      totalOrdersEvaluated: totalOrders,
      isLicenseVerified,
    },
  })

  return updatedScore
}

/**
 * File an Order Dispute with photographic / video evidence
 * Triggers instant triage: places merchant payout on hold in Escrow.
 */
export async function fileOrderDispute({
  subOrderId,
  userId,
  reason,
  evidencePhotoUrl,
  evidenceVideoUrl,
  refundAmount,
}) {
  const sId = parseInt(subOrderId, 10)
  const uId = parseInt(userId, 10)

  const subOrder = await prisma.subOrder.findUnique({
    where: { id: sId },
  })

  if (!subOrder) throw new Error('Sub-order not found')
  if (!reason) throw new Error('Dispute reason is required')
  if (!evidencePhotoUrl && !evidenceVideoUrl) {
    throw new Error('Photographic or video evidence is required for dispute verification')
  }

  const disputeRefund = parseFloat(refundAmount) || parseFloat(subOrder.subtotal)

  const dispute = await prisma.orderDispute.create({
    data: {
      subOrderId: sId,
      userId: uId,
      reason,
      evidencePhotoUrl: evidencePhotoUrl || null,
      evidenceVideoUrl: evidenceVideoUrl || null,
      status: DISPUTE_STATUS.ESCROW_HELD,
      refundAmount: disputeRefund,
      merchantHoldApplied: true,
      adminNotes: 'Automated triage: merchant balance escrow hold applied pending review',
    },
  })

  // Recalculate vendor trust score
  await calculateVendorTrustScore(subOrder.vendorId)

  return dispute
}

/**
 * Resolve Order Dispute: Approve refund to customer Rewards Wallet or Reject
 */
export async function resolveOrderDispute({ disputeId, resolution, adminNotes }) {
  const dId = parseInt(disputeId, 10)
  const dispute = await prisma.orderDispute.findUnique({
    where: { id: dId },
    include: {
      subOrder: true,
    },
  })

  if (!dispute) throw new Error('Dispute record not found')

  if (resolution === 'APPROVE_REFUND') {
    // 1. Issue refund credit to customer wallet
    const refundTx = await recordWalletTransaction({
      userId: dispute.userId,
      type: 'CREDIT',
      category: TRANSACTION_CATEGORIES.REFUND,
      amount: parseFloat(dispute.refundAmount),
      referenceType: 'SUB_ORDER',
      referenceId: dispute.subOrderId,
      description: `Dispute Resolution Approved: Refund for Order #${dispute.subOrder.subOrderNumber} (${dispute.reason})`,
    })

    // 2. Update dispute status
    const updated = await prisma.orderDispute.update({
      where: { id: dId },
      data: {
        status: DISPUTE_STATUS.APPROVED_REFUNDED,
        merchantHoldApplied: false,
        adminNotes: adminNotes || 'Refund granted to customer Universal Rewards Wallet',
      },
    })

    return { dispute: updated, refundTx }
  } else if (resolution === 'REJECT') {
    const updated = await prisma.orderDispute.update({
      where: { id: dId },
      data: {
        status: DISPUTE_STATUS.REJECTED,
        merchantHoldApplied: false,
        adminNotes: adminNotes || 'Dispute rejected upon evidence inspection',
      },
    })

    return { dispute: updated, refundTx: null }
  } else {
    throw new Error(`Invalid resolution: ${resolution}`)
  }
}

/**
 * Live In-Store Quality Check
 * Allows vendor or courier to upload short verification clip or photo before dispatch
 */
export async function uploadLiveQualityCheck({ subOrderId, photoUrl, videoUrl }) {
  const sId = parseInt(subOrderId, 10)

  if (!photoUrl && !videoUrl) {
    throw new Error('Either a verification photo or video clip is required')
  }

  const updatedSubOrder = await prisma.subOrder.update({
    where: { id: sId },
    data: {
      qualityCheckPhotoUrl: photoUrl || null,
      qualityCheckVideoUrl: videoUrl || null,
      qualityCheckStatus: 'VERIFIED',
    },
  })

  return updatedSubOrder
}
