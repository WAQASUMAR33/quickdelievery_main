'use client'

import CustomerDashboard from '@/app/customer/page'

// Direct route /taxi which renders Customer portal with active tab 'taxi'
export default function TaxiPage() {
  return <CustomerDashboard initialTab="taxi" />
}
