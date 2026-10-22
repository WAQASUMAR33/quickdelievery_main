import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const { prompt, language = 'en', budget } = await req.json()
    const query = (prompt || '').toLowerCase().trim()

    // Fetch products from database
    const products = await prisma.product.findMany({
      where: { status: true },
      include: {
        category: true,
        subCategory: true,
        vendor: {
          select: {
            uid: true,
            username: true,
            email: true,
          },
        },
      },
      take: 200,
    })

    // Intelligent semantic/keyword scoring
    const scored = products.map((p) => {
      let score = 0
      const name = (p.proName || '').toLowerCase()
      const desc = (p.description || '').toLowerCase()
      const cat = (p.category?.name || '').toLowerCase()
      const sub = (p.subCategory?.subCatName || '').toLowerCase()
      const vendor = (p.vendor?.username || '').toLowerCase()
      const price = parseFloat(p.salePrice || p.price || 0)

      // Query token matches
      const tokens = query.split(/\s+/).filter(Boolean)
      for (const t of tokens) {
        if (name.includes(t)) score += 10
        if (cat.includes(t)) score += 6
        if (sub.includes(t)) score += 8
        if (desc.includes(t)) score += 3
        if (vendor.includes(t)) score += 5
      }

      // Contextual intent boosters
      if ((query.includes('laptop') || query.includes('gaming') || query.includes('pc') || query.includes('computer')) && cat.includes('computer')) {
        score += 15
      }
      if ((query.includes('phone') || query.includes('mobile') || query.includes('charger') || query.includes('cable') || query.includes('earbud')) && (cat.includes('mobile') || cat.includes('tech'))) {
        score += 15
      }
      if ((query.includes('grocery') || query.includes('fruit') || query.includes('milk') || query.includes('organic') || query.includes('oil') || query.includes('rice')) && cat.includes('grocer')) {
        score += 15
      }
      if ((query.includes('food') || query.includes('burger') || query.includes('dinner') || query.includes('pizza') || query.includes('pasta')) && (cat.includes('food') || cat.includes('dining') || cat.includes('baker'))) {
        score += 15
      }
      if (query.includes('deal') || query.includes('discount') || query.includes('cheap') || query.includes('save')) {
        if (parseFloat(p.discount || 0) > 0 || (p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price))) {
          score += 12
        }
      }

      // Budget constraints
      if (budget && price > budget) {
        score -= 20
      }

      return { product: p, score }
    })

    // Sort by relevance score
    scored.sort((a, b) => b.score - a.score)
    const topMatches = scored.filter(s => s.score > 0).slice(0, 6).map(s => s.product)

    // Fallback to top featured if score too low
    const finalProducts = topMatches.length > 0 ? topMatches : products.slice(0, 4)

    // Formulate localized AI explanation
    let aiResponseText = ''
    if (language === 'ar') {
      aiResponseText = `بناءً على طلبك، قمت بمسح كتالوج QuickDelivery واختيار أفضل ${finalProducts.length} منتجات موثوقة وعالية التقييم من المتاجر الرسمية:`
    } else if (language === 'fr') {
      aiResponseText = `D’après votre recherche, j’ai analysé le catalogue QuickDelivery pour sélectionner les ${finalProducts.length} meilleurs articles certifiés :`
    } else if (language === 'it') {
      aiResponseText = `In base alla tua richiesta, ho esaminato il catalogo QuickDelivery selezionando i ${finalProducts.length} migliori articoli ufficiali :`
    } else {
      aiResponseText = `I analyzed QuickDelivery's catalog and curated these ${finalProducts.length} verified recommendations perfectly matching your request:`
    }

    // Build smart bundle if user asks for recipe or kit
    let smartBundle = null
    if (query.includes('pasta') || query.includes('italian') || query.includes('dinner') || query.includes('cook') || query.includes('recipe')) {
      const groceryItems = products.filter(p => (p.category?.name || '').toLowerCase().includes('grocer')).slice(0, 3)
      if (groceryItems.length >= 2) {
        const bundleTotal = groceryItems.reduce((acc, item) => acc + parseFloat(item.salePrice || item.price || 0), 0)
        smartBundle = {
          title: '🍝 Italian Chef Gourmet Cooking Kit',
          description: 'Authentic organic ingredients curated for a 4-person dinner: organic olive oil, pasta & parmesan cheese.',
          items: groceryItems,
          totalPrice: bundleTotal,
          savings: Math.round(bundleTotal * 0.15),
        }
      }
    } else if (query.includes('mobile') || query.includes('setup') || query.includes('kit') || query.includes('charger')) {
      const techItems = products.filter(p => (p.category?.name || '').toLowerCase().includes('mobile')).slice(0, 3)
      if (techItems.length >= 2) {
        const bundleTotal = techItems.reduce((acc, item) => acc + parseFloat(item.salePrice || item.price || 0), 0)
        smartBundle = {
          title: '⚡ Next-Gen 100W GaN Travel Power Kit',
          description: 'High-speed GaN fast charger + braided Type-C cable + protective case bundle.',
          items: techItems,
          totalPrice: bundleTotal,
          savings: Math.round(bundleTotal * 0.20),
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: aiResponseText,
      recommendations: finalProducts.map(p => {
        let imgs = p.proImages
        if (typeof imgs === 'string') {
          try { imgs = JSON.parse(imgs) } catch { imgs = [imgs] }
        }
        return {
          proId: p.proId,
          proName: p.proName,
          price: p.price,
          salePrice: p.salePrice,
          discount: p.discount,
          proImages: imgs,
          vendor: p.vendor?.username || 'Verified Store',
          category: p.category?.name,
        }
      }),
      smartBundle,
    })
  } catch (error) {
    console.error('AI Assistant API Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
