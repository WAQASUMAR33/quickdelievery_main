/**
 * Test Suite: Super App Phase 2 (Specialized Vertical Sub-Modules)
 * Pharmacy Rx workflow, Food Modifiers/Dining, Fashion Try & Decide, Home Services
 */
import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../src/lib/prisma.js'
import {
  uploadPrescription,
  reviewPrescription,
  validatePrescriptionForItems,
  RX_STATUS,
} from '../src/lib/verticals/pharmacyService.js'
import {
  calculateFoodItemPrice,
  filterFoodByDietaryPreferences,
  createTableBooking,
  updateTableBookingStatus,
  BOOKING_STATUS,
} from '../src/lib/verticals/foodService.js'
import {
  detectTryAndDecideRequirement,
  processTryAndDecideDecision,
  TRY_DECISION_STATUS,
} from '../src/lib/verticals/fashionService.js'
import {
  verifyServiceRadius,
  bookServiceSlot,
  acceptServiceQuotation,
  dispatchTechnician,
  SERVICE_STATUS,
} from '../src/lib/verticals/servicesService.js'

async function runPhase2Tests() {
  console.log('==================================================')
  console.log('RUNNING SUPER APP PHASE 2 COMPREHENSIVE TEST SUITE')
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
  const testEmail = `phase2_tester_${Date.now()}@rapidtechpro.com`
  const testUser = await prisma.users.create({
    data: {
      uid: `uid-p2-${Date.now()}`,
      email: testEmail,
      username: 'Phase 2 Test User',
      phoneNumber: '+923111111111',
      role: 'CUSTOMER',
      emailVerification: true,
    },
  })

  try {
    // ----------------------------------------------------
    // TEST 1: Pharmacy & Healthcare State Machine
    // ----------------------------------------------------
    console.log('[1/4] Testing Pharmacy & Healthcare Sub-Module...')

    // 1a: Upload prescription
    const rx = await uploadPrescription({
      userId: testUser.id,
      patientName: 'Jane Doe',
      doctorName: 'Dr. Robert Smith, MD',
      fileUrl: 'https://s3.ap-southeast-2.amazonaws.com/quickdelivery-rx/rx_test_101.pdf',
    })
    assert(rx.status === RX_STATUS.PENDING_REVIEW, 'Prescription starts in pending_rx_review state')
    assert(rx.patientName === 'Jane Doe', 'Patient name properly logged')

    // 1b: Review without pharmacist license should be rejected
    let licenseErrorCaught = false
    try {
      await reviewPrescription({
        prescriptionId: rx.id,
        status: RX_STATUS.APPROVED,
        licenseNumber: null, // missing license
      })
    } catch {
      licenseErrorCaught = true
    }
    assert(licenseErrorCaught, 'Approval without pharmacist license number is strictly rejected')

    // 1c: Review with pharmacist license
    const approvedRx = await reviewPrescription({
      prescriptionId: rx.id,
      status: RX_STATUS.APPROVED,
      licenseNumber: 'RPH-PK-889921',
      pharmacistNotes: 'Valid dosage verified for Amoxicillin 500mg',
      reviewedBy: 'Chief Pharmacist Waqas',
    })
    assert(approvedRx.status === RX_STATUS.APPROVED, 'Prescription successfully transitioned to approved')
    assert(approvedRx.licenseNumber === 'RPH-PK-889921', 'Pharmacist license recorded in audit trail')

    // 1d: Checkout guard validation
    const sampleRxItems = [
      { id: 101, proName: 'Amoxicillin 500mg', vertical: 'PHARMACY', isPrescriptionRequired: true },
    ]

    const rxCheck = await validatePrescriptionForItems({
      userId: testUser.id,
      items: sampleRxItems,
      prescriptionId: approvedRx.id,
    })
    assert(rxCheck.valid === true, 'Checkout guard passes for approved prescription')

    // ----------------------------------------------------
    // TEST 2: Food & Dining Modifiers & Table Booking
    // ----------------------------------------------------
    console.log('\n[2/4] Testing Food & Dining Sub-Module...')

    // 2a: Modifiers & Add-ons calculation
    const pricing = calculateFoodItemPrice(15.00, [
      { name: 'Extra Cheddar Cheese', additionalPrice: 1.50 },
      { name: 'Truffle Mayo', additionalPrice: 1.25 },
    ])
    assert(pricing.finalItemPrice === 17.75, `Food item price correctly computed ($17.75 === $${pricing.finalItemPrice})`)

    // 2b: Dietary filtering
    const menu = [
      { proName: 'Halal Beef Burger', dietaryBadges: 'HALAL', allergens: 'Dairy' },
      { proName: 'Vegan Lentil Bowl', dietaryBadges: 'VEGAN,HALAL,GLUTEN_FREE', allergens: '' },
      { proName: 'Peanut Butter Shake', dietaryBadges: 'VEGETARIAN', allergens: 'Peanuts, Dairy' },
    ]

    const veganFiltered = filterFoodByDietaryPreferences(menu, { veganOnly: true })
    assert(veganFiltered.length === 1 && veganFiltered[0].proName === 'Vegan Lentil Bowl', 'Vegan filter works correctly')

    const peanutFree = filterFoodByDietaryPreferences(menu, { excludeAllergens: ['Peanuts'] })
    assert(peanutFree.length === 2, 'Allergen exclusion filter excludes peanut dishes')

    // 2c: Table booking state machine
    const booking = await createTableBooking({
      userId: testUser.id,
      vendorId: 'vendor_fine_dining',
      bookingDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      guestCount: 4,
      specialRequests: 'Window seat for anniversary',
      dineInPreOrders: [{ dish: 'Ribeye Steak Medium', quantity: 2 }],
    })
    assert(booking.status === BOOKING_STATUS.REQUESTED, 'Table reservation starts in REQUESTED state')

    const confirmedBooking = await updateTableBookingStatus({
      bookingId: booking.id,
      status: BOOKING_STATUS.CONFIRMED,
      tableNumber: 'T-14',
    })
    assert(confirmedBooking.status === BOOKING_STATUS.CONFIRMED, 'Table reservation transitioned to CONFIRMED')
    assert(confirmedBooking.tableNumber === 'T-14', 'Table number T-14 assigned to reservation')

    // ----------------------------------------------------
    // TEST 3: Fashion & Apparel Try & Decide Reverse Logistics
    // ----------------------------------------------------
    console.log('\n[3/4] Testing Fashion & Apparel Sub-Module...')

    const dualSizeCart = [
      { productId: 50, proName: 'Silk Shirt', selectedSize: 'M', vertical: 'FASHION' },
      { productId: 50, proName: 'Silk Shirt', selectedSize: 'L', vertical: 'FASHION' },
    ]
    assert(detectTryAndDecideRequirement(dualSizeCart) === true, 'Cart recognizes dual-size Try & Decide order')

    // Simulate Try & Decide SubOrder with instant wallet refund
    const masterOrder = await prisma.masterOrder.create({
      data: {
        masterOrderNumber: `MO-FASHION-${Date.now()}`,
        userId: testUser.id,
        paymentMethod: 'CREDIT_CARD',
        totalAmount: 136.00,
        shippingAddress: '789 Fashion Ave',
      },
    })

    const fashionSubOrder = await prisma.subOrder.create({
      data: {
        subOrderNumber: `${masterOrder.masterOrderNumber}-S1`,
        masterOrderId: masterOrder.id,
        vendorId: 'vendor_fashion_house',
        fulfillmentTrack: 'TRACK_C_STANDARD_COURIER',
        subtotal: 136.00,
        isTryAndDecide: true,
        tryAndDecideStatus: 'PENDING_DECISION',
      },
    })

    const itemM = await prisma.subOrderItem.create({
      data: {
        subOrderId: fashionSubOrder.id,
        productId: 50,
        productName: 'Silk Shirt (Size M)',
        quantity: 1,
        price: 68.00,
        vertical: 'FASHION',
        selectedSize: 'M',
        isTryAndDecideVariant: true,
      },
    })

    const itemL = await prisma.subOrderItem.create({
      data: {
        subOrderId: fashionSubOrder.id,
        productId: 50,
        productName: 'Silk Shirt (Size L)',
        quantity: 1,
        price: 68.00,
        vertical: 'FASHION',
        selectedSize: 'L',
        isTryAndDecideVariant: true,
      },
    })

    // Customer keeps Size M, returns Size L to rider
    const tryDecResult = await processTryAndDecideDecision({
      subOrderId: fashionSubOrder.id,
      decisions: [
        { itemId: itemM.id, decisionStatus: 'KEPT' },
        { itemId: itemL.id, decisionStatus: 'RETURNED_TO_RIDER' },
      ],
      courierNotes: 'Customer tried both sizes; Size L handed back in pristine tag condition',
    })

    assert(tryDecResult.tryAndDecideStatus === TRY_DECISION_STATUS.PARTIAL_RETURN, 'SubOrder marked as PARTIAL_RETURN')
    assert(tryDecResult.totalRefundAmount === 68.00, 'Instant refund for returned size calculated at $68.00')
    assert(tryDecResult.walletRefund !== null, 'Rewards wallet transaction executed for instant refund')

    // ----------------------------------------------------
    // TEST 4: Home & Personal Services Booking & Dispatch
    // ----------------------------------------------------
    console.log('\n[4/4] Testing Home & Personal Services Sub-Module...')

    // 4a: Radius check (15km max)
    const withinRadius = verifyServiceRadius(31.5204, 74.3587, 31.5400, 74.3600, 15.0)
    assert(withinRadius.isWithinRadius === true, 'Customer location within 15km service radius')

    const outsideRadius = verifyServiceRadius(31.5204, 74.3587, 32.0000, 74.9000, 15.0)
    assert(outsideRadius.isWithinRadius === false, 'Customer location outside 15km service radius correctly identified')

    // 4b: Service booking
    const serviceBooking = await bookServiceSlot({
      userId: testUser.id,
      serviceName: 'HVAC AC Deep Sanitization',
      vendorId: 'vendor_hvac_experts',
      slotDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      slotWindow: 'Morning (10:00 AM – 12:00 PM)',
      quotationAmount: 55.00,
    })
    assert(serviceBooking.status === SERVICE_STATUS.BOOKED, 'Service booking created in BOOKED state')

    // 4c: Accept quotation
    const acceptedQuotation = await acceptServiceQuotation({
      bookingId: serviceBooking.id,
      userId: testUser.id,
    })
    assert(acceptedQuotation.quotationAccepted === true, 'Upfront quotation accepted by customer')
    assert(acceptedQuotation.status === SERVICE_STATUS.QUOTATION_ACCEPTED, 'Status transitioned to QUOTATION_ACCEPTED')

    // 4d: Dispatch technician
    const dispatched = await dispatchTechnician({
      bookingId: serviceBooking.id,
      technicianName: 'Ahmed Tariq (Certified Tech #412)',
      technicianPhone: '+923007654321',
    })
    assert(dispatched.status === SERVICE_STATUS.TECHNICIAN_DISPATCHED, 'Status transitioned to TECHNICIAN_DISPATCHED')
    assert(dispatched.technicianName.includes('Ahmed Tariq'), 'Technician identity registered on booking')

    // Cleanup Phase 2 test records
    await prisma.serviceBooking.deleteMany({ where: { userId: testUser.id } })
    await prisma.subOrderItem.deleteMany({ where: { subOrderId: fashionSubOrder.id } })
    await prisma.subOrder.deleteMany({ where: { masterOrderId: masterOrder.id } })
    await prisma.masterOrder.deleteMany({ where: { userId: testUser.id } })
    await prisma.tableBooking.deleteMany({ where: { userId: testUser.id } })
    await prisma.prescription.deleteMany({ where: { userId: testUser.id } })
    await prisma.walletTransaction.deleteMany({ where: { wallet: { userId: testUser.id } } })
    await prisma.wallet.deleteMany({ where: { userId: testUser.id } })
    await prisma.users.delete({ where: { id: testUser.id } })

    console.log('\n==================================================')
    console.log(`PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('==================================================')

    if (failed > 0) process.exit(1)
    else process.exit(0)

  } catch (err) {
    console.error('Phase 2 test execution failed with error:', err)
    process.exit(1)
  }
}

runPhase2Tests()
