'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import DriverOrders from '@/components/driver/DriverOrders'
import DriverBatchDispatches from '@/components/driver/DriverBatchDispatches'
import DriverTaxiBids from '@/components/driver/DriverTaxiBids'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Chip from '@mui/material/Chip'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import toast from 'react-hot-toast'

const BRAND = '#39772A'

export default function DriverDashboardPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [isOnDuty, setIsOnDuty] = useState(true)
  const [walletStats, setWalletStats] = useState(null)

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN', 'DRIVER'])
      if (!access.hasAccess) {
        const role = getUserRole(userData)
        if (role === 'CUSTOMER') router.push('/customer')
        else if (role === 'VENDOR') router.push('/vendor/dashboard')
        else router.push('/login')
      }
    }
  }, [user, userData, loading, router])

  // Fetch driver wallet & COD stats
  useEffect(() => {
    if (userData?.id) {
      fetch(`/api/driver/wallet?driverId=${userData.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setWalletStats(data.data)
          }
        })
        .catch(() => {})
    }
  }, [userData?.id])

  const handleDutyToggle = async () => {
    const nextStatus = !isOnDuty
    setIsOnDuty(nextStatus)
    try {
      await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData?.id,
          dutyStatus: nextStatus ? 'ON_DUTY' : 'OFF_DUTY',
        }),
      })
      toast.success(nextStatus ? 'Status: ON DUTY (Receiving Orders)' : 'Status: OFF DUTY (Paused)')
    } catch {
      toast.error('Failed to update duty status')
    }
  }

  if (loading || !user || !userData || !['ADMIN', 'SUPER_ADMIN', 'DRIVER'].includes(userData?.role)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading Driver Dashboard…</Typography>
      </Box>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        {/* Top Header with Duty Status & Shift */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <div>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <Typography variant="h5" fontWeight={700}>Driver Dispatch Command Center</Typography>
              <Chip
                label={isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                size="small"
                sx={{
                  bgcolor: isOnDuty ? '#d4edda' : '#f8d7da',
                  color: isOnDuty ? '#155724' : '#721c24',
                  fontWeight: 700,
                  fontSize: 11,
                }}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              Zone: <strong>Gulberg Central</strong> • Shift: <strong>Dinner Peak Rush</strong>
            </Typography>
          </div>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={isOnDuty}
                  onChange={handleDutyToggle}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: BRAND },
                  }}
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  {isOnDuty ? 'Go Offline' : 'Go Online'}
                </Typography>
              }
            />
          </Box>
        </Box>

        {/* Floating COD Cash In Hand Notice */}
        {walletStats?.codWallet && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              bgcolor: walletStats.codWallet.status === 'LIMIT_EXCEEDED' ? '#f8d7da' : '#e8f4fd',
              border: 1,
              borderColor: walletStats.codWallet.status === 'LIMIT_EXCEEDED' ? '#f5c6cb' : '#b8daff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            <div>
              <Typography variant="subtitle2" fontWeight={700} color={walletStats.codWallet.status === 'LIMIT_EXCEEDED' ? '#721c24' : '#004085'}>
                Floating Cash in Hand (COD): Rs. {walletStats.codWallet.cashInHand.toLocaleString()}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Remittance Limit: Rs. {walletStats.codWallet.remittanceLimit.toLocaleString()} • Remaining Capacity: Rs. {walletStats.codWallet.remainingCapacity.toLocaleString()}
              </Typography>
            </div>
            <Typography variant="caption" fontWeight={600} sx={{ bgcolor: 'white', px: 1.5, py: 0.5, borderRadius: 1 }}>
              Today's Completed Trips: {walletStats.earnings.todayTrips}
            </Typography>
          </Box>
        )}

        {/* Dashboard Tabs */}
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
            <Tab label="My Active Trips" />
            <Tab label="⚡ Smart Batched Trips" />
            <Tab label="🚖 InDrive Taxi & Luggage" />
          </Tabs>
        </Box>

        {tabValue === 0 && <DriverOrders poolMode={true} />}
        {tabValue === 1 && <DriverOrders />}
        {tabValue === 2 && <DriverBatchDispatches driverId={userData?.id} />}
        {tabValue === 3 && <DriverTaxiBids driverId={userData?.id} isOnDuty={isOnDuty} />}
      </Box>
    </DashboardLayout>
  )
}
