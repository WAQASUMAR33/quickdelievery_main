import SingleSecondHandView from '@/components/customer/SingleSecondHandView'
import { prisma } from '@/lib/prisma'

export async function generateMetadata({ params }) {
  try {
    const { id } = await params
    const itemId = Number(id)
    if (!itemId) return { title: '2nd Hand Item | MARTZONA' }

    const item = await prisma.secondHandItem.findUnique({
      where: { id: itemId },
      select: { title: true, description: true, price: true, images: true, city: true },
    })

    if (!item) return { title: 'Item Not Found | MARTZONA 2nd Hand' }

    let images = []
    try {
      images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    } catch {
      images = []
    }

    return {
      title: `${item.title} — Rs. ${Number(item.price).toLocaleString()} | Martzona Pre-Loved`,
      description: item.description?.slice(0, 160) || `Buy ${item.title} at Rs. ${item.price} on Martzona Pre-Loved Marketplace.`,
      openGraph: {
        title: item.title,
        description: item.description?.slice(0, 160),
        images: Array.isArray(images) && images.length > 0 ? [images[0]] : [],
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

  return <SingleSecondHandView itemId={id} initialData={item} />
}
