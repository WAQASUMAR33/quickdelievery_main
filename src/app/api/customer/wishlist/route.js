import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })

    const wishlists = await prisma.wishlist.findMany({
      where: { userId: parseInt(userId) },
      include: {
        product: {
          include: {
            vendor: true,
            category: true,
            subCategory: true
          }
        }
      }
    })

    const items = wishlists.map(w => w.product)
    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed to fetch wishlist' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId, productId, action } = await request.json()
    if (!userId || !productId || !action) return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })

    if (action === 'add') {
      await prisma.wishlist.upsert({
        where: { userId_productId: { userId: parseInt(userId), productId: parseInt(productId) } },
        update: {},
        create: { userId: parseInt(userId), productId: parseInt(productId) }
      })
    } else if (action === 'remove') {
      await prisma.wishlist.deleteMany({
        where: { userId: parseInt(userId), productId: parseInt(productId) }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed to update wishlist' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    
    await prisma.wishlist.deleteMany({
      where: { userId: parseInt(userId) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false, error: 'Failed to clear wishlist' }, { status: 500 })
  }
}
