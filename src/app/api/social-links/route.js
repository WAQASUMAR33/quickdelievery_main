import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_SOCIAL_LINKS = [
  { id: 1, title: 'Facebook', link: 'https://facebook.com', icon: 'facebook', isActive: true, sortOrder: 0 },
  { id: 2, title: 'Instagram', link: 'https://instagram.com', icon: 'instagram', isActive: true, sortOrder: 1 },
  { id: 3, title: 'Twitter / X', link: 'https://twitter.com', icon: 'twitter', isActive: true, sortOrder: 2 },
  { id: 4, title: 'YouTube', link: 'https://youtube.com', icon: 'youtube', isActive: true, sortOrder: 3 },
]

let cacheData = null
let cacheTime = 0
const CACHE_TTL = 60 * 1000 // 1 minute in-memory cache

export function invalidateSocialLinksCache() {
  cacheData = null
  cacheTime = 0
}

/**
 * Public GET endpoint: returns all active social links ordered by sortOrder
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const fresh = searchParams.get('fresh') === 'true'

    if (!fresh && cacheData && (Date.now() - cacheTime < CACHE_TTL)) {
      return NextResponse.json({
        success: true,
        data: cacheData,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      })
    }

    const links = await prisma.socialLink.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { id: 'asc' },
      ],
    })

    const result = links.length > 0 ? links : DEFAULT_SOCIAL_LINKS
    cacheData = result
    cacheTime = Date.now()

    return NextResponse.json({
      success: true,
      data: result,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Failed to fetch public social links:', error)
    return NextResponse.json({
      success: true,
      data: DEFAULT_SOCIAL_LINKS,
      fallback: true,
    })
  }
}

