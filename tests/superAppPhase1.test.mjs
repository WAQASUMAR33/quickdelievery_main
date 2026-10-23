/**
 * Test Suite: Super App Phase 1 (Unified Split-Fulfillment Engine, On-The-Way Add-on, Double-Entry Wallet)
 */
import dotenv from 'dotenv'
dotenv.config()

import { decomposeCartItems, FULFILLMENT_TRACKS, classifyProductTrack } from '../src/lib/fulfillmentEngine.js'
import { calculateDistanceKm, isAddonWindowActive } from '../src/lib/addonEngine.js'
import { recordWalletTransaction, releaseEscrowTransaction, issueSlaCompensation, getOrCreateWallet } from '../src/lib/walletLedger.js'
import { prisma } from '../src/lib/prisma.js'

async function runTests() {
  console.log('==================================================')
  console.log('RUNNING SUPER APP PHASE 1 COMPREHENSIVE TEST SUITE')
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

  try {
    // ----------------------------------------------------
    // TEST 1: Track Classification
    // ----------------------------------------------------
    console.log('[1/5] Testing Vertical Track Classification...')
    assert(
      classifyProductTrack('FOOD', 'Pizza') === FULFILLMENT_TRACKS.TRACK_A.code,
      'Food items classified into Track A (Hyperlocal Express)'
    )
    assert(
      classifyProductTrack('PHARMACY', 'Pain Relief Medicine') === FULFILLMENT_TRACKS.TRACK_A.code,
      'Urgent pharmacy items classified into Track A (Hyperlocal Express)'
    )
    assert(
      classifyProductTrack('GROCERY', 'Fresh Milk') === FULFILLMENT_TRACKS.TRACK_B.code,
      'Groceries classified into Track B (Scheduled Slot Window)'
    )
    assert(
      classifyProductTrack('SERVICES', 'Home Deep Cleaning') === FULFILLMENT_TRACKS.TRACK_B.code,
      'Services classified into Track B (Scheduled Slot Window)'
    )
    assert(
      classifyProductTrack('FASHION', 'Denim Jacket') === FULFILLMENT_TRACKS.TRACK_C.code,
      'Fashion apparel classified into Track C (Standard Courier)'
    )
    assert(
      classifyProductTrack('ELECTRONICS', 'Wireless Headphones') === FULFILLMENT_TRACKS.TRACK_C.code,
      'Electronics classified into Track C (Standard Courier)'
    )

    // ----------------------------------------------------
    // TEST 2: Multi-Vendor Unified Cart Decomposition
    // ----------------------------------------------------
    console.log('\n[2/5] Testing Multi-Vendor Cart Decomposition...')
    const sampleCart = [
      { id: 1, proName: 'Neapolitan Margherita Pizza', price: 15.00, quantity: 2, vertical: 'FOOD', vendorId: 'vendor_pizza_hub' },
      { id: 2, proName: 'Antibiotic Eye Drops', price: 8.50, quantity: 1, vertical: 'PHARMACY', vendorId: 'vendor_care_pharmacy' },
      { id: 3, proName: 'Organic Eggs 12pk', price: 4.50, quantity: 1, vertical: 'GROCERY', vendorId: 'vendor_metro_groceries' },
      { id: 4, proName: 'Classic Denim Jacket (Size M)', price: 49.99, quantity: 1, vertical: 'FASHION', vendorId: 'vendor_urban_apparel' },
    ]

    const decomposition = decomposeCartItems(sampleCart, { enableRoundUpDonation: true })

    assert(decomposition.hasTrackA === true, 'Cart recognizes Track A presence')
    assert(decomposition.hasTrackB === true, 'Cart recognizes Track B presence')
    assert(decomposition.hasTrackC === true, 'Cart recognizes Track C presence')
    assert(decomposition.subOrders.length === 4, 'Cart cleanly decomposed into 4 independent merchant sub-orders')
    assert(decomposition.cartSubtotal === 92.99, `Cart subtotal correctly calculated ($92.99 === $${decomposition.cartSubtotal})`)
    assert(decomposition.roundUpDonation > 0, `Round-up donation calculated correctly ($${decomposition.roundUpDonation})`)
    assert(decomposition.finalMasterTotal === Math.ceil(decomposition.finalMasterTotal), 'Final master total is rounded up to the nearest whole integer')

    // ----------------------------------------------------
    // TEST 3: On-The-Way Add-On Spatial & Window Logic
    // ----------------------------------------------------
    console.log('\n[3/5] Testing On-The-Way Add-on Calculations...')
    const dist1 = calculateDistanceKm(31.5204, 74.3587, 31.5240, 74.3590)
    assert(dist1 < 0.8, `Nearby vendor distance is within 800m corridor (${dist1.toFixed(3)} km < 0.8 km)`)

    const distFar = calculateDistanceKm(31.5204, 74.3587, 31.6000, 74.4500)
    assert(distFar > 0.8, `Distant vendor is correctly excluded from 800m corridor (${distFar.toFixed(2)} km > 0.8 km)`)

    const activeOrder = { onTheWayAddonUntil: new Date(Date.now() + 5 * 60 * 1000) }
    const expiredOrder = { onTheWayAddonUntil: new Date(Date.now() - 5 * 60 * 1000) }
    assert(isAddonWindowActive(activeOrder) === true, 'Active 10-minute add-on window evaluates to true')
    assert(isAddonWindowActive(expiredOrder) === false, 'Expired add-on window evaluates to false')

    // ----------------------------------------------------
    // TEST 4: Double-Entry Rewards Wallet Ledger
    // ----------------------------------------------------
    console.log('\n[4/5] Testing Double-Entry Wallet Ledger...')

    // Create a temporary test user in DB
    const testEmail = `test_wallet_${Date.now()}@rapidtechpro.com`
    const testUser = await prisma.users.create({
      data: {
        uid: `test-uid-${Date.now()}`,
        email: testEmail,
        username: 'Wallet Test User',
        phoneNumber: '+923000000000',
        role: 'CUSTOMER',
        emailVerification: true,
      },
    })

    // Test 4a: Credit Instant Spendable Balance
    const creditRes = await recordWalletTransaction({
      userId: testUser.id,
      type: 'CREDIT',
      category: 'CASHBACK',
      amount: 25.00,
      description: 'Sign-up Welcome Bonus',
    })
    assert(creditRes.transaction.amount.toString() === '25', 'Credit of $25.00 logged successfully')
    assert(creditRes.wallet.balance.toString() === '25', 'Wallet spendable balance reflects $25.00')

    // Test 4b: Debit for Purchase
    const debitRes = await recordWalletTransaction({
      userId: testUser.id,
      type: 'DEBIT',
      category: 'PURCHASE',
      amount: 10.00,
      description: 'Order Payment',
    })
    assert(debitRes.wallet.balance.toString() === '15', 'Wallet balance correctly debited to $15.00')

    // Test 4c: Reject Insufficient Balance
    let rejected = false
    try {
      await recordWalletTransaction({
        userId: testUser.id,
        type: 'DEBIT',
        category: 'PURCHASE',
        amount: 999.00,
      })
    } catch (e) {
      rejected = true
    }
    assert(rejected === true, 'Insufficient balance properly rejected with exception')

    // Test 4d: Escrow Hold (Pending Clearance)
    const escrowRes = await recordWalletTransaction({
      userId: testUser.id,
      type: 'CREDIT',
      category: 'CASHBACK',
      amount: 12.50,
      description: 'Pending Retail Cashback',
      pendingClearanceHours: 72,
    })
    assert(escrowRes.transaction.status === 'PENDING_CLEARANCE', 'Escrow transaction placed in PENDING_CLEARANCE')
    assert(escrowRes.wallet.escrowBalance.toString() === '12.5', 'Escrow balance shows $12.50')

    // Test 4e: Escrow Release
    const releasedTx = await releaseEscrowTransaction(escrowRes.transaction.id)
    assert(releasedTx.status === 'COMPLETED', 'Escrow transaction released to COMPLETED')
    const finalWallet = await getOrCreateWallet(testUser.id)
    assert(finalWallet.balance.toString() === '27.5', 'Available balance updated to $27.50 after escrow release')
    assert(finalWallet.escrowBalance.toString() === '0', 'Escrow balance reduced to $0.00')

    // ----------------------------------------------------
    // TEST 5: Automated SLA Delay Compensation
    // ----------------------------------------------------
    console.log('\n[5/5] Testing Automated SLA Compensation Workflow...')
    const masterOrder = await prisma.masterOrder.create({
      data: {
        masterOrderNumber: `MO-TEST-${Date.now()}`,
        userId: testUser.id,
        paymentMethod: 'CREDIT_CARD',
        totalAmount: 30.00,
        shippingAddress: '123 Test St',
      },
    })

    const subOrder = await prisma.subOrder.create({
      data: {
        subOrderNumber: `${masterOrder.masterOrderNumber}-S1`,
        masterOrderId: masterOrder.id,
        vendorId: 'vendor_pizza_hub',
        fulfillmentTrack: FULFILLMENT_TRACKS.TRACK_A.code,
        subtotal: 25.00,
        deliveryFee: 2.50,
        createdAt: new Date(Date.now() - 65 * 60 * 1000), // Placed 65 mins ago (violates 45m SLA + 15m grace)
      },
    })

    const slaResult = await issueSlaCompensation(subOrder.id, 5.00)
    assert(slaResult.transaction.category === 'SLA_COMPENSATION', 'SLA compensation transaction categorized as SLA_COMPENSATION')
    assert(slaResult.transaction.amount.toString() === '5', 'Compensation amount is exactly $5.00')

    const updatedSubOrder = await prisma.subOrder.findUnique({ where: { id: subOrder.id } })
    assert(updatedSubOrder.slaCompensated === true, 'SubOrder marked as compensated against duplicate claims')

    // Cleanup test user and orders
    await prisma.communityDonation.deleteMany({ where: { userId: testUser.id } })
    await prisma.subOrderItem.deleteMany({ where: { subOrderId: subOrder.id } })
    await prisma.subOrder.deleteMany({ where: { masterOrderId: masterOrder.id } })
    await prisma.masterOrder.deleteMany({ where: { userId: testUser.id } })
    await prisma.walletTransaction.deleteMany({ where: { walletId: finalWallet.id } })
    await prisma.wallet.deleteMany({ where: { userId: testUser.id } })
    await prisma.users.delete({ where: { id: testUser.id } })

    console.log('\n==================================================')
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('==================================================')

    if (failed > 0) process.exit(1)
    else process.exit(0)

  } catch (err) {
    console.error('Test execution failed with error:', err)
    process.exit(1)
  }
}

runTests()
