'use client'

import nextDynamic from 'next/dynamic'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

const CustomerDashboard = nextDynamic(() => import('@/app/customer/page'), {
  ssr: false,
  loading: () => (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0b1120' }}>
      <CircularProgress sx={{ color: '#10B981' }} />
    </Box>
  ),
})

export const dynamic = 'force-dynamic'

// Direct route /taxi which renders Customer portal with active tab 'taxi'
export default function TaxiPage() {
  return <CustomerDashboard initialTab="taxi" />
}
