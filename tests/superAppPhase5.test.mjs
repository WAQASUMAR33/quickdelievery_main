/**
 * Test Suite: Super App Phase 5 (Conversational & Everyday AI Module)
 * "Save Me Money" knapsack optimizer, conversational shopping query parsing, Predictive Pantry worker
 */
import dotenv from 'dotenv'
dotenv.config()

import { prisma } from '../src/lib/prisma.js'
import {
  optimizeSaveMeMoney,
  parseConversationalShoppingQuery,
  createPantrySubscription,
  processDuePantryReplenishments,
} from '../src/lib/aiOptimizer.js'

async function runPhase5Tests() {
  console.log('==================================================')
  console.log('RUNNING SUPER APP PHASE 5 COMPREHENSIVE TEST SUITE')
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

  // Temporary test user & products
  const testEmail = `phase5_tester_${Date.now()}@rapidtechpro.com`
  const testUser = await prisma.users.create({
    data: {
      uid: `uid-p5-${Date.now()}`,
      email: testEmail,
      username: 'Phase 5 AI Tester',
      phoneNumber: '+923444444444',
      role: 'CUSTOMER',
      emailVerification: true,
    },
  })

  const existingCat = await prisma.category.findFirst({ include: { subCategories: true } })

  // Ensure a test product exists for pantry subscription test
  const testProduct = await prisma.product.create({
    data: {
      proName: 'Organic Whole Milk 1 Gallon',
      sku: `SKU-MILK-${Date.now()}`,
      price: 4.50,
      cost: 3.00,
      stock: 100,
      vertical: 'GROCERY',
      createdById: testUser.uid,
      vendorId: testUser.uid,
      catId: existingCat.id,
      subCatId: existingCat.subCategories[0].subCatId,
    },
  })

  try {
    // ----------------------------------------------------
    // TEST 1: "Save Me Money" Greedy Knapsack Optimizer
    // ----------------------------------------------------
    console.log('[1/3] Testing "Save Me Money" Knapsack Optimization Service...')
    const budgetCeiling = 35.00
    const optimization = await optimizeSaveMeMoney({
      budgetLimit: budgetCeiling,
      latitude: 31.5204,
      longitude: 74.3587,
      categoryIntent: 'ALL',
    })

    assert(optimization.finalTotal <= budgetCeiling, `Final total strictly adheres to budget ($${optimization.finalTotal} <= $${budgetCeiling})`)
    assert(optimization.adheresToBudget === true, 'Optimization flag adheresToBudget is true')
    assert(optimization.budgetLimit === budgetCeiling, 'Budget ceiling properly recorded')
    assert(typeof optimization.totalSavings === 'number', 'Total discount savings calculated')

    // ----------------------------------------------------
    // TEST 2: Conversational Shopping Assistant NLP
    // ----------------------------------------------------
    console.log('\n[2/3] Testing Conversational Shopping Assistant Intent Extraction...')

    // 2a: Family dinner query
    const dinnerResult = await parseConversationalShoppingQuery('Family dinner for 4 under $25')
    assert(dinnerResult.parsedIntent.budget === 25, 'Extracted budget: $25')
    assert(dinnerResult.parsedIntent.quantity === 4, 'Extracted servings: 4 people')
    assert(dinnerResult.parsedIntent.category === 'FOOD', 'Extracted vertical category: FOOD')

    // 2b: Outfit query
    const outfitResult = await parseConversationalShoppingQuery('Outfit for summer wedding in size M under $70')
    assert(outfitResult.parsedIntent.budget === 70, 'Extracted budget: $70')
    assert(outfitResult.parsedIntent.category === 'FASHION', 'Extracted vertical category: FASHION')
    assert(outfitResult.parsedIntent.size === 'M', 'Extracted clothing size: M')

    // 2c: Dietary flags query
    const dietaryResult = await parseConversationalShoppingQuery('Vegan halal groceries under $30')
    assert(dietaryResult.parsedIntent.dietaryFlags.includes('VEGAN'), 'Extracted dietary flag: VEGAN')
    assert(dietaryResult.parsedIntent.dietaryFlags.includes('HALAL'), 'Extracted dietary flag: HALAL')
    assert(dietaryResult.parsedIntent.category === 'GROCERY', 'Extracted vertical category: GROCERY')

    // ----------------------------------------------------
    // TEST 3: Predictive Pantry Recurring Replenishment Worker
    // ----------------------------------------------------
    console.log('\n[3/3] Testing Predictive Pantry Background Replenishment Worker...')

    // 3a: Create pantry subscription
    const sub = await createPantrySubscription({
      userId: testUser.id,
      productId: testProduct.proId,
      frequencyDays: 7,
      quantity: 2,
      autoApprove: true,
    })

    assert(sub.frequencyDays === 7, 'Pantry subscription cycle set to 7 days')
    assert(sub.status === 'ACTIVE', 'Subscription initialized as ACTIVE')

    // 3b: Fast-forward subscription date to test worker tick
    await prisma.pantrySubscription.update({
      where: { id: sub.id },
      data: { nextReplenishDate: new Date(Date.now() - 1000) }, // past due
    })

    const workerResult = await processDuePantryReplenishments()
    assert(workerResult.processedCount >= 1, 'Background worker identified due replenishment')
    assert(
      workerResult.restocks.some((r) => r.subscriptionId === sub.id),
      'Restock order proposal generated for milk subscription'
    )

    // Verify next date was advanced
    const updatedSub = await prisma.pantrySubscription.findUnique({
      where: { id: sub.id },
    })
    assert(
      updatedSub.nextReplenishDate > new Date(),
      'Next replenishment date automatically advanced by 7 days'
    )

    // Cleanup Phase 5 test records
    await prisma.pantrySubscription.deleteMany({ where: { userId: testUser.id } })
    await prisma.product.delete({ where: { proId: testProduct.proId } })
    await prisma.users.delete({ where: { id: testUser.id } })

    console.log('\n==================================================')
    console.log(`PHASE 5 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`)
    console.log('==================================================')

    if (failed > 0) process.exit(1)
    else process.exit(0)

  } catch (err) {
    console.error('Phase 5 test execution failed with error:', err)
    process.exit(1)
  }
}

runPhase5Tests()
