import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { issueSlaCompensation } from '@/lib/walletLedger'
import { FULFILLMENT_TRACKS } from '@/lib/fulfillmentEngine'

export async function POST(req) {
  try {
    const body = await req.json()
    const { subOrderId, forceOverride = false } = body

    if (!subOrderId) {
      return NextResponse.json({ success: false, error: 'subOrderId is required' }, { status: 400 })
    }

    const subOrder = await prisma.subOrder.findUnique({
      where: { id: parseInt(subOrderId, 10) },
      include: { masterOrder: true },
    })

    if (!subOrder) {
      return NextResponse.json({ success: false, error: 'SubOrder not found' }, { status: 404 })
    }

    if (subOrder.fulfillmentTrack !== FULFILLMENT_TRACKS.TRACK_A.code && !forceOverride) {
      return NextResponse.json(
        { success: false, error: 'SLA Guarantee applies specifically to Track A Hyperlocal Express orders' },
        { status: 400 }
      )
    }

    if (subOrder.slaCompensated) {
      return NextResponse.json(
        { success: false, error: 'Compensatory credits have already been issued for this order' },
        { status: 400 }
      )
    }

    // Verify SLA violation: creation time + 45 min SLA + 15 min grace window (60 min total)
    const now = new Date()
    const createdAt = new Date(subOrder.createdAt)
    const elapsedMinutes = (now.getTime() - createdAt.getTime()) / (60 * 1000)

    const threshold = FULFILLMENT_TRACKS.TRACK_A.slaCompensateThresholdMinutes // 60 minutes
    const isBreached = elapsedMinutes >= threshold || forceOverride

    if (!isBreached) {
      return NextResponse.json({
        success: false,
        error: `Order has not yet exceeded SLA guarantee window. Elapsed: ${Math.round(elapsedMinutes)}m, Required Threshold: ${threshold}m`,
      }, { status: 400 })
    }

    // Auto-issue compensation credit
    const compensation = await issueSlaCompensation(subOrder.id, 5.00)

    return NextResponse.json({
      success: true,
      message: 'SLA violation verified. $5.00 in compensatory wallet credits automatically issued to customer.',
      data: compensation,
    })
  } catch (error) {
    console.error('SLA compensation error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
