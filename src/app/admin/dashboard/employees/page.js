'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'

export default function EmployeesPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) router.push(access.redirectTo || '/login')
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={36} sx={{ color: '#39772A' }} />
      </Box>
    )
  }

  const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
  if (!user || !access.hasAccess) return null

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>Employees & Staff</Typography>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              Employee & Staff Management
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={1}>
              Role-based permissions and staff access control are managed through the central security policy.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  )
}
