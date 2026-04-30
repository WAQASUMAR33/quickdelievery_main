'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FoodDealsManagement from '@/components/admin/FoodDealsManagement'

import Box               from '@mui/material/Box'
import CircularProgress  from '@mui/material/CircularProgress'
import Typography        from '@mui/material/Typography'

const BRAND = '#D70F64'

export default function AdminFoodDealsPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) router.push('/login')
    }
  }, [authLoading, user, userData, router])

  if (authLoading || !userData) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', flexDirection: 'column', gap: 2 }}>
          <CircularProgress size={40} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading…</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
  if (!access.hasAccess) return null

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <FoodDealsManagement mode="admin" />
      </Box>
    </DashboardLayout>
  )
}
