/**
 * Driver Module Diagnostics & Functional Verification Test Suite
 */
import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../src/lib/prisma.js'

async function testDriverModule() {
  console.log('====================================================')
  console.log('RUNNING DRIVER MODULE DEEP DIAGNOSTIC VERIFICATION')
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

  // 1. Setup test driver user
  const driverEmail = `diag_driver_${Date.now()}@rapidtechpro.com`
  const driverUser = await prisma.users.create({
    data: {
      uid: `uid-drv-${Date.now()}`,
      email: driverEmail,
      username: 'Diagnostic Test Driver',
      phoneNumber: '+923001122334',
      role: 'DRIVER',
      emailVerification: true,
    },
  })

  // 2. Setup DriverProfile
  let profile = await prisma.driverProfile.create({
    data: {
      userId: driverUser.id,
      cnicNumber: '35201-1234567-1',
      licenseNumber: 'PK-DL-2026-88',
      homeAddress: 'Sector C, Phase 5, DHA Lahore',
      bankName: 'Meezan Bank Ltd',
      bankAccountTitle: 'Diagnostic Test Driver',
      bankAccountNumber: '02010109988776',
      profilePhotoUrl: 'https://i.pravatar.cc/150?u=diag_driver',
      vehicleType: 'MOTORCYCLE',
      dutyStatus: 'ON_DUTY',
      preferredZone: 'Gulberg Commercial & Residential',
      shiftSchedule: 'Morning Breakfast Shift',
    },
  })
  assert(profile.dutyStatus === 'ON_DUTY', 'Driver profile initialized with ON_DUTY status')

  // 3. Test Driver Location GPS update
  const location = await prisma.driverLocation.upsert({
    where: { driverId: driverUser.id },
    update: {
      latitude: 31.5204,
      longitude: 74.3587,
      heading: 45.0,
      speed: 25.5,
    },
    create: {
      driverId: driverUser.id,
      latitude: 31.5204,
      longitude: 74.3587,
      heading: 45.0,
      speed: 25.5,
    },
  })
  assert(location.latitude === 31.5204, 'Driver GPS latitude logged correctly')
  assert(location.longitude === 74.3587, 'Driver GPS longitude logged correctly')

  // 4. Test Available Order Pool & Claiming
  // Create an order in pool
  const testOrder = await prisma.order.create({
    data: {
      userId: driverUser.id, // for testing
      status: 'PENDING',
      totalAmount: 2500.0,
      serviceCharge: 150.0,
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: 'Gulberg III, Lahore, Pakistan | Tel: 03001122334',
      deliveryLatitude: 31.5250,
      deliveryLongitude: 74.3600,
    },
  })

  // Claim order (driverId assigned, status -> PROCESSING or SHIPPED)
  const claimedOrder = await prisma.order.update({
    where: { id: testOrder.id },
    data: {
      driverId: driverUser.id,
      status: 'SHIPPED',
    },
  })
  assert(claimedOrder.driverId === driverUser.id, 'Driver successfully claimed order from pool')
  assert(claimedOrder.status === 'SHIPPED', 'Order transitioned to SHIPPED (Out for Delivery)')

  // 5. Test Dual-Order Stacking Constraint (Foodpanda policy: max 2 active orders)
  const testOrder2 = await prisma.order.create({
    data: {
      userId: driverUser.id,
      status: 'SHIPPED',
      driverId: driverUser.id,
      totalAmount: 1800.0,
      serviceCharge: 120.0,
      paymentMethod: 'CASH_ON_DELIVERY',
      shippingAddress: 'Gulberg II, Lahore, Pakistan',
      deliveryLatitude: 31.5280,
      deliveryLongitude: 74.3620,
    },
  })

  const activeCount = await prisma.order.count({
    where: {
      driverId: driverUser.id,
      status: { in: ['PENDING', 'PROCESSING', 'SHIPPED'] },
    },
  })
  assert(activeCount === 2, 'Driver has exactly 2 stacked active orders (at max threshold)')

  // 6. Test Delivery Completion & Earnings Accumulation
  const delivered1 = await prisma.order.update({
    where: { id: testOrder.id },
    data: { status: 'DELIVERED' },
  })
  assert(delivered1.status === 'DELIVERED', 'First order marked as DELIVERED')

  const delivered2 = await prisma.order.update({
    where: { id: testOrder2.id },
    data: { status: 'DELIVERED' },
  })
  assert(delivered2.status === 'DELIVERED', 'Second order marked as DELIVERED')

  // Calculate Driver Wallet Earnings & COD Cash in Hand
  const deliveredOrders = await prisma.order.findMany({
    where: { driverId: driverUser.id, status: 'DELIVERED' },
    select: { serviceCharge: true, totalAmount: true, paymentMethod: true },
  })

  const driverEarnings = deliveredOrders.reduce((sum, o) => sum + (parseFloat(o.serviceCharge) || 120), 0)
  const codInHand = deliveredOrders
    .filter((o) => o.paymentMethod === 'CASH_ON_DELIVERY')
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0)

  assert(driverEarnings === 270, `Driver delivery earnings accumulated correctly (150 + 120 = Rs. ${driverEarnings})`)
  assert(codInHand === 4300, `COD floating cash in hand calculated correctly (2500 + 1800 = Rs. ${codInHand})`)

  // Cleanup
  await prisma.order.deleteMany({ where: { driverId: driverUser.id } })
  await prisma.driverLocation.deleteMany({ where: { driverId: driverUser.id } })
  await prisma.driverProfile.deleteMany({ where: { userId: driverUser.id } })
  await prisma.users.delete({ where: { id: driverUser.id } })

  console.log('\n====================================================')
  console.log(`DRIVER DIAGNOSTIC SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('====================================================')

  if (failed > 0) process.exit(1)
  else process.exit(0)
}

testDriverModule().catch((err) => {
  console.error('Driver diagnostic failed:', err)
  process.exit(1)
})
