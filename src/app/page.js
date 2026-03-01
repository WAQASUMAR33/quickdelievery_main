'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserRole } from '@/lib/authHelpers'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'

function HomeContent() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user && userData) {
        const role = getUserRole(userData)
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
          router.push('/admin/dashboard')
        } else if (role === 'VENDOR') {
          router.push('/vendor/dashboard')
        } else {
          // CUSTOMER, GUEST, or any other role → customer page
          router.push('/customer')
        }
      } else {
        // No session at all — go to customer (guest mode is default)
        router.push('/customer')
      }
    }
  }, [user, userData, loading, router])

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: '#D70F64' }} />
    </Box>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#D70F64' }} />
      </Box>
    }>
      <HomeContent />
    </Suspense>
  )
}
