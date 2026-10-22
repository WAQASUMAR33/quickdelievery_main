import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeProductImageWithGemini } from '@/lib/gemini'

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
    let base64Data = ''
    let mimeType = 'image/jpeg'

    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') || formData.get('image')
      if (!file || typeof file === 'string') {
        return NextResponse.json({ success: false, error: 'No image file uploaded' }, { status: 400 })
      }
      mimeType = file.type || 'image/jpeg'
      const bytes = await file.arrayBuffer()
      base64Data = Buffer.from(bytes).toString('base64')
    } else {
      const json = await req.json()
      base64Data = json.imageBase64 || ''
      mimeType = json.mimeType || 'image/jpeg'
      // If base64 has data URI prefix, strip it
      if (base64Data.includes(',')) {
        const parts = base64Data.split(',')
        const match = parts[0].match(/:(.*?);/)
        if (match) mimeType = match[1]
        base64Data = parts[1]
      }
    }

    if (!base64Data) {
      return NextResponse.json({ success: false, error: 'No valid image data received' }, { status: 400 })
    }

    // Call Gemini Vision to analyze the image
    const visionResult = await analyzeProductImageWithGemini(base64Data, mimeType)

    let visualAnalysis = null
    let searchTerms = []

    if (visionResult.success && visionResult.data) {
      visualAnalysis = visionResult.data
      searchTerms = [
        visualAnalysis.itemName,
        ...(Array.isArray(visualAnalysis.searchKeywords) ? visualAnalysis.searchKeywords : []),
        visualAnalysis.brand,
        visualAnalysis.color,
      ].filter(Boolean)
    } else {
      // If Gemini API Key is missing or failed
      if (visionResult.needsApiKey) {
        return NextResponse.json({
          success: false,
          needsApiKey: true,
          message: visionResult.message,
        }, { status: 422 })
      }

      return NextResponse.json({
        success: false,
        error: visionResult.error || 'Visual recognition failed',
      }, { status: 500 })
    }

    // Search database for visually matching products
    const orClauses = []
    for (const term of searchTerms) {
      if (typeof term === 'string' && term.length > 2) {
        orClauses.push({ proName: { contains: term } })
        orClauses.push({ description: { contains: term } })
        orClauses.push({ brandName: { contains: term } })
      }
    }

    // Also match color if detected
    if (visualAnalysis.color) {
      orClauses.push({ color: { contains: visualAnalysis.color } })
    }

    let rawProducts = []
    if (orClauses.length > 0) {
      rawProducts = await prisma.product.findMany({
        where: {
          status: true,
          OR: orClauses,
        },
        include: {
          category: { select: { id: true, name: true, code: true } },
          subCategory: { select: { subCatId: true, subCatName: true } },
          vendor: { select: { uid: true, username: true } },
        },
        take: 50,
      })
    }

    // Fallback: If strict OR returned very few items, pull recent popular products
    if (rawProducts.length === 0) {
      rawProducts = await prisma.product.findMany({
        where: { status: true },
        include: {
          category: { select: { id: true, name: true, code: true } },
          subCategory: { select: { subCatId: true, subCatName: true } },
          vendor: { select: { uid: true, username: true } },
        },
        take: 12,
        orderBy: { createdAt: 'desc' },
      })
    }

    // Rank candidate products by visual similarity score
    const scored = rawProducts.map((p) => {
      let score = 0
      const name = (p.proName || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const brand = (p.brandName || '').toLowerCase()
      const color = (p.color || '').toLowerCase()
      const cat = (p.category?.name || '').toLowerCase()

      // Keywords match
      for (const kw of (visualAnalysis.searchKeywords || [])) {
        const k = String(kw).toLowerCase()
        if (name.includes(k)) score += 25
        if (desc.includes(k)) score += 10
        if (brand.includes(k)) score += 20
        if (cat.includes(k)) score += 15
      }

      // Color match
      if (visualAnalysis.color && (color.includes(visualAnalysis.color.toLowerCase()) || name.includes(visualAnalysis.color.toLowerCase()))) {
        score += 30
      }

      // Brand match
      if (visualAnalysis.brand && (brand.includes(visualAnalysis.brand.toLowerCase()) || name.includes(visualAnalysis.brand.toLowerCase()))) {
        score += 35
      }

      // Category match
      if (visualAnalysis.category && cat.includes(visualAnalysis.category.toLowerCase())) {
        score += 20
      }

      return { product: p, score }
    })

    scored.sort((a, b) => b.score - a.score)

    const finalProducts = scored.map((item) => ({
      ...item.product,
      proImages: safeJsonParse(item.product.proImages, []),
      similarityScore: item.score,
    }))

    return NextResponse.json({
      success: true,
      visualAnalysis,
      products: finalProducts,
      totalCount: finalProducts.length,
    })
  } catch (err) {
    console.error('Image Search API Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
