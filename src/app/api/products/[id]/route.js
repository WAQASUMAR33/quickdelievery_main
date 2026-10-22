import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { parseProductSlug, getProductSlug } from '@/lib/productSlug'
import { broadcastRealtimeEvent } from '@/lib/realtime'

const safeJson = (val, fb = []) => {
  if (!val) return fb
  if (typeof val !== 'string') return val
  try { return JSON.parse(val) } catch { return fb }
}

export async function GET(request, { params }) {
  try {
    const rawParams = await params
    const rawParam = rawParams?.id
    if (!rawParam) return Response.json({ success: false, error: 'Product identifier required' }, { status: 400 })

    const { id, slug } = parseProductSlug(rawParam)

    let product = null

    if (id) {
      product = await prisma.product.findUnique({
        where: { proId: id },
        include: {
          category: true,
          subCategory: true,
          productCategory: true,
          vendor: true,
          approver: true,
          creator: true
        },
      })
    } else if (slug) {
      // Lookup by words from slug
      const keywords = slug.replace(/-/g, ' ')
      product = await prisma.product.findFirst({
        where: {
          proName: { contains: keywords },
          status: true,
        },
        include: {
          category: true,
          subCategory: true,
          productCategory: true,
          vendor: true,
          approver: true,
          creator: true
        },
      })
    }

    if (!product) return Response.json({ success: false, error: 'Product not found' }, { status: 404 })

    // Look up vendor business profile for store details
    let business = null
    let vendorProductCount = 0
    if (product.vendor?.email) {
      const [biz, count] = await Promise.all([
        prisma.business.findFirst({
          where: { email: product.vendor.email },
          select: {
            id: true,
            businessName: true,
            urlLogo: true,
            urlCoverPhoto: true,
            city: true,
            state: true,
            postalCode: true,
            phoneNumber1: true,
            streetAddress: true,
            verificationStatus: true,
            vertical: true
          }
        }),
        prisma.product.count({
          where: { vendorId: product.vendorId, status: true }
        })
      ])
      business = biz
      vendorProductCount = count
    }

    // Related products from the same category
    const relatedProducts = await prisma.product.findMany({
      where: {
        catId: product.catId,
        proId: { not: product.proId },
        status: true,
      },
      take: 8,
      include: {
        category: true,
        subCategory: true,
        vendor: true,
      },
      orderBy: { createdAt: 'desc' }
    })

    const processedRelated = relatedProducts.map(p => ({
      ...p,
      proImages: safeJson(p.proImages, []),
      variations: safeJson(p.variations, []),
      reviews: safeJson(p.reviews, [])
    }))

    return Response.json({
      success: true,
      data: {
        ...product,
        slug: getProductSlug(product),
        vendor: product.vendor ? {
          ...product.vendor,
          businessName: business?.businessName || product.vendor.username,
          urlLogo: business?.urlLogo || product.vendor.urlLogo || null,
          urlCoverPhoto: business?.urlCoverPhoto || null,
          city: business?.city || null,
          state: business?.state || null,
          postalCode: business?.postalCode || null,
          phone: business?.phoneNumber1 || product.vendor.phoneNumber || null,
          address: business?.streetAddress || null,
          verificationStatus: business?.verificationStatus || 'APPROVED',
          vertical: business?.vertical || product.vertical || 'FOOD',
          totalProducts: vendorProductCount || 1,
        } : null,
        proImages:   safeJson(product.proImages, []),
        keyFeatures: safeJson(product.keyFeatures, typeof product.keyFeatures === 'string' ? product.keyFeatures.split(',').map(s => s.trim()) : []),
        variations:  safeJson(product.variations, []),
        reviews:     safeJson(product.reviews, []),
        relatedProducts: processedRelated,
      },
    })
  } catch (error) {
    console.error('Product fetch error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST: Add review to product
export async function POST(request, { params }) {
  try {
    const rawParams = await params
    const { id } = parseProductSlug(rawParams?.id)
    if (!id) return Response.json({ success: false, error: 'Valid product ID required' }, { status: 400 })

    const body = await request.json()
    const { rating, comment, reviewerName } = body

    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ success: false, error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const authUser = await getAuthUser(request)

    const product = await prisma.product.findUnique({
      where: { proId: id },
      select: { proId: true, reviews: true }
    })

    if (!product) {
      return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const existingReviews = safeJson(product.reviews, [])
    const newReview = {
      id: Date.now(),
      rating: Number(rating),
      comment: comment?.trim() || '',
      reviewerName: reviewerName?.trim() || authUser?.username || authUser?.email?.split('@')[0] || 'Verified Customer',
      createdAt: new Date().toISOString(),
      verifiedPurchase: true
    }

    const updatedReviews = [newReview, ...existingReviews]

    await prisma.product.update({
      where: { proId: id },
      data: {
        reviews: JSON.stringify(updatedReviews)
      }
    })

    // Broadcast real-time catalog update so product rating updates live for all viewers
    try {
      broadcastRealtimeEvent('PRODUCT_UPDATED', { proId: id })
    } catch (err) {
      console.warn('Realtime product update broadcast error:', err)
    }

    return Response.json({
      success: true,
      data: newReview,
      message: 'Review submitted successfully'
    })
  } catch (error) {
    console.error('Submit review error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

