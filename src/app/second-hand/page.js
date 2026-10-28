'use client'

import CustomerDashboard from '@/app/customer/page'

// Direct route /second-hand which renders Customer portal with active tab 'secondhand'
export default function SecondHandPage() {
  return <CustomerDashboard initialTab="secondhand" />
}
