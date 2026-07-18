'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import VendorProductManagement from '@/components/VendorProductManagement'
import VendorBusinessProfile from '@/components/vendor/VendorBusinessProfile'
import VendorAnalytics from '@/components/vendor/VendorAnalytics'
import FoodDealsManagement from '@/components/admin/FoodDealsManagement'

import Box              from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography       from '@mui/material/Typography'

const BRAND = '#D70F64'

function pathnameToTab(pathname) {
  const n = (pathname || '').replace(/\/$/, '')
  if (n.endsWith('/products')) return 'products'
  if (n.endsWith('/deals')) return 'deals'
  if (n.endsWith('/profile')) return 'profile'
  return 'analytics'
}

export default function VendorDashboardView() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = pathnameToTab(pathname)

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['VENDOR'])
      if (!access.hasAccess) router.push(access.redirectTo)
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={40} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading vendor dashboard...</Typography>
      </Box>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {activeTab === 'analytics' && <VendorAnalytics vendorId={userData?.uid} />}
        {activeTab === 'products' && <VendorProductManagement />}
        {activeTab === 'deals' && <FoodDealsManagement mode="vendor" />}
        {activeTab === 'profile' && <VendorBusinessProfile />}
      </Box>
    </DashboardLayout>
  )
}
