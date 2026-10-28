'use client'

import { useState, useEffect, useCallback } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import toast from 'react-hot-toast'

import LocalTaxiIcon from '@mui/icons-material/LocalTaxi'
import LuggageIcon from '@mui/icons-material/Luggage'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import NavigationIcon from '@mui/icons-material/Navigation'
import PhoneIcon from '@mui/icons-material/Phone'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import ElectricRickshawIcon from '@mui/icons-material/ElectricRickshaw'
import StarIcon from '@mui/icons-material/Star'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockIcon from '@mui/icons-material/Lock'

const BRAND = '#39772A'

const VEHICLE_CATEGORIES = [
  { id: 'MOTO', label: 'Moto / Bike', desc: 'Fastest for 1 person', basePrice: 150, icon: <TwoWheelerIcon sx={{ fontSize: 28 }} /> },
  { id: 'AUTO', label: 'Auto Rickshaw', desc: 'Affordable up to 3 people', basePrice: 250, icon: <ElectricRickshawIcon sx={{ fontSize: 28 }} /> },
  { id: 'CAR_MINI', label: 'Mini AC', desc: 'Economy hatchback', basePrice: 400, icon: <DirectionsCarIcon sx={{ fontSize: 28 }} /> },
  { id: 'CAR_AC', label: 'Comfort AC', desc: 'Spacious Sedan', basePrice: 550, icon: <DirectionsCarIcon sx={{ fontSize: 28, color: '#3B82F6' }} /> },
]

