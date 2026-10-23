import { prisma } from './prisma.js'

/**
 * Double-Entry Universal Rewards Wallet Engine
 */

export const TRANSACTION_CATEGORIES = {
  CASHBACK: 'CASHBACK',
  PURCHASE: 'PURCHASE',
  SLA_COMPENSATION: 'SLA_COMPENSATION',
  REFUND: 'REFUND',
  ROUNDUP_DONATION: 'ROUNDUP_DONATION',
  ESCROW_HOLD: 'ESCROW_HOLD',
  ESCROW_RELEASE: 'ESCROW_RELEASE',
}

/**
 * Get or initialize user's wallet
 */
export async function getOrCreateWallet(userId) {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  })

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        balance: 0.00,
        escrowBalance: 0.00,
        currency: 'USD',
      },
    })
  }

  return wallet
}

/**
 * Record a double-entry transaction on the user's wallet
 */
export async function recordWalletTransaction({
  userId,
  type, // 'CREDIT' | 'DEBIT'
  category, // CASHBACK, PURCHASE, SLA_COMPENSATION, etc.
  amount,
  referenceType = null,
  referenceId = null,
  description = '',
  pendingClearanceHours = 0,
}) {
  const numAmount = Math.round(parseFloat(amount) * 100) / 100
  if (numAmount <= 0) {
    throw new Error('Transaction amount must be strictly greater than 0')
  }

  const wallet = await getOrCreateWallet(userId)
  const currentBalance = parseFloat(wallet.balance)
  const currentEscrow = parseFloat(wallet.escrowBalance)

  let newBalance = currentBalance
  let newEscrow = currentEscrow
  let status = 'COMPLETED'
  let clearanceAt = null

  if (type === 'DEBIT') {
    if (currentBalance < numAmount) {
      throw new Error(`Insufficient wallet balance. Available: $${currentBalance.toFixed(2)}, Required: $${numAmount.toFixed(2)}`)
    }
    newBalance = Math.round((currentBalance - numAmount) * 100) / 100
  } else if (type === 'CREDIT') {
    if (pendingClearanceHours > 0) {
      // Escrow protection for long-tail retail items (pending clearance)
      status = 'PENDING_CLEARANCE'
      clearanceAt = new Date(Date.now() + pendingClearanceHours * 60 * 60 * 1000)
      newEscrow = Math.round((currentEscrow + numAmount) * 100) / 100
    } else {
      // Immediate spendable credit
      newBalance = Math.round((currentBalance + numAmount) * 100) / 100
    }
  } else {
    throw new Error(`Invalid transaction type: ${type}`)
  }

  // Execute atomic wallet ledger transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        escrowBalance: newEscrow,
      },
    })

    const transaction = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type,
        category,
        amount: numAmount,
        balanceAfter: newBalance,
        status,
        clearanceAt,
        referenceType,
        referenceId: referenceId ? String(referenceId) : null,
        description,
      },
    })

    return { wallet: updatedWallet, transaction }
  })

  return result
}

/**
 * Release escrow hold to available balance when merchant return window expires
 */
export async function releaseEscrowTransaction(transactionId) {
  const txRecord = await prisma.walletTransaction.findUnique({
    where: { id: parseInt(transactionId, 10) },
    include: { wallet: true },
  })

  if (!txRecord || txRecord.status !== 'PENDING_CLEARANCE') {
    throw new Error('Transaction is not pending escrow clearance')
  }

  const amount = parseFloat(txRecord.amount)
  const wallet = txRecord.wallet
  const newBalance = Math.round((parseFloat(wallet.balance) + amount) * 100) / 100
  const newEscrow = Math.max(0, Math.round((parseFloat(wallet.escrowBalance) - amount) * 100) / 100)

  const updated = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        balance: newBalance,
        escrowBalance: newEscrow,
      },
    })

    const updatedTx = await tx.walletTransaction.update({
      where: { id: txRecord.id },
      data: {
        status: 'COMPLETED',
        balanceAfter: newBalance,
        description: `${txRecord.description} (Escrow Released)`,
      },
    })

    return updatedTx
  })

  return updated
}

/**
 * Automated SLA Violation Compensation Credit
 * Directly issues compensatory wallet credits when a Hyperlocal Express order is delayed by >15 minutes
 */
export async function issueSlaCompensation(subOrderId, compensationAmount = 5.00) {
  const subOrder = await prisma.subOrder.findUnique({
    where: { id: parseInt(subOrderId, 10) },
    include: {
      masterOrder: true,
    },
  })

  if (!subOrder) throw new Error('Sub-order not found')
  if (subOrder.slaCompensated) throw new Error('SLA compensation already issued for this order')

  const userId = subOrder.masterOrder.userId

  const ledgerResult = await recordWalletTransaction({
    userId,
    type: 'CREDIT',
    category: TRANSACTION_CATEGORIES.SLA_COMPENSATION,
    amount: compensationAmount,
    referenceType: 'SUB_ORDER',
    referenceId: subOrder.id,
    description: `Automated SLA Compensation: Hyperlocal Express delivery delayed on Order #${subOrder.subOrderNumber}`,
    pendingClearanceHours: 0, // Immediately available!
  })

  // Mark sub-order as compensated
  await prisma.subOrder.update({
    where: { id: subOrder.id },
    data: { slaCompensated: true },
  })

  return ledgerResult
}
