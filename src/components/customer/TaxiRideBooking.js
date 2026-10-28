'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import toast from 'react-hot-toast'

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api'

import LocalTaxiIcon from '@mui/icons-material/LocalTaxi'
import LuggageIcon from '@mui/icons-material/Luggage'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import NavigationIcon from '@mui/icons-material/Navigation'
import PhoneIcon from '@mui/icons-material/Phone'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import ElectricRickshawIcon from '@mui/icons-material/ElectricRickshaw'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import StarIcon from '@mui/icons-material/Star'
import LockIcon from '@mui/icons-material/Lock'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import SwapVertIcon from '@mui/icons-material/SwapVert'
import RouteIcon from '@mui/icons-material/Route'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import RefreshIcon from '@mui/icons-material/Refresh'

const BRAND = '#39772A'
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 } // Lahore Default Center
const GOOGLE_MAPS_LIBRARIES = ['places']

const VEHICLE_CATEGORIES = [
  {
    id: 'MOTO',
    label: 'Moto',
    desc: '1 Seat • Fast',
    basePrice: 120,
    perKm: 25,
    icon: <TwoWheelerIcon sx={{ fontSize: 26 }} />,
  },
  {
    id: 'AUTO',
    label: 'Rickshaw',
    desc: '3 Seats • Cheap',
    basePrice: 180,
    perKm: 35,
    icon: <ElectricRickshawIcon sx={{ fontSize: 26 }} />,
  },
  {
    id: 'CAR_MINI',
    label: 'Mini AC',
    desc: '4 Seats • Hatchback',
    basePrice: 320,
    perKm: 45,
    icon: <DirectionsCarIcon sx={{ fontSize: 26 }} />,
  },
  {
    id: 'CAR_AC',
    label: 'Comfort AC',
    desc: '4 Seats • Sedan',
    basePrice: 420,
    perKm: 55,
    icon: <DirectionsCarIcon sx={{ fontSize: 26, color: '#2563EB' }} />,
  },
]

