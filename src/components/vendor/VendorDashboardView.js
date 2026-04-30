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
import Tab              from '@mui/material/Tab'
import Tabs             from '@mui/material/Tabs'
import Typography       from '@mui/material/Typography'

import BarChartOutlinedIcon   from '@mui/icons-material/BarChartOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'

const BRAND = '#D70F64'

const TAB_ROUTE = {
  analytics: '/vendor/dashboard',
  products: '/vendor/dashboard/products',
  deals: '/vendor/dashboard/deals',
  profile: '/vendor/dashboard/profile',
}

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

  const setTabRoute = (_, val) => {
    router.push(TAB_ROUTE[val] || TAB_ROUTE.analytics)
  }

  return (
    <DashboardLayout>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={setTabRoute}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14, minHeight: 48 },
            '& .Mui-selected': { color: BRAND },
            '& .MuiTabs-indicator': { bgcolor: BRAND, height: 3 },
          }}
        >
          <Tab value="analytics" label="Analytics"        icon={<BarChartOutlinedIcon   fontSize="small" />} iconPosition="start" />
          <Tab value="products"  label="My Products"      icon={<Inventory2OutlinedIcon fontSize="small" />} iconPosition="start" />
          <Tab value="deals"     label="Food Deals"       icon={<LocalOfferOutlinedIcon fontSize="small" />} iconPosition="start" />
          <Tab value="profile"   label="Business Profile" icon={<StorefrontOutlinedIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ p: 3 }}>
        {activeTab === 'analytics' && <VendorAnalytics vendorId={userData?.uid} />}
        {activeTab === 'products' && <VendorProductManagement />}
        {activeTab === 'deals' && <FoodDealsManagement mode="vendor" />}
        {activeTab === 'profile' && <VendorBusinessProfile />}
      </Box>
    </DashboardLayout>
  )
}
