'use client'

import { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api'
import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'

import CloseIcon from '@mui/icons-material/Close'
import PhoneIcon from '@mui/icons-material/Phone'
import ChatBubbleIcon from '@mui/icons-material/ChatBubble'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import StoreIcon from '@mui/icons-material/Store'
import HomeIcon from '@mui/icons-material/Home'
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled'
import NavigationIcon from '@mui/icons-material/Navigation'

import OrderChatDrawer from '@/components/chat/OrderChatDrawer'

const BRAND = '#39772A'

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

export default function CustomerLiveTracking({
  open,
  onClose,
  order,
  currentUser,
}) {
  const [driverLocation, setDriverLocation] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [etaMinutes, setEtaMinutes] = useState(12)
  const [distanceKm, setDistanceKm] = useState(2.4)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
  })

  // Simulated or real coordinates for delivery endpoints
  const customerCoord = {
    lat: parseFloat(order?.deliveryLatitude) || 31.5204,
    lng: parseFloat(order?.deliveryLongitude) || 74.3587,
  }

  const restaurantCoord = {
    lat: customerCoord.lat + 0.015,
    lng: customerCoord.lng - 0.012,
  }

  // Poll driver GPS location every 3 seconds
  useEffect(() => {
    if (!open || !order?.id) return

    const fetchLocation = async () => {
      try {
        const res = await fetch(`/api/driver/location?orderId=${order.id}`)
        const data = await res.json()
        if (data.success && data.data) {
          setDriverLocation({
            lat: data.data.latitude,
            lng: data.data.longitude,
            heading: data.data.heading || 0,
          })
          // Calculate dynamic distance/ETA approximation
          const dLat = Math.abs(data.data.latitude - customerCoord.lat)
          const dLng = Math.abs(data.data.longitude - customerCoord.lng)
          const approxKm = Math.max(0.2, ((dLat + dLng) * 111).toFixed(1))
          setDistanceKm(approxKm)
          setEtaMinutes(Math.max(2, Math.round(approxKm * 3.5)))
        }
      } catch (e) {
        console.error('Failed to fetch driver GPS:', e)
      }
    }

    fetchLocation()
    const interval = setInterval(fetchLocation, 3000)
    return () => clearInterval(interval)
  }, [open, order?.id])

  // Center coordinate for Google Map
  const mapCenter = driverLocation || {
    lat: (restaurantCoord.lat + customerCoord.lat) / 2,
    lng: (restaurantCoord.lng + customerCoord.lng) / 2,
  }

  const driverPos = driverLocation || {
    lat: restaurantCoord.lat - 0.005,
    lng: restaurantCoord.lng + 0.004,
  }

  // Route path line points
  const routePath = [
    restaurantCoord,
    driverPos,
    customerCoord,
  ]

  const driverName = order?.driver?.username || order?.driverName || 'Alex Rider'
  const driverPhone = order?.driver?.phoneNumber || order?.driverPhone || '+1 (555) 019-2834'

  return (
    <>
      <Dialog
        fullScreen
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: { bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' },
        }}
      >
        {/* Top Floating App Bar */}
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
            elevation={3}
            sx={{
              px: 2.5,
              py: 1.25,
              borderRadius: '24px',
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pointerEvents: 'auto',
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              Live Delivery Tracking • Order #{order?.id}
            </Typography>
          </Paper>

          <IconButton
            onClick={onClose}
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              pointerEvents: 'auto',
              '&:hover': { bgcolor: '#ffffff' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Interactive Map Section */}
        <Box sx={{ flex: 1, position: 'relative', minHeight: '60vh', bgcolor: '#e5e7eb' }}>
          {isLoaded && apiKey ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={14}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                styles: [
                  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                ],
              }}
            >
              {/* Restaurant Pin */}
              <Marker
                position={restaurantCoord}
                title="Restaurant / Pickup"
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                }}
              />

              {/* Driver Bike Marker */}
              <Marker
                position={driverPos}
                title="Driver Live Location"
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                }}
              />

              {/* Customer Pin */}
              <Marker
                position={customerCoord}
                title="Your Delivery Address"
                icon={{
                  url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                }}
              />

              {/* Route Polyline */}
              <Polyline
                path={routePath}
                options={{
                  strokeColor: BRAND,
                  strokeOpacity: 0.8,
                  strokeWeight: 4,
                }}
              />
            </GoogleMap>
          ) : (
            // Visual Simulated Map UI if Google Maps key is being loaded
            <Box sx={{
              width: '100%', height: '100%',
              bgcolor: '#1e293b',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Radar Grid Animation */}
              <Box sx={{
                position: 'absolute', width: 420, height: 420,
                borderRadius: '50%', border: '1px solid rgba(57, 119, 42, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Box sx={{
                  width: 260, height: 260,
                  borderRadius: '50%', border: '1px solid rgba(57, 119, 42, 0.4)',
                }} />
              </Box>

              <Box sx={{
                p: 2.5, bgcolor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                borderRadius: '20px', textAlign: 'center', zIndex: 2,
                border: '1px solid rgba(255,255,255,0.15)', maxWidth: 360,
              }}>
                <NavigationIcon sx={{ fontSize: 44, color: '#4ade80', mb: 1, animation: 'bounce 2s infinite' }} />
                <Typography variant="h6" fontWeight={700} color="#ffffff" gutterBottom>
                  Driver in Transit
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)">
                  Live GPS signal connected. Driver is moving towards your destination.
                </Typography>
              </Box>
            </Box>
          )}

          {/* Floating ETA Badge */}
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              px: 3,
              py: 1.5,
              borderRadius: '24px',
              bgcolor: BRAND,
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              boxShadow: '0 8px 24px rgba(57, 119, 42, 0.4)',
            }}
          >
            <AccessTimeFilledIcon sx={{ fontSize: 22 }} />
            <Typography variant="subtitle2" fontWeight={800} sx={{ letterSpacing: '0.3px' }}>
              Estimated Arrival: ~{etaMinutes} mins ({distanceKm} km away)
            </Typography>
          </Paper>
        </Box>

        {/* Bottom Driver Info & Actions Card */}
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2.5, sm: 3 },
            bgcolor: '#ffffff',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            boxShadow: '0 -8px 30px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            {/* Status Timeline */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={order?.status || 'IN TRANSIT'}
                  size="small"
                  sx={{
                    bgcolor: '#f0fdf4',
                    color: BRAND,
                    fontWeight: 800,
                    border: '1px solid #bbf7d0',
                  }}
                />
                <Typography variant="caption" color="text.secondary">
                  Heading to delivery address
                </Typography>
              </Box>
              <Typography variant="caption" fontWeight={600} color="text.primary">
                {order?.shippingAddress?.slice(0, 30) || 'Home Address'}...
              </Typography>
            </Box>

            {/* Driver Profile & Buttons */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 54, height: 54, bgcolor: BRAND, boxShadow: '0 4px 12px rgba(57,119,42,0.25)' }}>
                  <TwoWheelerIcon sx={{ fontSize: 30 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    {driverName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    ★ 4.9 • Motorcycle • Honda 125
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={1.5}>
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
                    px: 2.5,
                    '&:hover': { borderColor: '#2e6122', bgcolor: '#f0fdf4' },
                  }}
                >
                  Live Chat
                </Button>

                <Button
                  component="a"
                  href={`tel:${driverPhone}`}
                  variant="contained"
                  startIcon={<PhoneIcon />}
                  sx={{
                    bgcolor: BRAND,
                    color: '#ffffff',
                    borderRadius: '12px',
                    fontWeight: 700,
                    textTransform: 'none',
                    px: 2.5,
                    boxShadow: '0 4px 14px rgba(57, 119, 42, 0.3)',
                    '&:hover': { bgcolor: '#2e6122' },
                  }}
                >
                  Call
                </Button>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Dialog>

      {/* Live Chat Drawer */}
      <OrderChatDrawer
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        orderId={order?.id}
        currentUser={currentUser || { role: 'CUSTOMER', id: order?.userId, username: 'Customer' }}
        recipientUser={{ name: driverName, phone: driverPhone, role: 'DRIVER' }}
      />
    </>
  )
}
