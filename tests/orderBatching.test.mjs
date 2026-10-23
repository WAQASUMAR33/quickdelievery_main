/**
 * Test Suite: Order Batching & Dispatch Engine
 * Verifies .agents/skills/order_batching/SKILL.md implementation
 */
import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../src/lib/prisma.js'
import { executeOrderBatchingPipeline } from '../src/lib/orderBatchingEngine.js'

async function runBatchingTests() {
  console.log('====================================================')
  console.log('RUNNING ORDER BATCHING & DISPATCH ENGINE TEST SUITE')
  console.log('====================================================\n')

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

  // Setup test customer user
  const testEmail = `batch_tester_${Date.now()}@rapidtechpro.com`
  const testUser = await prisma.users.create({
    data: {
      uid: `uid-batch-${Date.now()}`,
      email: testEmail,
      username: 'Batching Test Customer',
      phoneNumber: '+923009988776',
      role: 'CUSTOMER',
      emailVerification: true,
    },
  })

  // Create Order 1 (Dropoff at Lat 31.5204, Lng 74.3587)
  const order1 = await prisma.order.create({
    data: {
      userId: testUser.id,
      status: 'PENDING',
      totalAmount: 1500.0,
      serviceCharge: 120.0,
      shippingAddress: 'Main Blvd, Gulberg III, Lahore',
      deliveryLatitude: 31.5204,
      deliveryLongitude: 74.3587,
    },
  })

  // Create Order 2 (Dropoff 1.2 km away at Lat 31.5240, Lng 74.3590 - within 3.5km detour limit)
  const order2 = await prisma.order.create({
    data: {
      userId: testUser.id,
      status: 'PENDING',
      totalAmount: 1800.0,
      serviceCharge: 120.0,
      shippingAddress: 'Ghalib Market, Gulberg II, Lahore',
      deliveryLatitude: 31.5240,
      deliveryLongitude: 74.3590,
    },
  })

  try {
    const result = await executeOrderBatchingPipeline({
      maxDetourKm: 3.5,
      maxPrepTimeDiffMinutes: 7,
    })

    assert(result.total_evaluated_orders >= 2, 'Pipeline ingested pending orders for batching')
    assert(result.batches_formed >= 1, 'Pipeline successfully created at least 1 batched multi-order stack')

    const sampleBatch = result.batch_assignment[0]
    assert(sampleBatch.type === 'BATCHED_MULTIPLE', 'Batch type is BATCHED_MULTIPLE')
    assert(sampleBatch.total_orders === 2, 'Batch contains exactly 2 stacked orders')
    assert(sampleBatch.detour_km <= 3.5, `Detour distance is within 3.5km limit (${sampleBatch.detour_km} km <= 3.5 km)`)
    assert(sampleBatch.prep_time_diff_min <= 7, `Prep time difference within 7m limit (${sampleBatch.prep_time_diff_min}m <= 7m)`)

    // Verify 4-step routing sequence: Pickup 1 -> Pickup 2 -> Deliver 1 -> Deliver 2
    assert(sampleBatch.routing_steps.length === 4, 'Route sequence has exactly 4 steps')
    assert(sampleBatch.routing_steps[0].action === 'PICKUP', 'Step 1 is PICKUP')
    assert(sampleBatch.routing_steps[1].action === 'PICKUP', 'Step 2 is PICKUP')
    assert(sampleBatch.routing_steps[2].action === 'DELIVER', 'Step 3 is DELIVER')
    assert(sampleBatch.routing_steps[3].action === 'DELIVER', 'Step 4 is DELIVER')

    // Cleanup
    await prisma.order.deleteMany({ where: { id: { in: [order1.id, order2.id] } } })
    await prisma.users.delete({ where: { id: testUser.id } })

    console.log('\n====================================================')
    console.log(`BATCHING TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('====================================================')

    if (failed > 0) process.exit(1)
    else process.exit(0)

  } catch (err) {
    console.error('Batching test failed:', err)
    process.exit(1)
  }
}

runBatchingTests()
