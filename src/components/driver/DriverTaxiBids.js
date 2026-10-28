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
import toast from 'react-hot-toast'

import LocalTaxiIcon from '@mui/icons-material/LocalTaxi'
import LuggageIcon from '@mui/icons-material/Luggage'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import NavigationIcon from '@mui/icons-material/Navigation'
import PhoneIcon from '@mui/icons-material/Phone'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import PinIcon from '@mui/icons-material/Pin'

const BRAND = '#39772A'

export default function DriverTaxiBids({ driverId, isOnDuty = true }) {
  const [activeTrip, setActiveTrip] = useState(null)
  const [availableRides, setAvailableRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('ALL') // ALL, TAXI, LUGGAGE
  const [bidModalRide, setBidModalRide] = useState(null)
  const [counterAmount, setCounterAmount] = useState('')
  const [etaMinutes, setEtaMinutes] = useState(5)
  const [submittingBid, setSubmittingBid] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const fetchRides = useCallback(async () => {
    try {
      const url = `/api/rides?role=DRIVER${driverId ? `&driverId=${driverId}` : ''}${serviceFilter !== 'ALL' ? `&serviceType=${serviceFilter}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setActiveTrip(data.activeTrip)
        setAvailableRides(data.availableRides || [])
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false)
    }
  }, [driverId, serviceFilter])

  useEffect(() => {
    fetchRides()
    const timer = setInterval(fetchRides, 6000)
    return () => clearInterval(timer)
  }, [fetchRides])

  // Accept customer proposed fare directly
  const handleQuickAccept = async (ride) => {
    try {
      setSubmittingBid(true)
      const res = await fetch(`/api/rides/${ride.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidAmount: ride.customerFare,
          etaMinutes: 5,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Bid placed for Rs. ${Number(ride.customerFare).toLocaleString()}! Waiting for customer confirmation.`)
        fetchRides()
      } else {
        toast.error(data.error || 'Failed to submit bid')
      }
    } catch (err) {
      toast.error('Error submitting bid: ' + err.message)
    } finally {
      setSubmittingBid(false)
    }
  }

  // Open counter bid modal
  const openCounterModal = (ride) => {
    setBidModalRide(ride)
    setCounterAmount(String(Math.round(Number(ride.customerFare) * 1.15)))
    setEtaMinutes(5)
  }

  // Submit custom counter bid
  const handleSubmitCounterBid = async () => {
    if (!counterAmount || Number(counterAmount) <= 0) {
      toast.error('Please enter a valid counter-fare')
      return
    }

    try {
      setSubmittingBid(true)
      const res = await fetch(`/api/rides/${bidModalRide.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bidAmount: Number(counterAmount),
          etaMinutes: Number(etaMinutes) || 5,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Counter-fare of Rs. ${Number(counterAmount).toLocaleString()} sent to customer!`)
        setBidModalRide(null)
        fetchRides()
      } else {
        toast.error(data.error || 'Failed to submit counter-fare')
      }
    } catch (err) {
      toast.error('Error submitting bid: ' + err.message)
    } finally {
      setSubmittingBid(false)
    }
  }

  // Driver action on active trip
  const handleActiveTripAction = async (action, extraData = {}) => {
    if (!activeTrip) return
    try {
      setVerifyingOtp(true)
      const res = await fetch(`/api/rides/${activeTrip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extraData }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Trip updated')
        setOtpInput('')
        fetchRides()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (err) {
      toast.error('Failed to update trip: ' + err.message)
    } finally {
      setVerifyingOtp(false)
    }
  }

  return (
    <Box>
      {/* ─── ACTIVE IN-PROGRESS TRIP HUD ─── */}
      {activeTrip && (
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            bgcolor: '#0F172A',
            color: '#fff',
            boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
            border: '2px solid #38BDF8',
          }}
        >
          <Box sx={{ p: 2.5, bgcolor: '#0284C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {activeTrip.serviceType === 'LUGGAGE' ? <LuggageIcon sx={{ fontSize: 28 }} /> : <LocalTaxiIcon sx={{ fontSize: 28 }} />}
              <div>
                <Typography variant="h6" fontWeight={800}>
                  {activeTrip.serviceType === 'LUGGAGE' ? 'ACTIVE LUGGAGE DELIVERY' : 'ACTIVE TAXI RIDE'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#E0F2FE' }}>
                  Status: <strong>{activeTrip.status}</strong> • Agreed Fare: <strong>Rs. {Number(activeTrip.finalFare || activeTrip.customerFare).toLocaleString()}</strong>
                </Typography>
              </div>
            </Box>
            <Chip
              label={activeTrip.status}
              sx={{ bgcolor: '#fff', color: '#0369A1', fontWeight: 800, fontSize: '0.75rem' }}
            />
          </Box>

          <CardContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Pickup & Destination */}
              <Grid item xs={12} md={7}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <LocationOnIcon sx={{ color: '#22C55E', mt: 0.3 }} />
                    <div>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                        PICKUP LOCATION
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {activeTrip.pickupAddress}
                      </Typography>
                    </div>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <NavigationIcon sx={{ color: '#EF4444', mt: 0.3 }} />
                    <div>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700 }}>
                        DROPOFF DESTINATION
                      </Typography>
                      <Typography variant="body1" fontWeight={700}>
                        {activeTrip.dropoffAddress}
                      </Typography>
                    </div>
                  </Box>

                  {/* Luggage Details if applicable */}
                  {activeTrip.serviceType === 'LUGGAGE' && (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 800, display: 'block', mb: 0.5 }}>
                        LUGGAGE SPECIFICATIONS
                      </Typography>
                      <Typography variant="body2">
                        Recipient: <strong>{activeTrip.recipientName || 'Recipient'}</strong> ({activeTrip.recipientPhone || 'No Phone'})
                      </Typography>
                      {activeTrip.packageDescription && (
                        <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block' }}>
                          Items: {activeTrip.packageDescription} {activeTrip.packageWeight && `• Weight: ${activeTrip.packageWeight}`}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Stack>
              </Grid>

              {/* Passenger & Action Controls */}
              <Grid item xs={12} md={5}>
                <Box sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, display: 'block', mb: 1 }}>
                      CUSTOMER CONTACT
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <div>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {activeTrip.customer?.name || 'Customer'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#38BDF8' }}>
                          {activeTrip.customer?.phoneNumber || 'No phone'}
                        </Typography>
                      </div>
                      {activeTrip.customer?.phoneNumber && (
                        <Button
                          variant="contained"
                          size="small"
                          href={`tel:${activeTrip.customer.phoneNumber}`}
                          startIcon={<PhoneIcon />}
                          sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#16a34a' } }}
                        >
                          Call
                        </Button>
                      )}
                    </Box>
                  </div>

                  {/* Lifecycle Buttons */}
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {activeTrip.status === 'ACCEPTED' && (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => handleActiveTripAction('DRIVER_ARRIVED')}
                        disabled={verifyingOtp}
                        sx={{ bgcolor: '#F59E0B', color: '#fff', fontWeight: 800, textTransform: 'none', py: 1.2 }}
                      >
                        I Have Arrived at Pickup
                      </Button>
                    )}

                    {activeTrip.status === 'DRIVER_ARRIVED' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          size="small"
                          placeholder="Enter 4-Digit OTP"
                          value={otpInput}
                          onChange={e => setOtpInput(e.target.value)}
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><PinIcon sx={{ color: '#94A3B8' }} /></InputAdornment>,
                            sx: { bgcolor: '#fff', borderRadius: 1.5 },
                          }}
                        />
                        <Button
                          variant="contained"
                          onClick={() => handleActiveTripAction('START_TRIP', { enteredOtp: otpInput })}
                          disabled={verifyingOtp || !otpInput}
                          sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 800, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#16a34a' } }}
                        >
                          {verifyingOtp ? <CircularProgress size={16} /> : 'Start Trip'}
                        </Button>
                      </Box>
                    )}

                    {activeTrip.status === 'IN_PROGRESS' && (
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleActiveTripAction('COMPLETE_TRIP')}
                        disabled={verifyingOtp}
                        sx={{ bgcolor: '#22C55E', color: '#fff', fontWeight: 800, textTransform: 'none', py: 1.3, boxShadow: '0 4px 14px rgba(34,197,94,0.4)', '&:hover': { bgcolor: '#16a34a' } }}
                      >
                        {verifyingOtp ? 'Completing...' : 'Complete Trip & Collect Cash'}
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ─── AVAILABLE RIDES & LUGGAGE BIDS POOL ─── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" fontWeight={800} color="#0F172A">
            InDrive Live Ride Requests ({availableRides.length})
          </Typography>
          <IconButton size="small" onClick={fetchRides} title="Refresh">
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Filter buttons */}
        <Stack direction="row" spacing={1}>
          <Chip
            label="All Requests"
            clickable
            onClick={() => setServiceFilter('ALL')}
            sx={{ fontWeight: 700, bgcolor: serviceFilter === 'ALL' ? BRAND : '#F1F5F9', color: serviceFilter === 'ALL' ? '#fff' : '#475569' }}
          />
          <Chip
            icon={<LocalTaxiIcon fontSize="small" />}
            label="City Taxi"
            clickable
            onClick={() => setServiceFilter('TAXI')}
            sx={{ fontWeight: 700, bgcolor: serviceFilter === 'TAXI' ? BRAND : '#F1F5F9', color: serviceFilter === 'TAXI' ? '#fff' : '#475569' }}
          />
          <Chip
            icon={<LuggageIcon fontSize="small" />}
            label="Luggage Drop"
            clickable
            onClick={() => setServiceFilter('LUGGAGE')}
            sx={{ fontWeight: 700, bgcolor: serviceFilter === 'LUGGAGE' ? BRAND : '#F1F5F9', color: serviceFilter === 'LUGGAGE' ? '#fff' : '#475569' }}
          />
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: BRAND }} />
        </Box>
      ) : availableRides.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1' }}>
          <LocalTaxiIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="#334155">
            No pending ride or luggage requests nearby
          </Typography>
          <Typography variant="body2" color="text.secondary">
            New customer requests appear here in real time. Keep your status Online.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {availableRides.map((ride) => {
            const hasMyBid = ride.driverBids && ride.driverBids.length > 0
            const myBid = hasMyBid ? ride.driverBids[0] : null

            return (
              <Grid item xs={12} md={6} key={ride.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                    p: 2.5,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
                  }}
                >
                  {/* Top Bar: Service Type & Offered Fare */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={ride.serviceType === 'LUGGAGE' ? <LuggageIcon fontSize="small" /> : <LocalTaxiIcon fontSize="small" />}
                        label={ride.serviceType === 'LUGGAGE' ? 'Luggage Drop' : `Taxi: ${ride.rideCategory}`}
                        size="small"
                        sx={{
                          bgcolor: ride.serviceType === 'LUGGAGE' ? '#EDE9FE' : '#E0F2FE',
                          color: ride.serviceType === 'LUGGAGE' ? '#6D28D9' : '#0369A1',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                        }}
                      />
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                        ~{ride.estimatedDistanceKm || 5} km
                      </Typography>
                    </Box>

                    {/* Customer Offer Fare */}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block' }}>
                        CUSTOMER FARE
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: '#16A34A', lineHeight: 1 }}>
                        Rs. {Number(ride.customerFare).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Route */}
                  <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <LocationOnIcon sx={{ color: '#16A34A', fontSize: 20, mt: 0.2 }} />
                      <Typography variant="body2" fontWeight={600} color="#1E293B">
                        {ride.pickupAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <NavigationIcon sx={{ color: '#DC2626', fontSize: 20, mt: 0.2 }} />
                      <Typography variant="body2" fontWeight={600} color="#1E293B">
                        {ride.dropoffAddress}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Notes / Luggage details */}
                  {ride.customerNotes && (
                    <Box sx={{ p: 1.2, mb: 2, borderRadius: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <Typography variant="caption" color="#475569">
                        Note: <strong>{ride.customerNotes}</strong>
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* Action Buttons */}
                  {hasMyBid ? (
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', textAlign: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={800} color="#065F46">
                        ✓ Bid Placed: Rs. {Number(myBid.bidAmount).toLocaleString()} ({myBid.etaMinutes} min ETA)
                      </Typography>
                      <Typography variant="caption" color="#047857">
                        Waiting for customer to select your bid...
                      </Typography>
                    </Box>
                  ) : (
                    <Grid container spacing={1.5}>
                      <Grid item xs={6}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => handleQuickAccept(ride)}
                          disabled={submittingBid}
                          sx={{
                            bgcolor: '#16A34A',
                            color: '#fff',
                            fontWeight: 800,
                            textTransform: 'none',
                            py: 1,
                            borderRadius: 2,
                            '&:hover': { bgcolor: '#15803d' },
                          }}
                        >
                          Accept Rs. {Number(ride.customerFare).toLocaleString()}
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => openCounterModal(ride)}
                          disabled={submittingBid}
                          sx={{
                            borderColor: BRAND,
                            color: BRAND,
                            fontWeight: 800,
                            textTransform: 'none',
                            py: 1,
                            borderRadius: 2,
                            '&:hover': { borderColor: '#2d5e21', bgcolor: '#F0FDF4' },
                          }}
                        >
                          Offer Counter-Fare
                        </Button>
                      </Grid>
                    </Grid>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      {/* ─── COUNTER BID DIALOG ─── */}
      <Dialog open={Boolean(bidModalRide)} onClose={() => setBidModalRide(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Propose Counter-Fare
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFC' }}>
              <Typography variant="caption" color="text.secondary">
                Customer proposed: <strong>Rs. {Number(bidModalRide?.customerFare || 0).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {bidModalRide?.pickupAddress} ➔ {bidModalRide?.dropoffAddress}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Your Counter-Fare (Rs.)"
              type="number"
              value={counterAmount}
              onChange={e => setCounterAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
              }}
            />

            <TextField
              fullWidth
              label="Arrival Time (ETA in minutes)"
              type="number"
              value={etaMinutes}
              onChange={e => setEtaMinutes(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">min</InputAdornment>,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setBidModalRide(null)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCounterBid}
            disabled={submittingBid}
            sx={{ bgcolor: BRAND, fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#2d5e21' } }}
          >
            {submittingBid ? 'Sending...' : 'Send Counter Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
