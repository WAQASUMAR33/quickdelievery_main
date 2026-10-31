import CustomerDashboard from '@/components/customer/CustomerDashboard'
import { getActiveHeroSlides } from '@/lib/heroSlides.server'

// Re-generate the static storefront shell every 5 minutes (ISR) so admin
// slider changes propagate without a redeploy.
export const revalidate = 300

export default async function CustomerPage() {
  const initialSlides = await getActiveHeroSlides()
  return <CustomerDashboard initialSlides={initialSlides} />
}