export default function TaxiRideBooking({ onBack }) {
  // Service mode: TAXI or LUGGAGE
  const [serviceType, setServiceType] = useState('TAXI')
  const [selectedVehicle, setSelectedVehicle] = useState('CAR_AC')

  // Locations and Coordinates
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupCoord, setPickupCoord] = useState(null)
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [dropoffCoord, setDropoffCoord] = useState(null)
  const [locatingUser, setLocatingUser] = useState(false)

  // Route stats from Google Directions
  const [directions, setDirections] = useState(null)
  const [routeDistanceKm, setRouteDistanceKm] = useState(null)
  const [routeDurationMin, setRouteDurationMin] = useState(null)

  // Fare proposal (InDrive Bidding)
  const [suggestedFare, setSuggestedFare] = useState(420)
  const [customerFare, setCustomerFare] = useState('420')
  const [customerNotes, setCustomerNotes] = useState('')

  // Luggage specifics
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [packageWeight, setPackageWeight] = useState('')

  // Ride lifecycle
  const [requestingRide, setRequestingRide] = useState(false)
  const [activeRide, setActiveRide] = useState(null)
  const [acceptingBidId, setAcceptingBidId] = useState(null)

  // Map & Autocomplete refs
  const mapRef = useRef(null)
  const pickupAutoRef = useRef(null)
  const dropoffAutoRef = useRef(null)

  // Google Maps JS API Loader
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  // Simulated nearby driver cars on map for rich visual experience
  const nearbyDrivers = useCallback(() => {
    const center = pickupCoord || DEFAULT_CENTER
    return [
      { id: 1, lat: center.lat + 0.0035, lng: center.lng + 0.0028, type: 'CAR' },
      { id: 2, lat: center.lat - 0.0042, lng: center.lng + 0.0031, type: 'MOTO' },
      { id: 3, lat: center.lat + 0.0021, lng: center.lng - 0.0045, type: 'CAR' },
      { id: 4, lat: center.lat - 0.0031, lng: center.lng - 0.0025, type: 'AUTO' },
    ]
  }, [pickupCoord])

  // Calculate realistic suggested fare based on distance and vehicle
  const updateFareEstimate = useCallback((distanceKm, vehicleId, mode) => {
    const km = distanceKm || 5.0
    if (mode === 'LUGGAGE') {
      const base = 350
      const calculated = Math.round(base + km * 45)
      setSuggestedFare(calculated)
      setCustomerFare(String(calculated))
      return
    }

    const veh = VEHICLE_CATEGORIES.find(v => v.id === vehicleId) || VEHICLE_CATEGORIES[3]
    const calculated = Math.round(veh.basePrice + km * veh.perKm)
    setSuggestedFare(calculated)
    setCustomerFare(String(calculated))
  }, [])

  // Google Maps Directions calculation
  const calculateRoute = useCallback((origin, destination) => {
    if (!origin || !destination || !window.google?.maps) return

    const directionsService = new window.google.maps.DirectionsService()
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result)
          const leg = result.routes[0]?.legs[0]
          if (leg) {
            const dist = parseFloat((leg.distance.value / 1000).toFixed(1))
            const dur = Math.round(leg.duration.value / 60)
            setRouteDistanceKm(dist)
            setRouteDurationMin(dur)
            updateFareEstimate(dist, selectedVehicle, serviceType)
          }
        }
      }
    )
  }, [selectedVehicle, serviceType, updateFareEstimate])

  // Handle Autocomplete place selection for Pickup
  const onPickupPlaceChanged = () => {
    if (pickupAutoRef.current) {
      const place = pickupAutoRef.current.getPlace()
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const coord = { lat, lng }
        setPickupCoord(coord)
        setPickupAddress(place.formatted_address || place.name || '')
        if (dropoffCoord) calculateRoute(coord, dropoffCoord)
        if (mapRef.current) mapRef.current.panTo(coord)
      }
    }
  }

  // Handle Autocomplete place selection for Dropoff
  const onDropoffPlaceChanged = () => {
    if (dropoffAutoRef.current) {
      const place = dropoffAutoRef.current.getPlace()
      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        const coord = { lat, lng }
        setDropoffCoord(coord)
        setDropoffAddress(place.formatted_address || place.name || '')
        if (pickupCoord) calculateRoute(pickupCoord, coord)
      }
    }
  }

  // Swap Pickup & Dropoff
  const handleSwapLocations = () => {
    const tempAddr = pickupAddress
    const tempCoord = pickupCoord
    setPickupAddress(dropoffAddress)
    setPickupCoord(dropoffCoord)
    setDropoffAddress(tempAddr)
    setDropoffCoord(tempCoord)
    if (dropoffCoord && tempCoord) {
      calculateRoute(dropoffCoord, tempCoord)
    }
  }

  // Detect Current Location using Geolocation API + Google Geocoder
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const coord = { lat, lng }
        setPickupCoord(coord)

        if (window.google?.maps?.Geocoder) {
          const geocoder = new window.google.maps.Geocoder()
          geocoder.geocode({ location: coord }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              setPickupAddress(results[0].formatted_address)
            } else {
              setPickupAddress(`Current GPS Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`)
            }
          })
        }
        if (dropoffCoord) calculateRoute(coord, dropoffCoord)
        if (mapRef.current) mapRef.current.panTo(coord)
        setLocatingUser(false)
        toast.success('Pickup pinned to your current location!')
      },
      (err) => {
        setLocatingUser(false)
        toast.error('Could not detect location: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // Fetch customer's active ride
  const fetchActiveRide = useCallback(async () => {
    try {
      const res = await fetch('/api/rides?role=CUSTOMER')
      const data = await res.json()
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        const current = data.data.find(r => ['SEARCHING', 'ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(r.status))
        setActiveRide(current || null)
      } else {
        setActiveRide(null)
      }
    } catch {
      // Non-blocking
    }
  }, [])

  useEffect(() => {
    fetchActiveRide()
    const timer = setInterval(fetchActiveRide, 4000)
    return () => clearInterval(timer)
  }, [fetchActiveRide])

  // Vehicle Category change
  const handleSelectVehicle = (vehId) => {
    setSelectedVehicle(vehId)
    updateFareEstimate(routeDistanceKm || 5.0, vehId, serviceType)
  }

  // Service mode change
  const handleServiceModeChange = (mode) => {
    setServiceType(mode)
    updateFareEstimate(routeDistanceKm || 5.0, selectedVehicle, mode)
  }

  // Quick Fare Adjustment (+ / -)
  const adjustFare = (amount) => {
    setCustomerFare(prev => {
      const val = Math.max(100, (Number(prev) || suggestedFare) + amount)
      return String(val)
    })
  }

  // Submit Ride Request
  const handleRequestRide = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please enter pickup and dropoff locations')
      return
    }

    if (!customerFare || Number(customerFare) <= 0) {
      toast.error('Please propose your fare')
      return
    }

    try {
      setRequestingRide(true)
      const res = await fetch('/api/rides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType,
          rideCategory: serviceType === 'LUGGAGE' ? 'LUGGAGE_VAN' : selectedVehicle,
          pickupAddress,
          pickupLat: pickupCoord?.lat || null,
          pickupLng: pickupCoord?.lng || null,
          dropoffAddress,
          dropoffLat: dropoffCoord?.lat || null,
          dropoffLng: dropoffCoord?.lng || null,
          estimatedDistanceKm: routeDistanceKm || 5.0,
          customerFare: Number(customerFare),
          customerNotes,
          recipientName,
          recipientPhone,
          packageDescription,
          packageWeight,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Your request is live! Drivers are reviewing your fare.')
        setActiveRide(data.data)
        fetchActiveRide()
      } else {
        toast.error(data.error || 'Failed to request ride')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setRequestingRide(false)
    }
  }

  // Accept Driver Bid
  const handleAcceptDriverBid = async (bidId) => {
    if (!activeRide) return
    try {
      setAcceptingBidId(bidId)
      const res = await fetch(`/api/rides/${activeRide.id}/bids`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Driver accepted! Ride confirmed.')
        fetchActiveRide()
      } else {
        toast.error(data.error || 'Failed to accept bid')
      }
    } catch (err) {
      toast.error('Error: ' + err.message)
    } finally {
      setAcceptingBidId(null)
    }
  }

  // Cancel Ride
  const handleCancelRide = async () => {
    if (!activeRide) return
    if (!window.confirm('Cancel this ride request?')) return
    try {
      const res = await fetch(`/api/rides/${activeRide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Ride cancelled')
        setActiveRide(null)
      } else {
        toast.error(data.error || 'Failed to cancel')
      }
    } catch {
      toast.error('Error cancelling ride')
    }
  }

  return (
    <Box sx={{ maxWidth: 1380, mx: 'auto', p: { xs: 1.5, sm: 2.5, md: 3 } }}>
      {/* ─── MAIN DUAL-PANEL GRID (BOOKING ENGINE + LIVE GOOGLE MAP) ─── */}
      <Grid container spacing={3}>
        {/* ═════════════════════════════════════════════════════════════════
            LEFT PANEL: INTERACTIVE BOOKING & INCOMING BIDS ENGINE
        ═════════════════════════════════════════════════════════════════ */}
        <Grid item xs={12} lg={5} xl={4.8}>
          {activeRide ? (
            /* ─── ACTIVE RIDE & INCOMING BIDS LOBBY ─── */
            <Card
              sx={{
                borderRadius: 3.5,
                bgcolor: '#0F172A',
                color: '#fff',
                boxShadow: '0 16px 40px rgba(0,0,0,0.25)',
                border: '2px solid #38BDF8',
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2.5, bgcolor: '#0284C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  {activeRide.serviceType === 'LUGGAGE' ? <LuggageIcon sx={{ fontSize: 28 }} /> : <LocalTaxiIcon sx={{ fontSize: 28 }} />}
                  <div>
                    <Typography variant="subtitle1" fontWeight={900}>
                      {activeRide.serviceType === 'LUGGAGE' ? 'Luggage Delivery' : 'InDrive City Taxi'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#E0F2FE' }}>
                      {activeRide.status === 'SEARCHING' ? 'Searching Drivers...' : `Status: ${activeRide.status}`}
                    </Typography>
                  </div>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleCancelRide}
                  sx={{ bgcolor: '#DC2626', color: '#fff', fontWeight: 800, textTransform: 'none', py: 0.6, '&:hover': { bgcolor: '#b91c1c' } }}
                >
                  Cancel
                </Button>
              </Box>

              <CardContent sx={{ p: 2.5 }}>
                {/* Route Summary Card */}
                <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.06)', mb: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <LocationOnIcon sx={{ color: '#22C55E', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={600} color="#F1F5F9" noWrap>
                        {activeRide.pickupAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <NavigationIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                      <Typography variant="caption" fontWeight={600} color="#F1F5F9" noWrap>
                        {activeRide.dropoffAddress}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Status: Searching Drivers & Bidding Lobby */}
                {activeRide.status === 'SEARCHING' && (
                  <Box>
                    <Box sx={{ textAlign: 'center', py: 1.5, mb: 2 }}>
                      <CircularProgress size={32} sx={{ color: '#38BDF8', mb: 1 }} />
                      <Typography variant="h6" fontWeight={900}>
                        Your Offer: Rs. {Number(activeRide.customerFare).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                        Nearby drivers are sending bids. Tap to accept a driver.
                      </Typography>
                    </Box>

                    {/* Driver Bids Stream */}
                    <Typography variant="caption" fontWeight={800} sx={{ color: '#38BDF8', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
                      DRIVER OFFERS ({activeRide.driverBids?.length || 0})
                    </Typography>

                    {(!activeRide.driverBids || activeRide.driverBids.length === 0) ? (
                      <Box sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                          Broadcasting to nearby drivers...
                        </Typography>
                      </Box>
                    ) : (
                      <Stack spacing={1.5} sx={{ maxHeight: 320, overflowY: 'auto', pr: 0.5 }}>
                        {activeRide.driverBids.map((bid) => (
                          <Card
                            key={bid.id}
                            sx={{
                              p: 1.8,
                              borderRadius: 2.5,
                              bgcolor: 'rgba(255,255,255,0.08)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: '#fff',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar src={bid.driver?.image} sx={{ width: 42, height: 42, bgcolor: BRAND }}>
                                {bid.driver?.name?.charAt(0) || 'D'}
                              </Avatar>
                              <div>
                                <Typography variant="subtitle2" fontWeight={800}>
                                  {bid.driver?.name || 'Driver'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#38BDF8' }}>
                                  ⭐ 4.9 • ETA ~{bid.etaMinutes || 5} min
                                </Typography>
                              </div>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#22C55E' }}>
                                Rs. {Number(bid.bidAmount).toLocaleString()}
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleAcceptDriverBid(bid.id)}
                                disabled={acceptingBidId === bid.id}
                                sx={{
                                  bgcolor: '#22C55E',
                                  color: '#fff',
                                  fontWeight: 800,
                                  textTransform: 'none',
                                  px: 2,
                                  borderRadius: 1.5,
                                  '&:hover': { bgcolor: '#16a34a' },
                                }}
                              >
                                {acceptingBidId === bid.id ? 'Accepting...' : 'Accept'}
                              </Button>
                            </Box>
                          </Card>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}

                {/* Status: Driver Assigned & Trip Tracker */}
                {['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(activeRide.status) && (
                  <Box>
                    {/* Security PIN Banner */}
                    <Box sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#064E3B', border: '1px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LockIcon sx={{ color: '#6EE7B7' }} />
                        <div>
                          <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 800 }}>
                            RIDE PIN (SHARE WITH DRIVER)
                          </Typography>
                          <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: 4 }}>
                            {activeRide.rideOtp || '••••'}
                          </Typography>
                        </div>
                      </Box>
                      <Chip
                        label={activeRide.status === 'DRIVER_ARRIVED' ? 'Driver Outside' : activeRide.status === 'IN_PROGRESS' ? 'In Transit' : 'Driver Arriving'}
                        sx={{ bgcolor: '#fff', color: '#064E3B', fontWeight: 900, fontSize: '0.75rem' }}
                      />
                    </Box>

                    {/* Driver Card */}
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar src={activeRide.driver?.image} sx={{ width: 48, height: 48, bgcolor: BRAND }}>
                          {activeRide.driver?.name?.charAt(0) || 'D'}
                        </Avatar>
                        <div>
                          <Typography variant="subtitle1" fontWeight={800}>
                            {activeRide.driver?.name || 'Driver'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#38BDF8', display: 'block' }}>
                            Agreed Fare: <strong>Rs. {Number(activeRide.finalFare || activeRide.customerFare).toLocaleString()}</strong>
                          </Typography>
                        </div>
                      </Box>

                      {activeRide.driver?.phoneNumber && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<PhoneIcon />}
                          href={`tel:${activeRide.driver.phoneNumber}`}
                          sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 800, textTransform: 'none', px: 2, '&:hover': { bgcolor: '#16a34a' } }}
                        >
                          Call
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            /* ─── NEW RIDE BOOKING PANEL (HIGH-TECH INDRIVE STYLE) ─── */
            <Card
              sx={{
                borderRadius: 3.5,
                border: '1px solid #E2E8F0',
                boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Top Mode Header */}
              <Box sx={{ p: 2.5, bgcolor: '#0F172A', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography variant="h6" fontWeight={900}>
                    InDrive Ride & Dispatch
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Set your pickup, dropoff, and propose your fare.
                  </Typography>
                </div>

                {/* Mode Selector */}
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={<LocalTaxiIcon sx={{ color: serviceType === 'TAXI' ? '#fff !important' : 'inherit', fontSize: 18 }} />}
                    label="City Taxi"
                    clickable
                    onClick={() => handleServiceModeChange('TAXI')}
                    sx={{
                      fontWeight: 800,
                      bgcolor: serviceType === 'TAXI' ? BRAND : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Chip
                    icon={<LuggageIcon sx={{ color: serviceType === 'LUGGAGE' ? '#fff !important' : 'inherit', fontSize: 18 }} />}
                    label="Luggage Drop"
                    clickable
                    onClick={() => handleServiceModeChange('LUGGAGE')}
                    sx={{
                      fontWeight: 800,
                      bgcolor: serviceType === 'LUGGAGE' ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: '0.75rem',
                    }}
                  />
                </Stack>
              </Box>

              <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                <Stack spacing={2.5}>
                  {/* ── GOOGLE PLACES ROUTE SEARCH ── */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={0.5}>
                        ROUTE LOCATIONS (GOOGLE PLACES)
                      </Typography>
                      {pickupCoord && dropoffCoord && (
                        <IconButton size="small" onClick={handleSwapLocations} title="Swap pickup & dropoff">
                          <SwapVertIcon fontSize="small" sx={{ color: BRAND }} />
                        </IconButton>
                      )}
                    </Box>

                    <Stack spacing={1.5}>
                      {/* Pickup Input with Autocomplete */}
                      <Box sx={{ position: 'relative' }}>
                        {mapsLoaded ? (
                          <Autocomplete
                            onLoad={ref => (pickupAutoRef.current = ref)}
                            onPlaceChanged={onPickupPlaceChanged}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Search Pickup Address or Landmark..."
                              value={pickupAddress}
                              onChange={e => setPickupAddress(e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <LocationOnIcon sx={{ color: '#22C55E' }} />
                                  </InputAdornment>
                                ),
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <Tooltip title="Use my current GPS location">
                                      <IconButton
                                        size="small"
                                        onClick={handleLocateMe}
                                        disabled={locatingUser}
                                        sx={{ color: BRAND }}
                                      >
                                        {locatingUser ? <CircularProgress size={16} /> : <MyLocationIcon fontSize="small" />}
                                      </IconButton>
                                    </Tooltip>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Autocomplete>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Pickup address..."
                            value={pickupAddress}
                            onChange={e => setPickupAddress(e.target.value)}
                          />
                        )}
                      </Box>

                      {/* Dropoff Input with Autocomplete */}
                      <Box sx={{ position: 'relative' }}>
                        {mapsLoaded ? (
                          <Autocomplete
                            onLoad={ref => (dropoffAutoRef.current = ref)}
                            onPlaceChanged={onDropoffPlaceChanged}
                          >
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Where to? (Enter Dropoff Destination)..."
                              value={dropoffAddress}
                              onChange={e => setDropoffAddress(e.target.value)}
                              InputProps={{
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <NavigationIcon sx={{ color: '#EF4444' }} />
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Autocomplete>
                        ) : (
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Dropoff address..."
                            value={dropoffAddress}
                            onChange={e => setDropoffAddress(e.target.value)}
                          />
                        )}
                      </Box>
                    </Stack>

                    {/* Route Distance & Duration Chip */}
                    {routeDistanceKm && routeDurationMin && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: '#F0FDF4',
                          border: '1px solid #BBF7D0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <RouteIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                          <Typography variant="caption" fontWeight={800} color="#166534">
                            Driving Route: {routeDistanceKm} km
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTimeIcon sx={{ color: '#16A34A', fontSize: 16 }} />
                          <Typography variant="caption" fontWeight={800} color="#166534">
                            ~{routeDurationMin} mins
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  </Box>

                  {/* ── VEHICLE CATEGORY SELECTOR ── */}
                  {serviceType === 'TAXI' ? (
                    <Box>
                      <Typography variant="caption" fontWeight={800} color="#64748B" letterSpacing={0.5} sx={{ display: 'block', mb: 1 }}>
                        SELECT VEHICLE CLASS
                      </Typography>
                      <Grid container spacing={1.5}>
                        {VEHICLE_CATEGORIES.map(veh => {
                          const isSelected = selectedVehicle === veh.id
                          const estKm = routeDistanceKm || 5.0
                          const estPrice = Math.round(veh.basePrice + estKm * veh.perKm)

                          return (
                            <Grid item xs={6} key={veh.id}>
                              <Card
                                onClick={() => handleSelectVehicle(veh.id)}
                                sx={{
                                  p: 1.5,
                                  borderRadius: 2.5,
                                  cursor: 'pointer',
                                  border: isSelected ? `2px solid ${BRAND}` : '1px solid #E2E8F0',
                                  bgcolor: isSelected ? '#F0FDF4' : '#fff',
                                  transition: 'all 0.2s',
                                  '&:hover': { transform: 'translateY(-2px)' },
                                }}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                  <Box sx={{ color: isSelected ? BRAND : '#64748B' }}>
                                    {veh.icon}
                                  </Box>
                                  <Typography variant="subtitle2" fontWeight={900} sx={{ color: BRAND }}>
                                    Rs. {estPrice}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                                  {veh.label}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.68rem' }}>
                                  {veh.desc}
                                </Typography>
                              </Card>
                            </Grid>
                          )
                        })}
                      </Grid>
                    </Box>
                  ) : (
                    /* Luggage Information Inputs */
                    <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <Typography variant="caption" fontWeight={800} color="#7C3AED" sx={{ display: 'block', mb: 1 }}>
                        RECIPIENT & PACKAGE DETAILS
                      </Typography>
                      <Grid container spacing={1.5}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Recipient Name"
                            value={recipientName}
                            onChange={e => setRecipientName(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Recipient Phone"
                            value={recipientPhone}
                            onChange={e => setRecipientPhone(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={8}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Package Contents (e.g. 2 bags, electronics)"
                            value={packageDescription}
                            onChange={e => setPackageDescription(e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={4}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Est. Weight (kg)"
                            value={packageWeight}
                            onChange={e => setPackageWeight(e.target.value)}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* ── OFFER YOUR FARE (INDRIVE CORE BIDDING) ── */}
                  <Box
                    sx={{
                      p: 2.2,
                      borderRadius: 2.5,
                      bgcolor: '#ECFDF5',
                      border: '1.5px solid #A7F3D0',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight={900} color="#065F46" letterSpacing={0.5}>
                        OFFER YOUR FARE (BIDDING)
                      </Typography>
                      <Chip
                        label={`Est: Rs. ${suggestedFare}`}
                        size="small"
                        sx={{ bgcolor: '#fff', color: '#047857', fontWeight: 800, fontSize: '0.7rem' }}
                      />
                    </Box>

                    {/* Numeric Display & Quick Steppers */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5 }}>
                      <TextField
                        fullWidth
                        type="number"
                        value={customerFare}
                        onChange={e => setCustomerFare(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Typography fontWeight={900} color="#065F46" fontSize="1.1rem">
                                Rs.
                              </Typography>
                            </InputAdornment>
                          ),
                          sx: { bgcolor: '#fff', fontWeight: 900, fontSize: '1.3rem', borderRadius: 2 },
                        }}
                      />
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          variant="contained"
                          onClick={() => adjustFare(-50)}
                          sx={{ minWidth: 42, px: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        >
                          <RemoveIcon fontSize="small" />
                        </Button>
                        <Button
                          variant="contained"
                          onClick={() => adjustFare(50)}
                          sx={{ minWidth: 42, px: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}
                        >
                          <AddIcon fontSize="small" />
                        </Button>
                      </Stack>
                    </Box>

                    {/* Quick Adjustment Pills */}
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                      {[-50, 50, 100].map(amt => (
                        <Chip
                          key={amt}
                          label={`${amt > 0 ? '+' : ''}${amt}`}
                          clickable
                          onClick={() => adjustFare(amt)}
                          size="small"
                          sx={{ bgcolor: '#fff', fontWeight: 800, color: '#047857', border: '1px solid #BBF7D0' }}
                        />
                      ))}
                      <Chip
                        label="Reset to Est."
                        clickable
                        onClick={() => setCustomerFare(String(suggestedFare))}
                        size="small"
                        sx={{ bgcolor: '#fff', fontWeight: 700, color: '#64748B' }}
                      />
                    </Stack>

                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Optional message to driver (e.g. 2 bags, wait at gate)"
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      sx={{ bgcolor: '#fff', borderRadius: 1.5 }}
                    />
                  </Box>

                  {/* ── FIND DRIVERS BUTTON ── */}
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={handleRequestRide}
                    disabled={requestingRide}
                    startIcon={requestingRide ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <LocalTaxiIcon />}
                    sx={{
                      bgcolor: BRAND,
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: '1.05rem',
                      textTransform: 'none',
                      py: 1.6,
                      borderRadius: 2.5,
                      boxShadow: '0 6px 20px rgba(57,119,42,0.35)',
                      '&:hover': { bgcolor: '#2d5e21' },
                    }}
                  >
                    {requestingRide
                      ? 'Broadcasting...'
                      : serviceType === 'LUGGAGE'
                      ? `Request Luggage Drop (Offer Rs. ${Number(customerFare || 0).toLocaleString()})`
                      : `Find Drivers (Offer Rs. ${Number(customerFare || 0).toLocaleString()})`}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ═════════════════════════════════════════════════════════════════
            RIGHT PANEL: LIVE INTERACTIVE GOOGLE MAP & ROUTE POLYLINE
        ═════════════════════════════════════════════════════════════════ */}
        <Grid item xs={12} lg={7} xl={7.2}>
          <Card
            sx={{
              height: { xs: 360, sm: 460, md: 560, lg: 650 },
              borderRadius: 3.5,
              overflow: 'hidden',
              border: '1px solid #CBD5E1',
              boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
              position: 'relative',
            }}
          >
            {mapsLoaded ? (
              <GoogleMap
                onLoad={map => (mapRef.current = map)}
                center={pickupCoord || DEFAULT_CENTER}
                zoom={13}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {/* Real Turn-by-Turn Driving Route Polyline */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: '#059669',
                        strokeWeight: 6,
                        strokeOpacity: 0.9,
                      },
                      suppressMarkers: false,
                    }}
                  />
                )}

                {/* Pickup Marker if no directions rendered yet */}
                {!directions && pickupCoord && (
                  <Marker
                    position={pickupCoord}
                    label={{ text: 'A', color: '#fff', fontWeight: 'bold' }}
                    title="Pickup Location"
                  />
                )}

                {/* Dropoff Marker if no directions rendered yet */}
                {!directions && dropoffCoord && (
                  <Marker
                    position={dropoffCoord}
                    label={{ text: 'B', color: '#fff', fontWeight: 'bold' }}
                    title="Dropoff Destination"
                  />
                )}

                {/* Simulated nearby drivers moving around pickup point */}
                {nearbyDrivers().map(d => (
                  <Marker
                    key={d.id}
                    position={{ lat: d.lat, lng: d.lng }}
                    icon={{
                      path: window.google?.maps?.SymbolPath?.FORWARD_CLOSED_ARROW || 1,
                      scale: 4,
                      fillColor: '#1E293B',
                      fillOpacity: 0.9,
                      strokeColor: '#38BDF8',
                      strokeWeight: 2,
                    }}
                    title="Nearby Driver"
                  />
                ))}
              </GoogleMap>
            ) : (
              <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2, bgcolor: '#F8FAFC' }}>
                <CircularProgress sx={{ color: BRAND }} />
                <Typography variant="body2" color="text.secondary">
                  Loading Interactive Google Map & Places...
                </Typography>
              </Box>
            )}

            {/* Floating Map Status Overlay Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: 14,
                left: 14,
                bgcolor: 'rgba(15,23,42,0.85)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                px: 2,
                py: 0.8,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                zIndex: 10,
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
              <Typography variant="caption" fontWeight={800} letterSpacing={0.5}>
                LIVE GPS ROUTE & NEARBY DRIVERS
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
