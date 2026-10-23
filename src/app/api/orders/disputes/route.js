import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fileOrderDispute } from '@/lib/trustFramework'

export async function POST(request) {
  try {
    const body = await request.json()
    const { subOrderId, userId, reason, evidencePhotoUrl, evidenceVideoUrl, refundAmount } = body

    if (!subOrderId || !userId || !reason) {
      return NextResponse.json(
        { error: 'subOrderId, userId, and reason are required' },
        { status: 400 }
      )
    }

    const dispute = await fileOrderDispute({
      subOrderId,
      userId,
      reason,
      evidencePhotoUrl,
      evidenceVideoUrl,
      refundAmount,
    })

    return NextResponse.json({
      success: true,
      dispute,
      message: 'Dispute filed successfully. Automated triage applied: merchant balance placed on escrow hold.',
    })
  } catch (error) {
    console.error('File dispute error:', error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const subOrderId = searchParams.get('subOrderId')

    const where = {}
    if (userId) where.userId = parseInt(userId, 10)
    if (subOrderId) where.subOrderId = parseInt(subOrderId, 10)

    const disputes = await prisma.orderDispute.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subOrder: true,
        user: { select: { id: true, username: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, disputes })
  } catch (error) {
    console.error('Fetch disputes error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
