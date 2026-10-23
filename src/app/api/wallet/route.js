import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getOrCreateWallet, recordWalletTransaction } from '@/lib/walletLedger'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 })
    }

    const numericUserId = parseInt(userId, 10)
    const wallet = await getOrCreateWallet(numericUserId)

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      data: {
        walletId: wallet.id,
        userId: wallet.userId,
        balance: parseFloat(wallet.balance),
        escrowBalance: parseFloat(wallet.escrowBalance),
        totalNetWorth: parseFloat(wallet.balance) + parseFloat(wallet.escrowBalance),
        currency: wallet.currency,
        transactions: transactions.map((t) => ({
          id: t.id,
          type: t.type,
          category: t.category,
          amount: parseFloat(t.amount),
          balanceAfter: parseFloat(t.balanceAfter),
          status: t.status,
          clearanceAt: t.clearanceAt,
          description: t.description,
          createdAt: t.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Wallet fetch error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { userId, type, category, amount, description, referenceType, referenceId, pendingClearanceHours = 0 } = body

    if (!userId || !type || !category || amount == null) {
      return NextResponse.json(
        { success: false, error: 'userId, type, category, and amount are required' },
        { status: 400 }
      )
    }

    const result = await recordWalletTransaction({
      userId: parseInt(userId, 10),
      type,
      category,
      amount: parseFloat(amount),
      description: description || `Wallet transaction: ${category}`,
      referenceType,
      referenceId,
      pendingClearanceHours,
    })

    return NextResponse.json({
      success: true,
      message: 'Transaction successfully processed and recorded in ledger',
      data: result,
    })
  } catch (error) {
    console.error('Wallet transaction error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}
