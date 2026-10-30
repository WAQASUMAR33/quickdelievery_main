import SingleSecondHandView from '@/components/customer/SingleSecondHandView'
import { prisma } from '@/lib/prisma'

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://martzona.com'

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    const itemId = Number(id)
    if (!itemId) return { title: '2nd Hand Item | MARTZONA' }

    const item = await prisma.secondHandItem.findUnique({
      where: { id: itemId },
      select: { title: true, description: true, price: true, images: true, city: true, category: true, condition: true },
    })

    if (!item) return { title: 'Item Not Found | MARTZONA 2nd Hand' }

    let images = []
    try {
      images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    } catch {
      images = []
    }

    const title = `${item.title} — Rs. ${Number(item.price).toLocaleString()} | Martzona Pre-Loved`
    const description = item.description?.slice(0, 160) || `Buy ${item.title} in ${item.city || 'Pakistan'} at Rs. ${Number(item.price).toLocaleString()} on Martzona Pre-Loved Marketplace.`
    const url = `${BASE_URL}/second-hand/${itemId}`
    const imageUrl = Array.isArray(images) && images.length > 0 ? images[0] : `${BASE_URL}/images/martzona_logo_transparent.png`

    return {
      title,
      description,
      alternates: {
        canonical: url,
      },
      openGraph: {
        title,
        description,
        url,
        siteName: 'Martzona Pakistan',
        images: [{ url: imageUrl, width: 800, height: 600, alt: item.title }],
        locale: 'en_PK',
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    }
  } catch {
    return { title: 'MARTZONA — 2nd Hand Marketplace' }
  }
}

export default async function SecondHandItemPage({ params }) {
  const { id } = await params
  const itemId = Number(id)

  let item = null
  if (itemId) {
    try {
      const dbItem = await prisma.secondHandItem.findUnique({
        where: { id: itemId },
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
        },
      })
      if (dbItem) {
        item = {
          ...dbItem,
          price: Number(dbItem.price),
          originalPrice: dbItem.originalPrice ? Number(dbItem.originalPrice) : null,
          minOfferPrice: dbItem.minOfferPrice ? Number(dbItem.minOfferPrice) : null,
          seller: dbItem.seller ? { ...dbItem.seller, name: dbItem.seller.username } : null,
        }
      }
    } catch (err) {
      console.error('Failed to pre-fetch item:', err)
    }
  }

  // Schema.org JSON-LD Structured Data for Google Rich Snippets
  let jsonLd = null
  if (item) {
    let images = []
    try {
      images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    } catch {
      images = []
    }

    const conditionMap = {
      BRAND_NEW: 'https://schema.org/NewCondition',
      LIKE_NEW: 'https://schema.org/UsedCondition',
      EXCELLENT: 'https://schema.org/UsedCondition',
      GOOD: 'https://schema.org/UsedCondition',
      FAIR: 'https://schema.org/UsedCondition',
    }
    const schemaCondition = conditionMap[item.condition] || 'https://schema.org/UsedCondition'

    // Price valid for 1 year from creation or today
    const validUntilDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Product',
          '@id': `${BASE_URL}/second-hand/${itemId}#product`,
          name: item.title,
          image: images.length > 0 ? images : [`${BASE_URL}/images/martzona_logo_transparent.png`],
          description: item.description || item.title,
          category: item.category,
          sku: `MZ-2ND-${itemId}`,
          itemCondition: schemaCondition,
          brand: {
            '@type': 'Brand',
            name: item.category || 'Martzona Classifieds',
          },
          offers: {
            '@type': 'Offer',
            url: `${BASE_URL}/second-hand/${itemId}`,
            priceCurrency: 'PKR',
            price: Number(item.price),
            priceValidUntil: validUntilDate,
            itemCondition: schemaCondition,
            availability: item.status === 'AVAILABLE' ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            seller: {
              '@type': item.sellerType === 'MERCHANT' ? 'Organization' : 'Person',
              name: item.seller?.name || 'Verified Martzona Seller',
            },
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${BASE_URL}/second-hand/${itemId}#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: BASE_URL,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: '2nd Hand Marketplace',
              item: `${BASE_URL}/second-hand`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: item.category || 'Items',
              item: `${BASE_URL}/second-hand?category=${encodeURIComponent(item.category || '')}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: item.title,
              item: `${BASE_URL}/second-hand/${itemId}`,
            },
          ],
        },
      ],
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SingleSecondHandView itemId={id} initialData={item} />
    </>
  )
}
