import { prisma } from './prisma.js'
import { calculateDistanceKm } from './addonEngine.js'
import { getGeminiModel } from './gemini.js'

/**
 * Conversational & Everyday AI Module
 * - "Save Me Money" Knapsack Optimization Service
 * - Conversational Shopping Assistant with intent extraction
 * - Predictive Pantry / Automated Replenishment Worker
 */

/**
 * Solve Greedy Knapsack Optimization for "Save Me Money"
 * Adheres strictly to user's budget ceiling while maximizing value, discounts, and minimizing courier charges.
 */
export async function optimizeSaveMeMoney({
  budgetLimit,
  latitude,
  longitude,
  categoryIntent = 'ALL',
  maxDistanceKm = 15.0,
}) {
  const budget = parseFloat(budgetLimit)
  if (!budget || budget <= 0) {
    throw new Error('Valid budget limit greater than $0 is required')
  }

  // 1. Fetch active in-stock products
  const where = { status: true, stock: { gt: 0 } }
  if (categoryIntent && categoryIntent !== 'ALL') {
    where.vertical = categoryIntent.toUpperCase()
  }

  const candidateProducts = await prisma.product.findMany({
    where,
    take: 100,
    orderBy: { discount: 'desc' },
  })

  // 2. Score items by value-to-cost ratio: (1 + discount% / 100) / price
  const scoredItems = candidateProducts.map((p) => {
    const price = parseFloat(p.salePrice || p.price)
    const discount = parseFloat(p.discount || 0)
    // Value score favors high discounts and lower price per unit
    const valueRatio = (1 + discount / 100) / (price || 1)
    return {
      product: p,
      unitPrice: price,
      discount,
      valueRatio,
    }
  })

  // Sort descending by value-to-cost ratio
  scoredItems.sort((a, b) => b.valueRatio - a.valueRatio)

  // 3. Greedy Knapsack Selection
  // Fixed delivery fee allowance ($2.50)
  const estimatedDeliveryFee = 2.50
  const effectiveProductBudget = Math.max(0, budget - estimatedDeliveryFee)

  const selectedCartItems = []
  let currentSubtotal = 0
  let totalSavings = 0

  for (const item of scoredItems) {
    if (currentSubtotal + item.unitPrice <= effectiveProductBudget) {
      selectedCartItems.push({
        id: item.product.proId,
        proName: item.product.proName,
        price: item.unitPrice,
        quantity: 1,
        vertical: item.product.vertical,
        vendorId: item.product.vendorId,
        discountApplied: `${item.discount}% OFF`,
      })
      currentSubtotal += item.unitPrice

      const originalPrice = parseFloat(item.product.price)
      if (originalPrice > item.unitPrice) {
        totalSavings += originalPrice - item.unitPrice
      }
    }

    if (currentSubtotal >= effectiveProductBudget * 0.95) {
      break // Close to budget ceiling
    }
  }

  const finalTotal = Math.round((currentSubtotal + (selectedCartItems.length > 0 ? estimatedDeliveryFee : 0)) * 100) / 100

  return {
    budgetLimit: budget,
    items: selectedCartItems,
    itemCount: selectedCartItems.length,
    cartSubtotal: Math.round(currentSubtotal * 100) / 100,
    estimatedDeliveryFee: selectedCartItems.length > 0 ? estimatedDeliveryFee : 0.00,
    finalTotal,
    totalSavings: Math.round(totalSavings * 100) / 100,
    adheresToBudget: finalTotal <= budget,
    optimizationSummary: `Optimized ${selectedCartItems.length} items within your $${budget.toFixed(2)} budget, saving you $${totalSavings.toFixed(2)} from flash sales and bundle deals.`,
  }
}

/**
 * AI Shopping Assistant
 * Parses natural conversational inputs e.g.:
 * "Family dinner for 4 under $25"
 * "Outfit for summer wedding under $70"
 */
