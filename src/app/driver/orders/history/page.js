'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DriverOrders from '@/components/driver/DriverOrders'

import Box              from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography       from '@mui/material/Typography'

const BRAND = '#39772A'

export default function DriverOrderHistoryPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN', 'DRIVER'])
      if (!access.hasAccess) {
        const role = getUserRole(userData)
        if (role === 'CUSTOMER')     router.push('/customer')
        else if (role === 'VENDOR')  router.push('/vendor/dashboard')
        else                         router.push(access.redirectTo)
      }
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading Order History…</Typography>
      </Box>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Delivery History</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Browse your completed and cancelled deliveries.
          </Typography>
        </Box>

        <DriverOrders historyMode />
      </Box>
    </DashboardLayout>
  )
}
