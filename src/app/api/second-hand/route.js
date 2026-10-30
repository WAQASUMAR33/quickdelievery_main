import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

// GET: Filterable, searchable listing of 2nd hand goods
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const condition = searchParams.get('condition')
    const city = searchParams.get('city')
    const query = searchParams.get('q')
    const sellerId = searchParams.get('sellerId')
    const status = searchParams.get('status') || 'AVAILABLE'
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const sort = searchParams.get('sort') || 'newest'
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 30))
    const skip = (page - 1) * limit

    let orderBy = { createdAt: 'desc' }
    if (sort === 'price_low') orderBy = { price: 'asc' }
    else if (sort === 'price_high') orderBy = { price: 'desc' }
    else if (sort === 'popular') orderBy = { viewsCount: 'desc' }
    else if (sort === 'oldest') orderBy = { createdAt: 'asc' }

    const where = {
      ...(status !== 'ALL' && { status }),
      ...(category && category !== 'ALL' && category !== 'All Categories' && { category }),
      ...(condition && condition !== 'ALL' && { condition }),
      ...(city && city !== 'ALL' && { city }),
      ...(sellerId && { sellerId: Number(sellerId) }),
      ...(query && {
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
          { location: { contains: query } },
        ],
      }),
      ...((minPrice || maxPrice) && {
        price: {
          ...(minPrice && { gte: Number(minPrice) }),
          ...(maxPrice && { lte: Number(maxPrice) }),
        },
      }),
    }

    const [items, total] = await Promise.all([
      prisma.secondHandItem.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              username: true,
              phoneNumber: true,
              image: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: { offers: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.secondHandItem.count({ where }),
    ])

    const formattedItems = items.map(item => ({
      ...item,
      seller: item.seller ? { ...item.seller, name: item.seller.username } : null,
    }))

    return NextResponse.json({
      success: true,
      data: formattedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to list 2nd hand items:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to fetch items' }, { status: 500 })
  }
}

// POST: Create a 2nd hand item listing (both Customers and Merchants can upload)
export async function POST(request) {
  try {
    const authUser = await getAuthUser(request)
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Authentication required to post an item' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category = 'Electronics & Gadgets',
      condition = 'LIKE_NEW',
      price,
      originalPrice,
      minOfferPrice,
      images = [],
      city,
      location,
      contactPhone,
      allowOffers = true,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Item title is required' }, { status: 400 })
    }

    if (!price || Number(price) <= 0) {
      return NextResponse.json({ success: false, error: 'A valid asking price is required' }, { status: 400 })
    }

    // Determine seller type
    const sellerType = ['VENDOR', 'MERCHANT'].includes(authUser.role) ? 'MERCHANT' : 'CUSTOMER'

    // Format images JSON
    const imagesJson = Array.isArray(images) ? JSON.stringify(images) : typeof images === 'string' ? images : '[]'

    const item = await prisma.secondHandItem.create({
      data: {
        sellerId: authUser.id,
        sellerType,
        title: title.trim(),
        description: description ? description.trim() : '',
        category,
        condition,
        price: Number(price),
        originalPrice: originalPrice ? Number(originalPrice) : null,
        minOfferPrice: minOfferPrice ? Number(minOfferPrice) : null,
        images: imagesJson,
        city: city ? city.trim() : 'Lahore',
        location: location ? location.trim() : null,
        contactPhone: contactPhone ? contactPhone.trim() : authUser.phoneNumber,
        allowOffers: Boolean(allowOffers),
        status: 'AVAILABLE',
      },
      include: {
        seller: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            image: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        ...item,
        seller: item.seller ? { ...item.seller, name: item.seller.username } : null,
      },
      message: 'Your 2nd hand item is live for buyers and offers!',
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create 2nd hand item:', error)
    return NextResponse.json({ success: false, error: error.message || 'Failed to list item' }, { status: 500 })
  }
}
