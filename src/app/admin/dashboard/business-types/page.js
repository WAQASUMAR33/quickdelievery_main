'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import BusinessTypesManagement from '@/components/admin/BusinessTypesManagement'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

const BusinessTypesPage = () => {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const access = checkUserAccess(user, userData, ['ADMIN'])
      if (!access.hasAccess) {
        const userRole = getUserRole(userData)
        if (userRole === 'CUSTOMER') {
          router.push('/customer')
        } else if (userRole === 'VENDOR') {
          router.push('/vendor/dashboard')
        } else {
          router.push(access.redirectTo)
        }
      }
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          bgcolor: 'grey.50',
        }}
      >
        <CircularProgress sx={{ color: '#D70F64' }} />
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    )
  }

  return (
    <DashboardLayout>
      <BusinessTypesManagement />
    </DashboardLayout>
  )
}

export default BusinessTypesPage
