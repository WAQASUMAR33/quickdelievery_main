'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DriverOrders from '@/components/driver/DriverOrders'

import { useState } from 'react'
import Box              from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography       from '@mui/material/Typography'
import Tabs             from '@mui/material/Tabs'
import Tab              from '@mui/material/Tab'

const BRAND = '#39772A'

export default function DriverDashboardPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN', 'DRIVER'])
      if (!access.hasAccess) {
        const role = getUserRole(userData)
        if (role === 'CUSTOMER')     router.push('/customer')
        else if (role === 'VENDOR')  router.push('/vendor/dashboard')
        else                         router.push('/login')
      }
    }
  }, [user, userData, loading, router])

  if (loading || !user || !userData || !['ADMIN', 'SUPER_ADMIN', 'DRIVER'].includes(userData?.role)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading Dashboard…</Typography>
      </Box>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Driver Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Claim available orders or view your active delivery assignments.
          </Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={(e, val) => setTabValue(val)}
            TabIndicatorProps={{ style: { backgroundColor: BRAND } }}
            sx={{
              '& .MuiTab-root': { fontWeight: 600 },
              '& .Mui-selected': { color: `${BRAND} !important` }
            }}
          >
            <Tab label="Available Orders (Pool)" />
            <Tab label="My Active Deliveries" />
          </Tabs>
        </Box>

        {tabValue === 0 && <DriverOrders poolMode={true} />}
        {tabValue === 1 && <DriverOrders />}
      </Box>
    </DashboardLayout>
  )
}
