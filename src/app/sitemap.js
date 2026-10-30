import prisma from '@/lib/prisma'
import { getProductSlug } from '@/lib/productSlug'

export const revalidate = 3600 // Revalidate cache every hour

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://martzona.com'

export default async function sitemap() {
  const staticRoutes = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/customer`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/taxi`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/second-hand`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/business-register`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/track`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  let productRoutes = []
  try {
    const products = await prisma.product.findMany({
      where: { status: true },
      select: {
        proId: true,
        proName: true,
        updatedAt: true,
      },
      take: 2000,
    })

    productRoutes = products.map((p) => ({
      url: `${BASE_URL}/product/${getProductSlug(p)}`,
      lastModified: p.updatedAt || new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))
  } catch (err) {
    console.warn('Sitemap products fetch error:', err.message)
  }

  let secondHandRoutes = []
  try {
    const items = await prisma.secondHandItem.findMany({
      where: { status: 'AVAILABLE' },
      select: {
        id: true,
        title: true,
        updatedAt: true,
      },
      take: 500,
    })

    secondHandRoutes = items.map((item) => ({
      url: `${BASE_URL}/second-hand/${item.id}`,
      lastModified: item.updatedAt || new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  } catch (err) {
    console.warn('Sitemap second hand fetch error:', err.message)
  }

  return [...staticRoutes, ...productRoutes, ...secondHandRoutes]
}
