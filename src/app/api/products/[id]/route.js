import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id)
    if (isNaN(id)) return Response.json({ success: false, error: 'Invalid ID' }, { status: 400 })

    const product = await prisma.product.findUnique({
      where: { proId: id },
      include: { category: true, subCategory: true, vendor: true, approver: true, creator: true },
    })

    if (!product) return Response.json({ success: false, error: 'Product not found' }, { status: 404 })

    const safe = (val, fb = []) => {
      if (!val) return fb
      if (typeof val !== 'string') return val
      try { return JSON.parse(val) } catch { return fb }
    }

    return Response.json({
      success: true,
      data: {
        ...product,
        proImages:   safe(product.proImages, []),
        keyFeatures: safe(product.keyFeatures, typeof product.keyFeatures === 'string' ? product.keyFeatures.split(',').map(s => s.trim()) : []),
        variations:  safe(product.variations, []),
        reviews:     safe(product.reviews, []),
      },
    })
  } catch (error) {
    console.error('Product fetch error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
