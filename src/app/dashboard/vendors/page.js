'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import VendorManagement from '@/components/VendorManagement'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export default function VendorsPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) router.push(access.redirectTo)
    }
  }, [user, loading, router, userData])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, bgcolor: 'grey.50' }}>
        <CircularProgress sx={{ color: '#D70F64' }} />
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    )
  }

  const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
  if (!access.hasAccess) return null

  return (
    <DashboardLayout>
      <VendorManagement />
    </DashboardLayout>
  )
}
