'use client'

import { useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'

import CloseIcon from '@mui/icons-material/Close'
import NavigationIcon from '@mui/icons-material/Navigation'
import StorefrontIcon from '@mui/icons-material/Storefront'
import HomeIcon from '@mui/icons-material/Home'
import PhoneIcon from '@mui/icons-material/Phone'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import MyLocationIcon from '@mui/icons-material/MyLocation'

import OrderChatDrawer from '@/components/chat/OrderChatDrawer'

const BRAND = '#39772A'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

export default function DriverDeliveryNavigation({
  open,
  onClose,
  order,
  driver,
  onStatusUpdate,
}) {
  const [chatOpen, setChatOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [driverCoord, setDriverCoord] = useState({ lat: 31.5204, lng: 74.3587 })

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })

  const isPickedUp = order?.status === 'SHIPPED' || order?.status === 'DELIVERED'

  const customerCoord = {
    lat: parseFloat(order?.deliveryLatitude) || 31.5204,
    lng: parseFloat(order?.deliveryLongitude) || 74.3587,
  }

  const restaurantCoord = {
    lat: customerCoord.lat + 0.015,
    lng: customerCoord.lng - 0.012,
  }

  // Active target destination (Phase 1: Restaurant, Phase 2: Customer)
  const targetDestination = isPickedUp ? customerCoord : restaurantCoord

  // GPS Emitter: Tracks driver's browser geolocation and sends coordinates to server
  useEffect(() => {
    if (!open || !driver?.id) return

    const updateGps = async (pos) => {
      const lat = pos?.coords?.latitude || driverCoord.lat
      const lng = pos?.coords?.longitude || driverCoord.lng
      const heading = pos?.coords?.heading || 0
      const speed = pos?.coords?.speed || 0

      setDriverCoord({ lat, lng })

      try {
        await fetch('/api/driver/location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            driverId: driver.id,
            latitude: lat,
            longitude: lng,
            heading,
            speed,
          }),
        })
      } catch (e) {
        console.error('Failed to sync driver GPS to server:', e)
      }
    }

    // Try browser HTML5 Geolocation API
    let watchId = null
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        updateGps,
        () => {
          // If permission denied or unavailable, use simulated emitter
          const simInterval = setInterval(() => {
            setDriverCoord((prev) => {
              const next = {
                lat: prev.lat + (targetDestination.lat - prev.lat) * 0.05,
                lng: prev.lng + (targetDestination.lng - prev.lng) * 0.05,
              }
              updateGps({ coords: { latitude: next.lat, longitude: next.lng, heading: 45, speed: 30 } })
              return next
            })
          }, 3000)
          return () => clearInterval(simInterval)
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }

    return () => {
      if (watchId !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [open, driver?.id, isPickedUp, targetDestination])

  // Handle Picked Up / Completed Delivery Status Transitions
  const handleNextStatus = async () => {
    if (!order?.id || updating) return
    setUpdating(true)

    const nextStatus = isPickedUp ? 'DELIVERED' : 'SHIPPED'
    try {
      await onStatusUpdate(order.id, nextStatus)
      if (nextStatus === 'DELIVERED') {
        onClose()
      }
    } finally {
      setUpdating(false)
    }
  }

  const customerName = order?.user?.username || 'Customer'
  const customerPhone = order?.user?.phoneNumber || '+1 (555) 392-1084'
  const vendorName = order?.orderItems?.[0]?.product?.vendor?.username || 'Restaurant'

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { bgcolor: '#0f172a', display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Top Turn-by-Turn Instruction Banner */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            right: 16,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
          }}
        >
          <Paper
            elevation={4}
            sx={{
              p: 2,
              borderRadius: '20px',
              bgcolor: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              border: '1px solid rgba(255,255,255,0.15)',
              pointerEvents: 'auto',
              maxWidth: 460,
            }}
          >
            <Box sx={{
              width: 48, height: 48, borderRadius: '14px',
              bgcolor: isPickedUp ? '#3b82f6' : BRAND,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <NavigationIcon sx={{ fontSize: 28, color: '#fff', transform: 'rotate(45deg)' }} />
            </Box>

            <Box>
              <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                {isPickedUp ? 'PHASE 2: DELIVER TO CUSTOMER' : 'PHASE 1: PICKUP FROM RESTAURANT'}
              </Typography>
              <Typography variant="subtitle1" fontWeight={800} color="#ffffff">
                {isPickedUp ? order?.shippingAddress || 'Customer Address' : vendorName}
              </Typography>
            </Box>
          </Paper>

          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              pointerEvents: 'auto',
              '&:hover': { bgcolor: '#ffffff' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Map Section */}
        <Box sx={{ flex: 1, position: 'relative', bgcolor: '#1e293b' }}>
          {isLoaded && apiKey ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={driverCoord}
              zoom={15}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
              }}
            >
              {/* Driver Marker */}
              <Marker
                position={driverCoord}
                title="Your Live Position"
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                }}
              />

              {/* Destination Marker */}
              <Marker
                position={targetDestination}
                title={isPickedUp ? 'Customer Dropoff' : 'Restaurant Pickup'}
                icon={{
                  url: isPickedUp ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png' : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
              />

              {/* Route Line */}
              <Polyline
                path={[driverCoord, targetDestination]}
                options={{
                  strokeColor: BRAND,
                  strokeOpacity: 0.9,
                  strokeWeight: 5,
                }}
              />
            </GoogleMap>
          ) : (
            <Box sx={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#ffffff',
            }}>
              <MyLocationIcon sx={{ fontSize: 56, color: BRAND, mb: 1.5, animation: 'pulse 1.5s infinite' }} />
              <Typography variant="h6" fontWeight={700}>
                Live Navigation Active
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                Broadcasting your GPS coordinates to customer...
              </Typography>
            </Box>
          )}
        </Box>

        {/* Bottom Turn-by-Turn Action Panel */}
        <Paper
          elevation={8}
          sx={{
            p: 3,
            bgcolor: '#ffffff',
            borderTopLeftRadius: '28px',
            borderTopRightRadius: '28px',
          }}
        >
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            {/* Customer & Call / Chat Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: BRAND, width: 48, height: 48 }}>
                  <HomeIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    {customerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Order #{order?.id} • {order?.orderItems?.length || 1} items
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ChatBubbleIcon />}
                  onClick={() => setChatOpen(true)}
                  sx={{
                    borderColor: BRAND,
                    color: BRAND,
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#f0fdf4', borderColor: '#2e6122' },
                  }}
                >
                  Live Chat
                </Button>

                <Button
                  component="a"
                  href={`tel:${customerPhone}`}
                  variant="contained"
                  startIcon={<PhoneIcon />}
                  sx={{
                    bgcolor: BRAND,
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    '&:hover': { bgcolor: '#2e6122' },
                  }}
                >
                  Call
                </Button>
              </Stack>
            </Box>

            {/* Big Action Swipe/Button */}
            <Button
              fullWidth
              variant="contained"
              onClick={handleNextStatus}
              disabled={updating}
              startIcon={updating ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : <CheckCircleIcon />}
              sx={{
                py: 2,
                borderRadius: '16px',
                bgcolor: isPickedUp ? '#16a34a' : BRAND,
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 17,
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(57, 119, 42, 0.4)',
                '&:hover': { bgcolor: isPickedUp ? '#15803d' : '#2e6122' },
              }}
            >
              {isPickedUp ? '✓ Complete Order Delivery' : '✓ Confirm Order Picked Up'}
            </Button>
          </Box>
        </Paper>
      </Dialog>

      {/* Driver-Customer Live Chat */}
      <OrderChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        orderId={order?.id}
        currentUser={{ role: 'DRIVER', id: driver?.id || 1, username: driver?.username || 'Driver' }}
        recipientUser={{ name: customerName, phone: customerPhone, role: 'CUSTOMER' }}
      />
    </>
  )
}