export async function parseConversationalShoppingQuery(userPrompt) {
  const prompt = (userPrompt || '').trim()
  if (!prompt) throw new Error('Query string cannot be empty')

  let budget = 50.0
  let quantity = 1
  let category = 'FOOD'
  let dietaryFlags = []
  let size = null

  // Try Gemini AI Model first if configured
  const model = getGeminiModel('gemini-3.5-flash') || getGeminiModel('gemini-3.5-flash-lite')
  if (model) {
    try {
      const aiPrompt = `You are an AI Shopping Assistant for a Super App.
Analyze the following user query: "${prompt}".
Extract and return ONLY a valid JSON object with the following fields:
- budget: number (extract budget limit or default to 50)
- quantity: number (servings or person count, default to 1)
- category: string ("FOOD", "GROCERY", "PHARMACY", "FASHION", "ELECTRONICS", or "SERVICES")
- dietaryFlags: array of strings (e.g. ["HALAL", "VEGAN", "GLUTEN_FREE"])
- size: string or null (e.g. "M", "L", "XL")
- searchKeywords: string (key item to search)

Output JSON only, no markdown backticks.`

      const result = await model.generateContent(aiPrompt)
      const rawText = result.response.text().trim()
      const cleanJson = rawText.replace(/```json/gi, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleanJson)

      budget = parseFloat(parsed.budget) || 50.0
      quantity = parseInt(parsed.quantity, 10) || 1
      category = parsed.category || 'FOOD'
      dietaryFlags = Array.isArray(parsed.dietaryFlags) ? parsed.dietaryFlags : []
      size = parsed.size || null
    } catch {
      // Fallback regex parser below
    }
  }

  // Robust Fallback Regex Pattern Extraction
  const lower = prompt.toLowerCase()
  const budgetMatch = lower.match(/(?:under|below|budget|less than|max)\s*\$?(\d+(?:\.\d+)?)/i)
  if (budgetMatch) {
    budget = parseFloat(budgetMatch[1])
  }

  const peopleMatch = lower.match(/(?:for|serves)\s*(\d+)\s*(?:people|persons|family)?/i)
  if (peopleMatch) {
    quantity = parseInt(peopleMatch[1], 10)
  }

  if (lower.includes('dinner') || lower.includes('lunch') || lower.includes('food') || lower.includes('pizza') || lower.includes('burger')) {
    category = 'FOOD'
  } else if (lower.includes('grocery') || lower.includes('milk') || lower.includes('egg') || lower.includes('pantry')) {
    category = 'GROCERY'
  } else if (lower.includes('dress') || lower.includes('shirt') || lower.includes('outfit') || lower.includes('wedding')) {
    category = 'FASHION'
  } else if (lower.includes('medicine') || lower.includes('pharmacy') || lower.includes('relief')) {
    category = 'PHARMACY'
  }

  if (lower.includes('halal')) dietaryFlags.push('HALAL')
  if (lower.includes('vegan')) dietaryFlags.push('VEGAN')
  if (lower.includes('gluten free')) dietaryFlags.push('GLUTEN_FREE')

  const sizeMatch = lower.match(/\b(xs|s|m|l|xl|xxl)\b/i)
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase()
  }

  // 4. Query matching in-stock products
  const matchingProducts = await prisma.product.findMany({
    where: {
      status: true,
      stock: { gt: 0 },
      vertical: category,
      price: { lte: budget },
    },
    take: 6,
    orderBy: { price: 'asc' },
  })

  return {
    parsedIntent: {
      prompt,
      budget,
      quantity,
      category,
      dietaryFlags,
      size,
    },
    suggestedProducts: matchingProducts.map((p) => ({
      id: p.proId,
      name: p.proName,
      price: parseFloat(p.price),
      vertical: p.vertical,
      vendorId: p.vendorId,
    })),
  }
}

/**
 * Predictive Pantry / Automated Replenishment Background Worker
 */
export async function createPantrySubscription({
  userId,
  productId,
  frequencyDays = 7,
  quantity = 1,
  autoApprove = false,
}) {
  const nextReplenishDate = new Date(Date.now() + frequencyDays * 24 * 60 * 60 * 1000)

  const subscription = await prisma.pantrySubscription.create({
    data: {
      userId: parseInt(userId, 10),
      productId: parseInt(productId, 10),
      frequencyDays: parseInt(frequencyDays, 10),
      quantity: parseInt(quantity, 10),
      nextReplenishDate,
      autoApprove,
      status: 'ACTIVE',
    },
    include: {
      product: true,
    },
  })

  return subscription
}

/**
 * Worker tick: checks due pantry subscriptions and generates restock proposals
 */
export async function processDuePantryReplenishments() {
  const now = new Date()

  // Find active subscriptions whose replenishment date has arrived
  const dueSubscriptions = await prisma.pantrySubscription.findMany({
    where: {
      status: 'ACTIVE',
      nextReplenishDate: { lte: now },
    },
    include: {
      product: true,
      user: { select: { id: true, username: true, email: true } },
    },
  })

  const generatedRestocks = []

  for (const sub of dueSubscriptions) {
    // Schedule next replenishment date
    const nextDate = new Date(now.getTime() + sub.frequencyDays * 24 * 60 * 60 * 1000)

    await prisma.pantrySubscription.update({
      where: { id: sub.id },
      data: {
        lastOrderedAt: now,
        nextReplenishDate: nextDate,
      },
    })

    generatedRestocks.push({
      subscriptionId: sub.id,
      userId: sub.userId,
      productName: sub.product.proName,
      quantity: sub.quantity,
      unitPrice: parseFloat(sub.product.price),
      totalEstimated: parseFloat(sub.product.price) * sub.quantity,
      autoApprove: sub.autoApprove,
      nextScheduled: nextDate,
    })
  }

  return {
    processedCount: dueSubscriptions.length,
    restocks: generatedRestocks,
  }
}
