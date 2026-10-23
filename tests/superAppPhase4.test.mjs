/**
 * Test Suite: Super App Phase 4 (Social Commerce & Neighborhood Group Buying)
 * GeoHash spatial pooling, Make an Offer bargaining, shoppable videos
 */
import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../src/lib/prisma.js'
import {
  encodeGeoHash,
  registerInNeighborhoodPool,
  createPriceOffer,
  respondToPriceOffer,
  createShoppableVideo,
  getShoppableVideos,
} from '../src/lib/socialCommerce.js'

async function runPhase4Tests() {
  console.log('==================================================')
  console.log('RUNNING SUPER APP PHASE 4 COMPREHENSIVE TEST SUITE')
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

  // Temporary test user
  const testEmail = `phase4_tester_${Date.now()}@rapidtechpro.com`
  const testUser = await prisma.users.create({
    data: {
      uid: `uid-p4-${Date.now()}`,
      email: testEmail,
      username: 'Phase 4 Social Tester',
      phoneNumber: '+923333333333',
      role: 'CUSTOMER',
      emailVerification: true,
    },
  })

  try {
    // ----------------------------------------------------
    // TEST 1: GeoHash Encoding Algorithm
    // ----------------------------------------------------
    console.log('[1/4] Testing GeoHash Spatial Encoding...')
    const lat = 31.5204
    const lon = 74.3587
    const hash7 = encodeGeoHash(lat, lon, 7)
    assert(typeof hash7 === 'string' && hash7.length === 7, `GeoHash level 7 produced valid 7-char hash: "${hash7}"`)

    const hash8 = encodeGeoHash(lat, lon, 8)
    assert(typeof hash8 === 'string' && hash8.length === 8, `GeoHash level 8 produced valid 8-char hash: "${hash8}"`)
    assert(hash8.startsWith(hash7), 'Higher precision GeoHash 8 nests within GeoHash 7 prefix')

    // ----------------------------------------------------
    // TEST 2: Neighborhood Group Pooling 3+ Dynamic Discount
    // ----------------------------------------------------
    console.log('\n[2/4] Testing 30-Minute Neighborhood Group Pooling...')

    // Cleanup existing pools with this hash for clean test
    await prisma.neighborhoodPool.deleteMany({ where: { geoHash: hash7 } })

    // Order 1 joins
    const pool1 = await registerInNeighborhoodPool(lat, lon, 7)
    assert(pool1.activeNeighborsCount === 1, 'First order registers active pool with count 1')
    assert(pool1.isGroupDiscountUnlocked === false, 'Group discount locked with 1 order')

    // Order 2 joins
    const pool2 = await registerInNeighborhoodPool(lat, lon, 7)
    assert(pool2.activeNeighborsCount === 2, 'Second order increments pool count to 2')
    assert(pool2.isGroupDiscountUnlocked === false, 'Group discount locked with 2 orders')

    // Order 3 joins within 30-min window
    const pool3 = await registerInNeighborhoodPool(lat, lon, 7)
    assert(pool3.activeNeighborsCount === 3, 'Third order increments pool count to 3')
    assert(pool3.isGroupDiscountUnlocked === true, '🎉 3+ Orders triggers dynamic bulk discount and $0 delivery fee!')

    // ----------------------------------------------------
    // TEST 3: "Make an Offer" Bargaining State Machine
    // ----------------------------------------------------
    console.log('\n[3/4] Testing Make an Offer Bargaining State Machine...')

    // 3a: Floor check: reject offer < 50%
    let floorRejected = false
    try {
      await createPriceOffer({
        userId: testUser.id,
        productId: 1,
        vendorId: 'vendor_retail',
        originalPrice: 100.00,
        offeredPrice: 40.00, // 40% < 50%
      })
    } catch {
      floorRejected = true
    }
    assert(floorRejected, 'Offers below 50% minimum bargaining floor are strictly rejected')

    // 3b: Create valid offer (e.g. $80 on $100 item)
    const offer = await createPriceOffer({
      userId: testUser.id,
      productId: 1,
      vendorId: 'vendor_retail',
      originalPrice: 100.00,
      offeredPrice: 80.00,
    })
    assert(offer.status === 'PENDING', 'Price offer initialized in PENDING status')
    assert(parseFloat(offer.offeredPrice) === 80.00, 'Offered price recorded as $80.00')

    // 3c: Vendor Counter-Offer ($90)
    const countered = await respondToPriceOffer({
      offerId: offer.id,
      response: 'COUNTER',
      counterPrice: 90.00,
    })
    assert(countered.status === 'COUNTERED', 'Vendor response transitions offer to COUNTERED')
    assert(parseFloat(countered.counterPrice) === 90.00, 'Counter price recorded as $90.00')

    // 3d: Second offer accepted
    const offer2 = await createPriceOffer({
      userId: testUser.id,
      productId: 1,
      vendorId: 'vendor_retail',
      originalPrice: 200.00,
      offeredPrice: 175.00,
    })
    const accepted = await respondToPriceOffer({
      offerId: offer2.id,
      response: 'ACCEPT',
    })
    assert(accepted.status === 'ACCEPTED', 'Offer successfully ACCEPTED by merchant')

    // ----------------------------------------------------
    // TEST 4: Shoppable Video Feed
    // ----------------------------------------------------
    console.log('\n[4/4] Testing Shoppable Video Catalog Mapping...')
    const video = await createShoppableVideo({
      title: 'Handcrafted Espresso Brewing',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-maker-pouring-hot-coffee-42410-large.mp4',
      vendorId: 'vendor_roastery',
      taggedProductIds: [101, 102],
    })
    assert(video.title === 'Handcrafted Espresso Brewing', 'Shoppable video created successfully')
    assert(JSON.parse(video.taggedProductIds).includes(101), 'Product 101 tagged in video overlay')

    const allVideos = await getShoppableVideos()
    assert(allVideos.length > 0, 'Shoppable video feed query returned catalog entries')

    // Cleanup Phase 4 test records
    await prisma.shoppableVideo.deleteMany({ where: { id: video.id } })
    await prisma.priceOffer.deleteMany({ where: { userId: testUser.id } })
    await prisma.neighborhoodPool.deleteMany({ where: { geoHash: hash7 } })
    await prisma.users.delete({ where: { id: testUser.id } })

    console.log('\n==================================================')
    console.log(`PHASE 4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('==================================================')

    if (failed > 0) process.exit(1)
    else process.exit(0)

  } catch (err) {
    console.error('Phase 4 test execution failed with error:', err)
    process.exit(1)
  }
}

runPhase4Tests()
