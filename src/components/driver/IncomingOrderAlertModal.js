'use client'

import { useState, useEffect, useRef } from 'react'
import Dialog from '@mui/material/Dialog'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

import DeliveryDiningIcon from '@mui/icons-material/DeliveryDining'
import StorefrontIcon from '@mui/icons-material/Storefront'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import CloseIcon from '@mui/icons-material/Close'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'

import { soundAlert } from '@/lib/soundAlert'

const BRAND = '#39772A'

export default function IncomingOrderAlertModal({
  order,
  driverId,
  onAccept,
  onDecline,
}) {
  const [secondsLeft, setSecondsLeft] = useState(30)
  const [accepting, setAccepting] = useState(false)
  const timerRef = useRef(null)

  // Start sound alert and 30-second countdown when order alert appears
  useEffect(() => {
    if (order) {
      setSecondsLeft(30)
      soundAlert.startOrderAlertLoop()
      soundAlert.showNotification(
        '🔥 New Order Dispatch Alert!',
        `Order #${order.id} is ready for pickup. Accept within 30 seconds.`
      )

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            soundAlert.stopOrderAlertLoop()
            onDecline(order)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      soundAlert.stopOrderAlertLoop()
    }
  }, [order])

  const handleAcceptOrder = async () => {
    soundAlert.stopOrderAlertLoop()
    setAccepting(true)
    try {
      await onAccept(order)
    } finally {
      setAccepting(false)
    }
  }

  const handleDeclineOrder = () => {
    soundAlert.stopOrderAlertLoop()
    onDecline(order)
  }

  if (!order) return null

  const vendorName = order?.orderItems?.[0]?.product?.vendor?.username || 'Restaurant Partner'
  const estPayout = order?.serviceCharge ? `$${(parseFloat(order.serviceCharge) + 5.0).toFixed(2)}` : '$8.50'
  const itemsCount = order?.orderItems?.length || 1

  return (
    <Dialog
      open={Boolean(order)}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '2px solid',
          borderColor: BRAND,
        },
      }}
    >
      {/* Header Banner */}
      <Box
        sx={{
          bgcolor: BRAND,
          color: '#ffffff',
          p: 3,
          textAlign: 'center',
          position: 'relative',
        }}
      >
        {/* Beep sound icon */}
        <Box sx={{
          position: 'absolute', top: 16, right: 16,
          display: 'flex', alignItems: 'center', gap: 0.5,
          bgcolor: 'rgba(255,255,255,0.2)', px: 1.5, py: 0.5, borderRadius: '12px'
        }}>
          <VolumeUpIcon sx={{ fontSize: 16 }} />
          <Typography variant="caption" fontWeight={700}>Alerting</Typography>
        </Box>

        <Box sx={{
          width: 64, height: 64, borderRadius: '50%',
          bgcolor: '#ffffff', color: BRAND,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mx: 'auto', mb: 1.5,
          boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
        }}>
          <DeliveryDiningIcon sx={{ fontSize: 38 }} />
        </Box>

        <Typography variant="h5" fontWeight={800} gutterBottom>
          New Delivery Request!
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Vendor has accepted the order & started food prep
        </Typography>
      </Box>

      {/* 30-Second Countdown Progress Bar */}
      <Box sx={{ width: '100%' }}>
        <LinearProgress
          variant="determinate"
          value={(secondsLeft / 30) * 100}
          sx={{
            height: 6,
            bgcolor: '#fee2e2',
            '& .MuiLinearProgress-bar': {
              bgcolor: secondsLeft > 10 ? BRAND : '#ef4444',
              transition: 'transform 1s linear',
            },
          }}
        />
      </Box>

      {/* Content Body */}
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ESTIMATED EARNINGS
            </Typography>
            <Typography variant="h4" fontWeight={900} color={BRAND}>
              {estPayout}
            </Typography>
          </Box>

          <Chip
            label={`${secondsLeft}s left`}
            sx={{
              fontWeight: 800,
              fontSize: 14,
              bgcolor: secondsLeft > 10 ? '#f0fdf4' : '#fef2f2',
              color: secondsLeft > 10 ? BRAND : '#dc2626',
              border: '1px solid',
              borderColor: secondsLeft > 10 ? '#bbf7d0' : '#fecaca',
            }}
          />
        </Box>

        {/* Pickup & Dropoff details */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', mb: 3 }}>
          <Stack spacing={2}>
            {/* Pickup */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <StorefrontIcon sx={{ color: '#3b82f6', mt: 0.3 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  PICKUP (RESTAURANT)
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  {vendorName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {itemsCount} {itemsCount === 1 ? 'item' : 'items'} • Ready in ~8 mins
                </Typography>
              </Box>
            </Box>

            {/* Dropoff */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <LocationOnIcon sx={{ color: '#ef4444', mt: 0.3 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  DROPOFF (CUSTOMER)
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">
                  {order?.shippingAddress || 'Customer Address (1.8 km)'}
                </Typography>
              </Box>
            </Box>
          </Stack>
        </Paper>

        {/* Buttons */}
        <Stack direction="row" spacing={1.5}>
          <Button
            fullWidth
            variant="outlined"
            onClick={handleDeclineOrder}
            disabled={accepting}
            sx={{
              py: 1.5,
              borderRadius: '14px',
              borderColor: '#cbd5e1',
              color: '#64748b',
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { borderColor: '#ef4444', color: '#ef4444', bgcolor: '#fef2f2' },
            }}
          >
            Decline
          </Button>

          <Button
            fullWidth
            variant="contained"
            onClick={handleAcceptOrder}
            disabled={accepting}
            sx={{
              py: 1.5,
              borderRadius: '14px',
              bgcolor: BRAND,
              color: '#ffffff',
              fontWeight: 800,
              fontSize: 16,
              textTransform: 'none',
              boxShadow: '0 6px 20px rgba(57, 119, 42, 0.4)',
              '&:hover': { bgcolor: '#2e6122' },
            }}
          >
            {accepting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Accept Delivery'}
          </Button>
        </Stack>
      </Box>
    </Dialog>
  )
}
