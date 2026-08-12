import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })

    const favorites = await prisma.favorite.findMany({
      where: { userId: parseInt(userId) }
    })

    if (favorites.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // vendorUid stores the vendor's uid (from users table) or "biz_<id>" for business-only vendors
    const vendorUids = favorites.map(f => f.vendorUid)
    
    // Separate real user UIDs from business-only IDs
    const bizIds = vendorUids.filter(v => v.startsWith('biz_')).map(v => parseInt(v.replace('biz_', '')))
    const userUids = vendorUids.filter(v => !v.startsWith('biz_'))

    // Fetch matching users
    const users = userUids.length > 0 ? await prisma.users.findMany({
      where: { uid: { in: userUids } },
      select: { uid: true, username: true, email: true }
    }) : []

    // Find businesses by user email or by direct business ID
    const userEmails = users.map(u => u.email).filter(Boolean)
    const businesses = await prisma.business.findMany({
      where: {
        OR: [
          ...(userEmails.length > 0 ? [{ email: { in: userEmails } }] : []),
          ...(bizIds.length > 0 ? [{ id: { in: bizIds } }] : [])
        ]
      }
    })

    // Build lookup maps
    const userByUid = {}
    users.forEach(u => { userByUid[u.uid] = u })
    
    const bizByEmail = {}
    const bizById = {}
    businesses.forEach(b => {
      bizByEmail[b.email] = b
      bizById[b.id] = b
    })

    // Merge data for each favorite
    const items = favorites.map(f => {
      const vid = f.vendorUid
      if (vid.startsWith('biz_')) {
        const biz = bizById[parseInt(vid.replace('biz_', ''))] || {}
        return { ...biz, uid: vid, vendorUid: vid }
      } else {
        const user = userByUid[vid] || {}
        const biz = bizByEmail[user.email] || {}
        return { ...user, ...biz, uid: vid, vendorUid: vid }
      }
    })

    return NextResponse.json({ success: true, data: items })
  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch favorites' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { userId, vendorUid, action } = await request.json()
    console.log('FAVORITES POST PAYLOAD:', { userId, vendorUid, action })
    
    if (!userId || !vendorUid || vendorUid === 'undefined' || !action) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'add') {
      await prisma.favorite.upsert({
        where: { userId_vendorUid: { userId: parseInt(userId), vendorUid: String(vendorUid) } },
        update: {},
        create: { userId: parseInt(userId), vendorUid: String(vendorUid) }
      })
    } else if (action === 'remove') {
      await prisma.favorite.deleteMany({
        where: { userId: parseInt(userId), vendorUid: String(vendorUid) }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorites POST error:', error)
    return NextResponse.json({ success: false, error: 'Failed to update favorites' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 })
    
    await prisma.favorite.deleteMany({
      where: { userId: parseInt(userId) }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Favorites DELETE error:', error)
    return NextResponse.json({ success: false, error: 'Failed to clear favorites' }, { status: 500 })
  }
}
