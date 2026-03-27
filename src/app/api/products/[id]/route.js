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

    return Response.json({
      success: true,
      data: {
        ...product,
        proImages:   product.proImages   ? JSON.parse(product.proImages)   : [],
        keyFeatures: product.keyFeatures ? JSON.parse(product.keyFeatures) : [],
        variations:  product.variations  ? JSON.parse(product.variations)  : [],
        reviews:     product.reviews     ? JSON.parse(product.reviews)     : [],
      },
    })
  } catch (error) {
    console.error('Product fetch error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
