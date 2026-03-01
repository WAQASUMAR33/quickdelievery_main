'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import VendorProductManagement from '@/components/VendorProductManagement'
import VendorBusinessProfile from '@/components/vendor/VendorBusinessProfile'

import Box              from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Tab              from '@mui/material/Tab'
import Tabs             from '@mui/material/Tabs'
import Typography       from '@mui/material/Typography'

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'

const BRAND = '#D70F64'

export default function VendorDashboardPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('products')

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
      {/* ── Tab bar ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: 14, minHeight: 48 },
            '& .Mui-selected': { color: BRAND },
            '& .MuiTabs-indicator': { bgcolor: BRAND, height: 3 },
          }}
        >
          <Tab value="products" label="My Products"     icon={<Inventory2OutlinedIcon fontSize="small" />} iconPosition="start" />
          <Tab value="profile"  label="Business Profile" icon={<StorefrontOutlinedIcon  fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* ── Content ── */}
      <Box sx={{ p: 3 }}>
        {activeTab === 'products' && <VendorProductManagement />}
        {activeTab === 'profile'  && <VendorBusinessProfile />}
      </Box>
    </DashboardLayout>
  )
}
