import SingleProductView from '@/components/customer/SingleProductView'
import { prisma } from '@/lib/prisma'
import { parseProductSlug, getProductSlug } from '@/lib/productSlug'

export async function generateMetadata({ params }) {
  try {
    const { id: rawParam } = await params
    const { id, slug } = parseProductSlug(rawParam)

    let product = null
    if (id) {
      product = await prisma.product.findUnique({
        where: { proId: id },
        select: { proId: true, proName: true, description: true, proImages: true, brandName: true },
      })
    } else if (slug) {
      product = await prisma.product.findFirst({
        where: { proName: { contains: slug.replace(/-/g, ' ') }, status: true },
        select: { proId: true, proName: true, description: true, proImages: true, brandName: true },
      })
    }

    if (!product) {
      return { title: 'Product Not Found | MARTZONA' }
    }

    let images = []
    if (product.proImages) {
      try {
        images = typeof product.proImages === 'string' ? JSON.parse(product.proImages) : product.proImages
      } catch {
        images = [product.proImages]
      }
    }

    return {
      title: `${product.proName} — MARTZONA Boutique`,
      description: product.description?.slice(0, 160) || `Buy ${product.proName} at the best price on MARTZONA. Fast delivery across Pakistan.`,
      openGraph: {
        title: product.proName,
        description: product.description?.slice(0, 160),
        images: Array.isArray(images) && images.length > 0 ? [images[0]] : [],
      },
    }
  } catch (err) {
    return {
      title: 'MARTZONA — Product Catalog',
    }
  }
}

export default async function ProductPage({ params }) {
  const { id: rawParam } = await params
  return <SingleProductView productIdentifier={rawParam} />
}