export default function TaxiRideBooking({ onBack }) {
  const [serviceType, setServiceType] = useState('TAXI') // TAXI, LUGGAGE
  const [selectedVehicle, setSelectedVehicle] = useState('CAR_AC')
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropoffAddress, setDropoffAddress] = useState('')
  const [customerFare, setCustomerFare] = useState('450')
  const [customerNotes, setCustomerNotes] = useState('')
  
  // Luggage fields
  const [recipientName, setRecipientName] = useState('')
  const [recipientPhone, setRecipientPhone] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [packageWeight, setPackageWeight] = useState('')

  const [requestingRide, setRequestingRide] = useState(false)
  const [activeRide, setActiveRide] = useState(null)
  const [loadingActiveRide, setLoadingActiveRide] = useState(true)
  const [acceptingBidId, setAcceptingBidId] = useState(null)

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
    } finally {
      setLoadingActiveRide(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveRide()
    const timer = setInterval(fetchActiveRide, 4000)
    return () => clearInterval(timer)
  }, [fetchActiveRide])

  // Update suggested fare when vehicle changes
  const handleSelectVehicle = (vehId) => {
    setSelectedVehicle(vehId)
    const veh = VEHICLE_CATEGORIES.find(v => v.id === vehId)
    if (veh) setCustomerFare(String(veh.basePrice))
  }

  // Create Ride / Luggage Request
  const handleRequestRide = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Please enter both pickup and dropoff locations')
      return
    }

    if (!customerFare || Number(customerFare) <= 0) {
      toast.error('Please propose a valid fare')
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
          dropoffAddress,
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
        toast.success(serviceType === 'LUGGAGE' ? 'Luggage delivery request published!' : 'Ride request published! Waiting for driver bids...')
        setActiveRide(data.data)
        fetchActiveRide()
      } else {
        toast.error(data.error || 'Failed to request ride')
      }
    } catch (err) {
      toast.error('Error creating ride: ' + err.message)
    } finally {
      setRequestingRide(false)
    }
  }

  // Accept a driver's bid
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
        toast.success('Driver confirmed! They are on their way.')
        fetchActiveRide()
      } else {
        toast.error(data.error || 'Failed to accept bid')
      }
    } catch (err) {
      toast.error('Error accepting driver: ' + err.message)
    } finally {
      setAcceptingBidId(null)
    }
  }

  // Cancel active ride
  const handleCancelRide = async () => {
    if (!activeRide) return
    if (!window.confirm('Are you sure you want to cancel this ride request?')) return
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
    <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* ─── ACTIVE RIDE SCREEN ─── */}
      {activeRide ? (
        <Card
          sx={{
            borderRadius: 3.5,
            bgcolor: '#0F172A',
            color: '#fff',
            boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
            border: '2px solid #38BDF8',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box sx={{ p: 3, bgcolor: '#0284C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {activeRide.serviceType === 'LUGGAGE' ? <LuggageIcon sx={{ fontSize: 32 }} /> : <LocalTaxiIcon sx={{ fontSize: 32 }} />}
              <div>
                <Typography variant="h6" fontWeight={800}>
                  {activeRide.serviceType === 'LUGGAGE' ? 'LUGGAGE & PARCEL DROP' : 'INDRIVE CITY TAXI'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#E0F2FE' }}>
                  {activeRide.status === 'SEARCHING' ? 'Finding nearby drivers...' : `Status: ${activeRide.status}`}
                </Typography>
              </div>
            </Box>
            <Button
              variant="contained"
              size="small"
              onClick={handleCancelRide}
              sx={{ bgcolor: '#DC2626', color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#b91c1c' } }}
            >
              Cancel Request
            </Button>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* Route Summary */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', mb: 3 }}>
              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', gap: 1.2 }}>
                  <LocationOnIcon sx={{ color: '#22C55E' }} />
                  <div>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>PICKUP</Typography>
                    <Typography variant="body2" fontWeight={600}>{activeRide.pickupAddress}</Typography>
                  </div>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.2 }}>
                  <NavigationIcon sx={{ color: '#EF4444' }} />
                  <div>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>DESTINATION</Typography>
                    <Typography variant="body2" fontWeight={600}>{activeRide.dropoffAddress}</Typography>
                  </div>
                </Box>
              </Stack>
            </Box>

            {/* ── STATE 1: SEARCHING & RECEIVING DRIVER BIDS ── */}
            {activeRide.status === 'SEARCHING' && (
              <Box>
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CircularProgress size={36} sx={{ color: '#38BDF8', mb: 1.5 }} />
                  <Typography variant="h6" fontWeight={800}>
                    Broadcasting Your Fare: Rs. {Number(activeRide.customerFare).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                    Nearby drivers are reviewing your route. Bids will appear below in real time.
                  </Typography>
                </Box>

                <Divider sx={{ my: 2.5, borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* Driver Bids Stream */}
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#38BDF8', mb: 2 }}>
                  INCOMING DRIVER OFFERS ({activeRide.driverBids?.length || 0})
                </Typography>

                {(!activeRide.driverBids || activeRide.driverBids.length === 0) ? (
                  <Box sx={{ p: 3, textAlign: 'center', borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.15)' }}>
                    <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                      Waiting for driver offers... (usually takes 10–30 seconds)
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {activeRide.driverBids.map((bid) => (
                      <Card
                        key={bid.id}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          bgcolor: 'rgba(255,255,255,0.08)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: '#fff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1.5,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar src={bid.driver?.image} sx={{ bgcolor: BRAND, width: 44, height: 44 }}>
                            {bid.driver?.name?.charAt(0) || 'D'}
                          </Avatar>
                          <div>
                            <Typography variant="subtitle1" fontWeight={800}>
                              {bid.driver?.name || 'Driver'}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', color: '#F59E0B' }}>
                                <StarIcon sx={{ fontSize: 16 }} />
                                <Typography variant="caption" fontWeight={700}>4.9</Typography>
                              </Box>
                              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                                • Arriving in ~{bid.etaMinutes || 5} min
                              </Typography>
                            </Box>
                          </div>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>OFFERED FARE</Typography>
                            <Typography variant="h6" fontWeight={900} sx={{ color: '#22C55E' }}>
                              Rs. {Number(bid.bidAmount).toLocaleString()}
                            </Typography>
                          </Box>
                          <Button
                            variant="contained"
                            onClick={() => handleAcceptDriverBid(bid.id)}
                            disabled={acceptingBidId === bid.id}
                            sx={{
                              bgcolor: '#22C55E',
                              color: '#fff',
                              fontWeight: 800,
                              textTransform: 'none',
                              px: 3,
                              py: 1,
                              borderRadius: 2,
                              '&:hover': { bgcolor: '#16a34a' },
                            }}
                          >
                            {acceptingBidId === bid.id ? 'Accepting...' : 'Accept Driver'}
                          </Button>
                        </Box>
                      </Card>
                    ))}
                  </Stack>
                )}
              </Box>
            )}

            {/* ── STATE 2: DRIVER ASSIGNED & TRIP IN PROGRESS ── */}
            {['ACCEPTED', 'DRIVER_ARRIVED', 'IN_PROGRESS'].includes(activeRide.status) && (
              <Box>
                {/* OTP Security Banner */}
                <Box sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#064E3B', border: '1px solid #10B981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LockIcon sx={{ color: '#6EE7B7' }} />
                    <div>
                      <Typography variant="caption" sx={{ color: '#A7F3D0', fontWeight: 700 }}>
                        4-DIGIT RIDE PIN (SHARE WITH DRIVER UPON ARRIVAL)
                      </Typography>
                      <Typography variant="h5" fontWeight={900} sx={{ color: '#fff', letterSpacing: 3 }}>
                        {activeRide.rideOtp || '••••'}
                      </Typography>
                    </div>
                  </Box>
                  <Chip
                    label={activeRide.status === 'DRIVER_ARRIVED' ? 'Driver is Outside!' : activeRide.status === 'IN_PROGRESS' ? 'Trip in Transit' : 'Driver Arriving'}
                    sx={{ bgcolor: '#fff', color: '#064E3B', fontWeight: 800 }}
                  />
                </Box>

                {/* Driver Info Card */}
                <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={activeRide.driver?.image} sx={{ width: 56, height: 56, bgcolor: BRAND }}>
                      {activeRide.driver?.name?.charAt(0) || 'D'}
                    </Avatar>
                    <div>
                      <Typography variant="h6" fontWeight={800}>
                        {activeRide.driver?.name || 'Driver'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#38BDF8' }}>
                        {activeRide.driver?.driverProfile?.vehicleType || 'Verified Driver'} • Rs. {Number(activeRide.finalFare || activeRide.customerFare).toLocaleString()}
                      </Typography>
                    </div>
                  </Box>

                  {activeRide.driver?.phoneNumber && (
                    <Button
                      variant="contained"
                      startIcon={<PhoneIcon />}
                      href={`tel:${activeRide.driver.phoneNumber}`}
                      sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 800, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#16a34a' } }}
                    >
                      Call Driver
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ─── NEW RIDE BOOKING FORM (INDRIVE STYLE) ─── */
        <Card sx={{ borderRadius: 3.5, border: '1px solid #E2E8F0', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          {/* Service Switcher Banner */}
          <Box sx={{ p: 3, bgcolor: '#0F172A', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <div>
              <Typography variant="h5" fontWeight={800}>
                InDrive Ride & Luggage Dispatch
              </Typography>
              <Typography variant="body2" sx={{ color: '#94A3B8' }}>
                Propose your own fare, choose your driver, and save money.
              </Typography>
            </div>

            {/* Mode Switcher */}
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<LocalTaxiIcon sx={{ color: serviceType === 'TAXI' ? '#fff !important' : 'inherit' }} />}
                label="City Taxi"
                clickable
                onClick={() => setServiceType('TAXI')}
                sx={{
                  fontWeight: 800,
                  bgcolor: serviceType === 'TAXI' ? BRAND : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  px: 1.5,
                  py: 2.2,
                }}
              />
              <Chip
                icon={<LuggageIcon sx={{ color: serviceType === 'LUGGAGE' ? '#fff !important' : 'inherit' }} />}
                label="Luggage Drop"
                clickable
                onClick={() => setServiceType('LUGGAGE')}
                sx={{
                  fontWeight: 800,
                  bgcolor: serviceType === 'LUGGAGE' ? '#7C3AED' : 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  px: 1.5,
                  py: 2.2,
                }}
              />
            </Stack>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack spacing={3}>
              {/* Pickup & Destination */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A" sx={{ mb: 1.5 }}>
                  ROUTE DETAILS
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    fullWidth
                    label="Pickup Address"
                    placeholder="e.g. Liberty Market, Main Boulevard Gulberg III"
                    value={pickupAddress}
                    onChange={e => setPickupAddress(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><LocationOnIcon sx={{ color: '#16A34A' }} /></InputAdornment>,
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Dropoff Destination"
                    placeholder="e.g. Packages Mall, Walton Road, Lahore"
                    value={dropoffAddress}
                    onChange={e => setDropoffAddress(e.target.value)}
                    InputProps={{
                      startAdornment: <InputAdornment position="start"><NavigationIcon sx={{ color: '#DC2626' }} /></InputAdornment>,
                    }}
                  />
                </Stack>
              </Box>

              {/* Vehicle Selection for Taxi */}
              {serviceType === 'TAXI' && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="#0F172A" sx={{ mb: 1.5 }}>
                    CHOOSE RIDE CATEGORY
                  </Typography>
                  <Grid container spacing={2}>
                    {VEHICLE_CATEGORIES.map((veh) => (
                      <Grid item xs={6} sm={3} key={veh.id}>
                        <Card
                          onClick={() => handleSelectVehicle(veh.id)}
                          sx={{
                            p: 2,
                            borderRadius: 2.5,
                            textAlign: 'center',
                            cursor: 'pointer',
                            border: selectedVehicle === veh.id ? `2px solid ${BRAND}` : '1px solid #E2E8F0',
                            bgcolor: selectedVehicle === veh.id ? '#F0FDF4' : '#fff',
                            transition: 'all 0.2s',
                            '&:hover': { transform: 'translateY(-2px)' },
                          }}
                        >
                          <Box sx={{ color: selectedVehicle === veh.id ? BRAND : '#64748B', mb: 0.5 }}>
                            {veh.icon}
                          </Box>
                          <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                            {veh.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {veh.desc}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {/* Luggage Details if Luggage Mode */}
              {serviceType === 'LUGGAGE' && (
                <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#7C3AED" sx={{ mb: 1.5 }}>
                    LUGGAGE & RECIPIENT INFORMATION
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Recipient Name"
                        placeholder="e.g. Muhammad Ali"
                        value={recipientName}
                        onChange={e => setRecipientName(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Recipient Phone"
                        placeholder="e.g. 03001234567"
                        value={recipientPhone}
                        onChange={e => setRecipientPhone(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Luggage / Parcel Description"
                        placeholder="e.g. 2 Suitcases, Laptop box, etc."
                        value={packageDescription}
                        onChange={e => setPackageDescription(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Est. Weight (kg)"
                        placeholder="e.g. 15 kg"
                        value={packageWeight}
                        onChange={e => setPackageWeight(e.target.value)}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Offer Your Fare (InDrive Core Feature) */}
              <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#065F46" sx={{ mb: 1 }}>
                  OFFER YOUR FARE (INDRIVE BIDDING)
                </Typography>
                <Typography variant="caption" color="#047857" sx={{ display: 'block', mb: 1.5 }}>
                  Enter the price you want to pay. Drivers will see your offer and either accept it or make counter-offers.
                </Typography>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Your Offered Fare"
                      value={customerFare}
                      onChange={e => setCustomerFare(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Typography fontWeight={800} color="#065F46">Rs.</Typography></InputAdornment>,
                        sx: { bgcolor: '#fff', fontWeight: 800, fontSize: '1.2rem', borderRadius: 2 },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Optional Note for Driver"
                      placeholder="e.g. 2 bags, wait at gate 1"
                      value={customerNotes}
                      onChange={e => setCustomerNotes(e.target.value)}
                      sx={{ bgcolor: '#fff', borderRadius: 1.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Submit Button */}
              <Button
                variant="contained"
                fullWidth
                onClick={handleRequestRide}
                disabled={requestingRide}
                startIcon={requestingRide ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <LocalTaxiIcon />}
                sx={{
                  bgcolor: BRAND,
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '1rem',
                  textTransform: 'none',
                  py: 1.5,
                  borderRadius: 2.5,
                  boxShadow: '0 4px 18px rgba(57,119,42,0.3)',
                  '&:hover': { bgcolor: '#2d5e21' },
                }}
              >
                {requestingRide ? 'Publishing Request...' : serviceType === 'LUGGAGE' ? `Request Luggage Drop (Rs. ${Number(customerFare || 0).toLocaleString()})` : `Find Drivers (Offer Rs. ${Number(customerFare || 0).toLocaleString()})`}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
