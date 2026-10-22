import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseNlpSearch } from '@/lib/gemini'

function safeJsonParse(val, fallback = []) {
  if (!val) return fallback
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try { return JSON.parse(trimmed) } catch {}
    }
    if (trimmed.includes('http') && trimmed.includes(' ')) {
      return trimmed.split(/\s+/).filter(Boolean)
    }
    return [trimmed]
  }
  return [val]
}

export async function POST(req) {
  try {
    const body = await req.json()
    const rawQuery = (body.query || '').trim()

    if (!rawQuery) {
      return NextResponse.json({
        success: true,
        query: '',
        products: [],
        facets: {},
        explanation: 'Empty search query',
      })
    }

    // Step 1: Parse query using Gemini / NLP
    const nlp = await parseNlpSearch(rawQuery)

    // Step 2: Build Prisma query
    const whereConditions = {
      status: true,
    }

    // Stock constraint
    if (nlp.inStock === true) {
      whereConditions.stock = { gt: 0 }
    }

    // Color constraint
    if (nlp.color) {
      whereConditions.OR = [
        { color: { contains: nlp.color } },
        { proName: { contains: nlp.color } },
        { description: { contains: nlp.color } },
      ]
    }

    // Brand constraint
    if (nlp.brand) {
      const brandCondition = {
        OR: [
          { brandName: { contains: nlp.brand } },
          { proName: { contains: nlp.brand } },
        ],
      }
      if (whereConditions.OR) {
        whereConditions.AND = [
          { OR: whereConditions.OR },
          brandCondition,
        ]
        delete whereConditions.OR
      } else {
        whereConditions.OR = brandCondition.OR
      }
    }

    // Fetch candidate products
    const rawProducts = await prisma.product.findMany({
      where: whereConditions,
      include: {
        category: {
          select: { id: true, name: true, code: true, vertical: true }
        },
        subCategory: {
          select: { subCatId: true, subCatName: true, subCatCode: true }
        },
        vendor: {
          select: { uid: true, username: true, email: true }
        },
      },
      take: 200,
    })

    // Step 3: Score and rank candidate products in memory for high-fidelity relevance
    const scored = rawProducts.map((p) => {
      let score = 0
      const name = (p.proName || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const cat = (p.category?.name || '').toLowerCase()
      const sub = (p.subCategory?.subCatName || '').toLowerCase()
      const brand = (p.brandName || '').toLowerCase()
      const color = (p.color || '').toLowerCase()
      const price = parseFloat(p.salePrice || p.price || 0)

      // Price filter check
      let matchesPrice = true
      if (nlp.minPrice !== null && price < nlp.minPrice) matchesPrice = false
      if (nlp.maxPrice !== null && price > nlp.maxPrice) matchesPrice = false

      if (!matchesPrice) {
        return { product: p, score: -1, matchesPrice: false }
      }

      // Keyword matches
      for (const kw of nlp.keywords) {
        const k = kw.toLowerCase()
        if (name.includes(k)) score += 20
        if (brand.includes(k)) score += 18
        if (sub.includes(k)) score += 12
        if (cat.includes(k)) score += 10
        if (desc.includes(k)) score += 5
      }

      // Direct color match boost
      if (nlp.color && (color.includes(nlp.color) || name.includes(nlp.color))) {
        score += 25
      }

      // Direct brand match boost
      if (nlp.brand && (brand.includes(nlp.brand) || name.includes(nlp.brand))) {
        score += 30
      }

      // Attributes boost (waterproof, organic, rgb, etc.)
      for (const attr of nlp.attributes) {
        const a = attr.toLowerCase()
        if (name.includes(a)) score += 15
        if (desc.includes(a)) score += 10
        if (cat.includes(a) || sub.includes(a)) score += 12
      }

      // Category match boost
      if (nlp.category) {
        const c = nlp.category.toLowerCase()
        if (cat.includes(c) || c.includes(cat)) score += 15
      }

      // In stock boost
      if (p.stock > 0) score += 2

      return { product: p, score, matchesPrice: true }
    })

    // Filter out items that violated hard price constraints or scored 0 when keywords were provided
    let matchingResults = scored.filter(s => s.matchesPrice)
    if (nlp.keywords.length > 0 || nlp.color || nlp.brand) {
      const positiveScores = matchingResults.filter(s => s.score > 0)
      if (positiveScores.length > 0) {
        matchingResults = positiveScores
      }
    }

    // Step 4: Sort products according to intent
    if (nlp.sortBy === 'price_asc') {
      matchingResults.sort((a, b) => parseFloat(a.product.salePrice || a.product.price) - parseFloat(b.product.salePrice || b.product.price))
    } else if (nlp.sortBy === 'price_desc') {
      matchingResults.sort((a, b) => parseFloat(b.product.salePrice || b.product.price) - parseFloat(a.product.salePrice || a.product.price))
    } else if (nlp.sortBy === 'newest') {
      matchingResults.sort((a, b) => new Date(b.product.createdAt) - new Date(a.product.createdAt))
    } else {
      // Relevance score sorting
      matchingResults.sort((a, b) => b.score - a.score)
    }

    // Normalize images & construct response
    const finalProducts = matchingResults.map(item => {
      const p = item.product
      return {
        ...p,
        proImages: safeJsonParse(p.proImages, []),
        matchScore: item.score,
      }
    })

    // Compute dynamic facet buckets across the matched results
    const brandCounts = {}
    const colorCounts = {}
    const categoryCounts = {}
    let minPriceFound = Infinity
    let maxPriceFound = 0
    let inStockCount = 0

    finalProducts.forEach(p => {
      const price = parseFloat(p.salePrice || p.price || 0)
      if (price < minPriceFound) minPriceFound = price
      if (price > maxPriceFound) maxPriceFound = price
      if (p.stock > 0) inStockCount++

      if (p.brandName) {
        brandCounts[p.brandName] = (brandCounts[p.brandName] || 0) + 1
      }
      if (p.color) {
        colorCounts[p.color] = (colorCounts[p.color] || 0) + 1
      }
      if (p.category?.name) {
        categoryCounts[p.category.name] = (categoryCounts[p.category.name] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      query: rawQuery,
      extractedFilters: nlp,
      explanation: nlp.explanation,
      isAiPowered: nlp.isAiPowered,
      products: finalProducts,
      totalCount: finalProducts.length,
      facets: {
        brands: Object.entries(brandCounts).map(([name, count]) => ({ name, count })),
        colors: Object.entries(colorCounts).map(([name, count]) => ({ name, count })),
        categories: Object.entries(categoryCounts).map(([name, count]) => ({ name, count })),
        priceRange: {
          min: minPriceFound === Infinity ? 0 : Math.floor(minPriceFound),
          max: maxPriceFound === 0 ? 1000 : Math.ceil(maxPriceFound),
        },
        inStockCount,
      },
    })
  } catch (err) {
    console.error('NLP Search API Error:', err)
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}
