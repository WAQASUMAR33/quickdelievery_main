import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole, ADMIN_ROLES } from '@/lib/auth-server'

let widgetsCache = null
let widgetsCacheTime = 0
const CACHE_TTL = 300 * 1000 // 5 minutes

export function invalidateWidgetsCache() {
  widgetsCache = null
  widgetsCacheTime = 0
}

const EDGE_CACHE_HEADER = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
}

const DEFAULT_WIDGETS = {
  widget_1: {
    key: 'widget_1',
    badge: 'LIMITED DROPS',
    title: 'Curated Drop Discounts',
    subtitle: 'Flash deals with up to 50% discount across verified tech, pantry, and gourmet dining.',
    buttonText: 'Explore Drops',
    buttonLink: '/deals',
    showTimer: true,
    bgGradient: 'from-[#0F172A] via-[#1E1B4B] to-[#312E81]',
    accentColor: '#818CF8',
    status: 'ACTIVE',
  },
  widget_2: {
    key: 'widget_2',
    badge: 'FEATURED STORES & RESTAURANTS',
    title: '100% Authentic Brand Guarantees',
    subtitle: 'Direct partner merchants with certified authenticity, direct fulfillment, and official warranties.',
    buttonText: 'View Stores',
    buttonLink: '/customer',
    footerTag: '7-Day Easy Returns',
    footerLinkText: 'View Boutiques →',
    footerLink: '/customer',
    bgGradient: 'from-[#061A14] via-[#064E3B] to-[#042F2C]',
    accentColor: '#10B981',
    status: 'ACTIVE',
  },
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const isAdmin = searchParams.get('admin') === 'true'

    if (!isAdmin && widgetsCache && (Date.now() - widgetsCacheTime < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: widgetsCache,
      }, {
        headers: EDGE_CACHE_HEADER,
      })
    }

    const rows = await prisma.promoWidget.findMany()
    const map = {}
    rows.forEach(r => {
      map[r.key] = r
    })

    // Fallback if table was empty
    const data = {
      widget_1: map.widget_1 || DEFAULT_WIDGETS.widget_1,
      widget_2: map.widget_2 || DEFAULT_WIDGETS.widget_2,
    }

    if (!isAdmin) {
      widgetsCache = data
      widgetsCacheTime = Date.now()
    }

    return NextResponse.json({
      success: true,
      data,
    }, {
      headers: !isAdmin ? EDGE_CACHE_HEADER : undefined,
    })
  } catch (error) {
    console.error('Failed to fetch promo widgets:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch widgets' },
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
    const { key, badge, title, subtitle, buttonText, buttonLink, footerTag, footerLinkText, footerLink, bgGradient, accentColor, image, showTimer, status } = body

    if (!key || !['widget_1', 'widget_2'].includes(key)) {
      return NextResponse.json({ success: false, error: 'Valid widget key (widget_1 or widget_2) is required' }, { status: 400 })
    }

    invalidateWidgetsCache()

    const updated = await prisma.promoWidget.upsert({
      where: { key },
      update: {
        ...(badge !== undefined && { badge: badge ? badge.trim() : null }),
        ...(title !== undefined && { title: title.trim() }),
        ...(subtitle !== undefined && { subtitle: subtitle ? subtitle.trim() : null }),
        ...(buttonText !== undefined && { buttonText: buttonText ? buttonText.trim() : 'Explore' }),
        ...(buttonLink !== undefined && { buttonLink: buttonLink ? buttonLink.trim() : '/customer' }),
        ...(footerTag !== undefined && { footerTag: footerTag ? footerTag.trim() : null }),
        ...(footerLinkText !== undefined && { footerLinkText: footerLinkText ? footerLinkText.trim() : null }),
        ...(footerLink !== undefined && { footerLink: footerLink ? footerLink.trim() : null }),
        ...(bgGradient !== undefined && { bgGradient }),
        ...(accentColor !== undefined && { accentColor }),
        ...(image !== undefined && { image: image ? image.trim() : null }),
        ...(showTimer !== undefined && { showTimer: Boolean(showTimer) }),
        ...(status !== undefined && { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' }),
      },
      create: {
        key,
        badge: badge ? badge.trim() : null,
        title: title ? title.trim() : 'Promo Widget',
        subtitle: subtitle ? subtitle.trim() : null,
        buttonText: buttonText ? buttonText.trim() : 'Explore',
        buttonLink: buttonLink ? buttonLink.trim() : '/customer',
        footerTag: footerTag ? footerTag.trim() : null,
        footerLinkText: footerLinkText ? footerLinkText.trim() : null,
        footerLink: footerLink ? footerLink.trim() : null,
        bgGradient: bgGradient || 'from-[#0F172A] via-[#1E1B4B] to-[#312E81]',
        accentColor: accentColor || '#818CF8',
        image: image ? image.trim() : null,
        showTimer: showTimer !== undefined ? Boolean(showTimer) : true,
        status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      },
    })

    return NextResponse.json({
      success: true,
      data: updated,
    })
  } catch (error) {
    console.error('Failed to update promo widget:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update widget' },
      { status: 500 }
    )
  }
}
