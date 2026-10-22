import SingleProductView from '@/components/customer/SingleProductView'
import { prisma } from '@/lib/prisma'
import { parseProductSlug } from '@/lib/productSlug'

export async function generateMetadata({ params }) {
  try {
    const { id: rawParam } = await params
    const { id, slug } = parseProductSlug(rawParam)

    let product = null
    if (id) {
      product = await prisma.product.findUnique({
        where: { proId: id },
        select: { proName: true, description: true, proImages: true },
      })
    } else if (slug) {
      product = await prisma.product.findFirst({
        where: { proName: { contains: slug.replace(/-/g, ' ') }, status: true },
        select: { proName: true, description: true, proImages: true },
      })
    }

    if (!product) return { title: 'Product Not Found | QuickDelivery' }

    return {
      title: `${product.proName} — QuickDelivery Boutique`,
      description: product.description?.slice(0, 160) || `Buy ${product.proName} on QuickDelivery.`,
    }
  } catch {
    return { title: 'QuickDelivery — Product' }
  }
}

export default async function ProductsPluralPage({ params }) {
  const { id: rawParam } = await params
  return <SingleProductView productIdentifier={rawParam} />
}

