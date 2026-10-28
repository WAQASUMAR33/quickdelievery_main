import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, ADMIN_ROLES } from '@/lib/auth-server'

const DEFAULT_SLIDES = [
  {
    badge: 'TECH & NEXT-GEN MOBILITY',
    title: 'Power Up with Official Mobile Gear',
    subtitle: 'GaN 100W Fast Chargers, Braided Type-C Cables, ANC Earbuds & Smartwatch Bands',
    ctaText: 'Explore Mobile Tech',
    ctaLink: '/customer',
    discount: 'UP TO 20% OFF',
    bgGradient: 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
    accentColor: '#818CF8',
    image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
    order: 1,
    status: 'ACTIVE',
  },
  {
    badge: 'FARM DIRECT & ORGANIC PANTRY',
    title: 'Everyday Fresh Groceries at Fair Prices',
    subtitle: 'Farm-fresh organic produce, dairy essentials, cold-pressed oils & pantry staples',
    ctaText: 'Shop Fresh Groceries',
    ctaLink: '/customer',
    discount: 'UP TO 30% OFF',
    bgGradient: 'from-[#061A14] via-[#064E3B] to-[#042F2C]',
    accentColor: '#10B981',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
    order: 2,
    status: 'ACTIVE',
  },
  {
    badge: 'ARTISAN PATISSERIE & DESSERTS',
    title: 'Freshly Baked Pastries, Cakes & Delights',
    subtitle: 'Authentic French butter croissants, celebration cakes, chocolate treats & sweet pastries',
    ctaText: 'Taste Bakery Specials',
    ctaLink: '/customer',
    discount: 'DAILY SPECIALS',
    bgGradient: 'from-[#1F1300] via-[#78350F] to-[#451A03]',
    accentColor: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
    order: 3,
    status: 'ACTIVE',
  },
  {
    badge: 'GOURMET DINING & RESTAURANTS',
    title: 'Handcrafted Burgers, Artisan Pizza & Chef Specials',
    subtitle: 'Sizzling burgers, wood-fired pizzas, gourmet cuisine & chef-prepared meals delivered hot',
    ctaText: 'Explore Restaurant',
    ctaLink: '/customer',
    discount: 'VERIFIED MENUS',
    bgGradient: 'from-[#1A0B16] via-[#4C0519] to-[#3B0764]',
    accentColor: '#F43F5E',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
    order: 4,
    status: 'ACTIVE',
  },
]

let slidersCache = null
let slidersCacheTime = 0
const SLIDERS_TTL = 300 * 1000 // 5 minutes

export function invalidateSlidersCache() {
  slidersCache = null
  slidersCacheTime = 0
}

const EDGE_CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdminView = searchParams.get('admin') === 'true' || searchParams.get('all') === 'true'

    if (!isAdminView && slidersCache && (Date.now() - slidersCacheTime < SLIDERS_TTL)) {
      return NextResponse.json({
        success: true,
        data: slidersCache,
      }, {
        headers: EDGE_CACHE_HEADER
      })
    }

    const where = isAdminView ? {} : { status: 'ACTIVE' }

    let slides = await prisma.heroSlide.findMany({
      where,
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
    })

    // Auto-seed default initial slides if database is empty so storefront and admin are never blank
    if (slides.length === 0) {
      const existingCount = await prisma.heroSlide.count()
      if (existingCount === 0) {
        for (const defaultSlide of DEFAULT_SLIDES) {
          await prisma.heroSlide.create({ data: defaultSlide })
        }
        slides = await prisma.heroSlide.findMany({
          where,
          orderBy: [{ order: 'asc' }, { id: 'asc' }],
        })
      }
    }

    if (!isAdminView) {
      slidersCache = slides
      slidersCacheTime = Date.now()
    }

    return NextResponse.json({
      success: true,
      data: slides,
    }, {
      headers: !isAdminView ? EDGE_CACHE_HEADER : undefined
    })
  } catch (error) {
    console.error('Failed to fetch hero slides:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch slides' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    invalidateSlidersCache()
    const {
      title,
      badge,
      subtitle,
      ctaText,
      ctaLink,
      discount,
      bgGradient,
      accentColor,
      image,
      deptId,
      order,
      status,
    } = body

    if (!image || !image.trim()) {
      return NextResponse.json({ success: false, error: 'Banner image is required' }, { status: 400 })
    }

    const slideTitle = (title && title.trim()) ? title.trim() : 'Banner Slide'

    const newSlide = await prisma.heroSlide.create({
      data: {
        title: slideTitle,
        badge: badge ? badge.trim() : null,
        subtitle: subtitle ? subtitle.trim() : null,
        ctaText: ctaText ? ctaText.trim() : 'Shop Now',
        ctaLink: ctaLink ? ctaLink.trim() : null,
        discount: discount ? discount.trim() : null,
        bgGradient: bgGradient || 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
        accentColor: accentColor || '#818CF8',
        image: image.trim(),
        deptId: deptId ? parseInt(deptId, 10) : null,
        order: order !== undefined && order !== null ? parseInt(order, 10) : 0,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    })

    return NextResponse.json({ success: true, data: newSlide }, { status: 201 })
  } catch (error) {
    console.error('Failed to create hero slide:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create slide' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    invalidateSlidersCache()
    const {
      id,
      title,
      badge,
      subtitle,
      ctaText,
      ctaLink,
      discount,
      bgGradient,
      accentColor,
      image,
      deptId,
      order,
      status,
    } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Slide ID is required' }, { status: 400 })
    }

    const updatedSlide = await prisma.heroSlide.update({
      where: { id: parseInt(id, 10) },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(badge !== undefined && { badge: badge ? badge.trim() : null }),
        ...(subtitle !== undefined && { subtitle: subtitle ? subtitle.trim() : null }),
        ...(ctaText !== undefined && { ctaText: ctaText ? ctaText.trim() : 'Shop Now' }),
        ...(ctaLink !== undefined && { ctaLink: ctaLink ? ctaLink.trim() : null }),
        ...(discount !== undefined && { discount: discount ? discount.trim() : null }),
        ...(bgGradient !== undefined && { bgGradient }),
        ...(accentColor !== undefined && { accentColor }),
        ...(image !== undefined && { image: image.trim() }),
        ...(deptId !== undefined && { deptId: deptId ? parseInt(deptId, 10) : null }),
        ...(order !== undefined && { order: parseInt(order, 10) }),
        ...(status !== undefined && { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      },
    })

    return NextResponse.json({ success: true, data: updatedSlide })
  } catch (error) {
    console.error('Failed to update hero slide:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update slide' },
      { status: 500 }
    )
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireRole(request, ADMIN_ROLES)
    if (auth.error) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    let id = searchParams.get('id')

    if (!id) {
      const body = await request.json().catch(() => ({}))
      id = body.id
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Slide ID is required' }, { status: 400 })
    }

    await prisma.heroSlide.delete({
      where: { id: parseInt(id, 10) },
    })
    invalidateSlidersCache()

    return NextResponse.json({ success: true, message: 'Slide deleted successfully' })
  } catch (error) {
    console.error('Failed to delete hero slide:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete slide' },
      { status: 500 }
    )
  }
}
