import CustomerDashboard from '@/components/customer/CustomerDashboard'
import { getActiveHeroSlides } from '@/lib/heroSlides.server'

// Re-generate the static storefront shell every 5 minutes (ISR) so admin
// slider changes propagate without a redeploy.
export const revalidate = 300

export const metadata = {
  title: "Shop All Products & Stores | MARTZONA",
  description: "Browse thousands of products across electronics, fresh groceries, supermarket items, and gourmet dining on MartZona.",
  alternates: {
    canonical: "https://martzona.com/customer",
  },
}

export default async function CustomerPage() {
  const initialSlides = await getActiveHeroSlides()
  return (
    <>
      <h1 className="sr-only">MartZona Storefront — Browse All Products & Stores</h1>
      <CustomerDashboard initialSlides={initialSlides} />
    </>
  )
}
