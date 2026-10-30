'use client'

import { Suspense, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import AdminVendorDetailView from '@/components/admin/AdminVendorDetailView'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

export default function AdminVendorProfilePage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const vendorId = params?.id

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) router.push(access.redirectTo)
    }
  }, [user, loading, router, userData])

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
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress sx={{ color: '#39772A' }} />
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    )
  }

  const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
  if (!access.hasAccess) return null

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Suspense
          fallback={
            <Box sx={{ py: 10, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress sx={{ color: '#39772A' }} />
            </Box>
          }
        >
          <AdminVendorDetailView vendorId={vendorId} />
        </Suspense>
      </Box>
    </DashboardLayout>
  )
}

