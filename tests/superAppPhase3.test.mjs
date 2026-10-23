/**
 * Test Suite: Super App Phase 3 (Trust, Verification & Guarantee Framework)
 * Multi-factor vendor trust score, dispute triage, escrow holds, live quality check
 */
import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../src/lib/prisma.js'
import {
  calculateVendorTrustScore,
  fileOrderDispute,
  resolveOrderDispute,
  uploadLiveQualityCheck,
  DISPUTE_STATUS,
} from '../src/lib/trustFramework.js'

async function runPhase3Tests() {
  console.log('==================================================')
  console.log('RUNNING SUPER APP PHASE 3 COMPREHENSIVE TEST SUITE')
  console.log('==================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  PASS: ${message}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${message}`)
      failed++
    }
  }

  // Setup temporary test user
  const testEmail = `phase3_tester_${Date.now()}@rapidtechpro.com`
  const testUser = await prisma.users.create({
    data: {
      uid: `uid-p3-${Date.now()}`,
      email: testEmail,
      username: 'Phase 3 Trust Tester',
      phoneNumber: '+923222222222',
      role: 'CUSTOMER',
      emailVerification: true,
    },
  })

  const testVendorId = `vendor_trust_${Date.now()}`

  try {
    // ----------------------------------------------------
    // TEST 1: Multi-Factor Vendor Trust Score Algorithm
    // ----------------------------------------------------
    console.log('[1/3] Testing Multi-Factor Vendor Trust Score Algorithm...')

    // 1a: Default perfect score for new verified merchant
    const initialScore = await calculateVendorTrustScore(testVendorId)
    assert(parseFloat(initialScore.trustScore) === 5.00, 'New merchant starts with baseline 5.00 Trust Score')
    assert(initialScore.isLicenseVerified === true, 'Vendor license initialized as verified')

    // 1b: Unverified license caps trust score
    await prisma.vendorTrustScore.update({
      where: { vendorId: testVendorId },
      data: { isLicenseVerified: false },
    })
    const unverifiedScore = await calculateVendorTrustScore(testVendorId)
    assert(parseFloat(unverifiedScore.trustScore) <= 3.20, 'Unverified vendor license caps trust score at 3.20')

    // Restore license verification
    await prisma.vendorTrustScore.update({
      where: { vendorId: testVendorId },
      data: { isLicenseVerified: true },
    })

    // ----------------------------------------------------
    // TEST 2: Order Dispute Resolution & Automated Escrow Holds
    // ----------------------------------------------------
    console.log('\n[2/3] Testing Dispute Resolution & Automated Escrow Holds...')

    const masterOrder = await prisma.masterOrder.create({
      data: {
        masterOrderNumber: `MO-TRUST-${Date.now()}`,
        userId: testUser.id,
        paymentMethod: 'CREDIT_CARD',
        totalAmount: 50.00,
        shippingAddress: '456 Guarantee Blvd',
      },
    })

    const subOrder = await prisma.subOrder.create({
      data: {
        subOrderNumber: `${masterOrder.masterOrderNumber}-S1`,
        masterOrderId: masterOrder.id,
        vendorId: testVendorId,
        fulfillmentTrack: 'TRACK_A_HYPERLOCAL_EXPRESS',
        subtotal: 45.00,
        deliveryFee: 5.00,
      },
    })

    // 2a: Missing evidence should be strictly rejected
    let evidenceRejected = false
    try {
      await fileOrderDispute({
        subOrderId: subOrder.id,
        userId: testUser.id,
        reason: 'DAMAGED',
        evidencePhotoUrl: null,
        evidenceVideoUrl: null,
      })
    } catch {
      evidenceRejected = true
    }
    assert(evidenceRejected, 'Dispute filing without photographic or video proof is strictly rejected')

    // 2b: File valid dispute with photographic proof
    const dispute = await fileOrderDispute({
      subOrderId: subOrder.id,
      userId: testUser.id,
      reason: 'DAMAGED',
      evidencePhotoUrl: 'https://s3.ap-southeast-2.amazonaws.com/quickdelivery-disputes/leaked_food_proof.jpg',
      refundAmount: 45.00,
    })

    assert(dispute.status === DISPUTE_STATUS.ESCROW_HELD, 'Dispute initialized with ESCROW_HELD status')
    assert(dispute.merchantHoldApplied === true, 'Merchant balance escrow hold applied immediately')
    assert(parseFloat(dispute.refundAmount) === 45.00, 'Claim refund amount recorded as $45.00')

    // 2c: Resolve dispute with approval -> issues instant wallet refund
    const resolution = await resolveOrderDispute({
      disputeId: dispute.id,
      resolution: 'APPROVE_REFUND',
      adminNotes: 'Inspection verified container seal was broken in transit',
    })

    assert(resolution.dispute.status === DISPUTE_STATUS.APPROVED_REFUNDED, 'Dispute status updated to APPROVED_REFUNDED')
    assert(resolution.dispute.merchantHoldApplied === false, 'Escrow hold released upon resolution')
    assert(resolution.refundTx !== null, 'Wallet refund transaction generated')
    assert(resolution.refundTx.transaction.category === 'REFUND', 'Transaction categorized as REFUND')
    assert(parseFloat(resolution.refundTx.transaction.amount) === 45.00, 'Full refund of $45.00 credited to wallet')

    // ----------------------------------------------------
    // TEST 3: Live In-Store Quality Check
    // ----------------------------------------------------
    console.log('\n[3/3] Testing Live In-Store Quality Check Workflow...')

    const verifiedSubOrder = await uploadLiveQualityCheck({
      subOrderId: subOrder.id,
      photoUrl: 'https://s3.ap-southeast-2.amazonaws.com/quickdelivery-quality/fresh_produce_handover.jpg',
    })

    assert(verifiedSubOrder.qualityCheckStatus === 'VERIFIED', 'SubOrder marked as VERIFIED for live quality check')
    assert(verifiedSubOrder.qualityCheckPhotoUrl.includes('fresh_produce_handover.jpg'), 'Quality check photo attached to order')

    // Cleanup Phase 3 test records
    await prisma.orderDispute.deleteMany({ where: { subOrderId: subOrder.id } })
    await prisma.subOrderItem.deleteMany({ where: { subOrderId: subOrder.id } })
    await prisma.subOrder.deleteMany({ where: { masterOrderId: masterOrder.id } })
    await prisma.masterOrder.deleteMany({ where: { userId: testUser.id } })
    await prisma.vendorTrustScore.deleteMany({ where: { vendorId: testVendorId } })
    await prisma.walletTransaction.deleteMany({ where: { wallet: { userId: testUser.id } } })
    await prisma.wallet.deleteMany({ where: { userId: testUser.id } })
    await prisma.users.delete({ where: { id: testUser.id } })

    console.log('\n==================================================')
    console.log(`PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('==================================================')

    if (failed > 0) process.exit(1)
    else process.exit(0)

  } catch (err) {
    console.error('Phase 3 test execution failed with error:', err)
    process.exit(1)
  }
}

runPhase3Tests()
