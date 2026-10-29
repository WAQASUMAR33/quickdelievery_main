'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

import {
  DEFAULT_RAPIDRIDE_SETTINGS,
  normalizeRapidRideSettings,
  calculateDriverPayout,
} from '@/lib/rapidRideFormula'

import LocalTaxiIcon from '@mui/icons-material/LocalTaxi'
import LuggageIcon from '@mui/icons-material/Luggage'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import NavigationIcon from '@mui/icons-material/Navigation'
import PhoneIcon from '@mui/icons-material/Phone'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import RefreshIcon from '@mui/icons-material/Refresh'
import PinIcon from '@mui/icons-material/Pin'

const BRAND = '#39772A'
const BRAND_DARK_MODE = '#4ade80'

export default function DriverTaxiBids({ driverId }) {
  const [activeTrip, setActiveTrip] = useState(null)
  const [availableRides, setAvailableRides] = useState([])
  const [fareSettings, setFareSettings] = useState(() => normalizeRapidRideSettings(DEFAULT_RAPIDRIDE_SETTINGS))
  const [loading, setLoading] = useState(true)
  const [serviceFilter, setServiceFilter] = useState('ALL') // ALL, TAXI, LUGGAGE
  const [bidModalRide, setBidModalRide] = useState(null)
  const [counterAmount, setCounterAmount] = useState('')
  const [etaMinutes, setEtaMinutes] = useState(5)
  const [submittingBid, setSubmittingBid] = useState(false)
  const [otpInput, setOtpInput] = useState('')
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const cur = fareSettings.currency || 'Rs.'

  const fetchRides = useCallback(async () => {
    try {
      const url = `/api/rides?role=DRIVER${driverId ? `&driverId=${driverId}` : ''}${serviceFilter !== 'ALL' ? `&serviceType=${serviceFilter}` : ''}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setActiveTrip(data.activeTrip)
        setAvailableRides(data.availableRides || [])
        if (data.settings) {
          setFareSettings(normalizeRapidRideSettings(data.settings))
        }
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
        toast.success(`RapidRide bid placed for ${cur} ${Number(ride.customerFare).toLocaleString()}! Waiting for customer confirmation.`)
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

  // Open counter bid modal using Admin-configured defaultCounterMarkupPercent
  const openCounterModal = (ride) => {
    const markupPct = fareSettings.bidding?.defaultCounterMarkupPercent ?? 15
    setBidModalRide(ride)
    setCounterAmount(String(Math.round(Number(ride.customerFare) * (1 + markupPct / 100))))
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
        toast.success(`Counter-fare of ${cur} ${Number(counterAmount).toLocaleString()} sent to customer!`)
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

  const counterPayoutPreview = useMemo(() => {
    return calculateDriverPayout(Number(counterAmount) || 0, fareSettings)
  }, [counterAmount, fareSettings])

  const activeTripPayout = useMemo(() => {
    if (!activeTrip) return null
    return calculateDriverPayout(Number(activeTrip.finalFare || activeTrip.customerFare) || 0, fareSettings)
  }, [activeTrip, fareSettings])

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
          <Box sx={{ p: 2.5, bgcolor: '#0284C7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {activeTrip.serviceType === 'LUGGAGE' ? <LuggageIcon sx={{ fontSize: 28, color: '#fff' }} /> : <LocalTaxiIcon sx={{ fontSize: 28, color: '#fff' }} />}
              <div>
                <Typography variant="h6" fontWeight={800} color="#fff">
                  {activeTrip.serviceType === 'LUGGAGE' ? 'ACTIVE RAPIDRIDE BAGGAGE DELIVERY' : 'ACTIVE RAPIDRIDE TAXI TRIP'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#E0F2FE' }}>
                  Status: <strong>{activeTrip.status}</strong> • Agreed Fare: <strong>{cur} {Number(activeTrip.finalFare || activeTrip.customerFare).toLocaleString()}</strong>
                  {activeTripPayout && (
                    <> • Your Net: <strong>{cur} {activeTripPayout.driverNetEarning.toLocaleString()}</strong> (Platform Fee: {cur} {activeTripPayout.totalPlatformFee})</>
                  )}
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
                      <Typography variant="body1" fontWeight={700} color="#fff">
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
                      <Typography variant="body1" fontWeight={700} color="#fff">
                        {activeTrip.dropoffAddress}
                      </Typography>
                    </div>
                  </Box>

                  {/* Baggage Details if applicable */}
                  {activeTrip.serviceType === 'LUGGAGE' && (
                    <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography variant="caption" sx={{ color: '#38BDF8', fontWeight: 800, display: 'block', mb: 0.5 }}>
                        BAGGAGE SPECIFICATIONS
                      </Typography>
                      <Typography variant="body2" color="#fff">
                        Recipient: <strong>{activeTrip.recipientName || 'Recipient'}</strong> ({activeTrip.recipientPhone || 'No Phone'})
                      </Typography>
                      {(activeTrip.packageDescription || activeTrip.packageWeight || activeTrip.isFragile) && (
                        <Typography variant="caption" sx={{ color: '#CBD5E1', display: 'block' }}>
                          {activeTrip.packageDescription || 'Parcel'}
                          {activeTrip.packageWeight ? ` • Weight: ${activeTrip.packageWeight} kg` : ''}
                          {activeTrip.isFragile ? ' • ⚠️ Fragile Care' : ''}
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
                        <Typography variant="subtitle1" fontWeight={800} color="#fff">
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
                            sx: {
                              bgcolor: 'rgba(255,255,255,0.08)',
                              color: '#fff',
                              borderRadius: 1.5,
                              '& input': { color: '#fff' },
                            },
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

      {/* ─── AVAILABLE RAPIDRIDE & BAGGAGE BIDS POOL ─── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" fontWeight={800} color="text.primary">
            RapidRide Live Ride Requests ({availableRides.length})
          </Typography>
          <Chip
            label={`Basic Fee: ${cur} ${fareSettings.platformFee.basicPlatformFee} • ${fareSettings.platformFee.platformCommissionPercent}% Commission`}
            size="small"
            sx={{
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.14)' : '#DCFCE7',
              color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK_MODE : '#15803D',
              fontWeight: 700,
              fontSize: '0.7rem',
            }}
          />
          <IconButton size="small" onClick={fetchRides} title="Refresh" sx={{ color: 'text.secondary' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Filter buttons */}
        <Stack direction="row" spacing={1}>
          {[
            { id: 'ALL', label: 'All Requests', icon: undefined },
            { id: 'TAXI', label: 'RapidRide Taxi', icon: <LocalTaxiIcon fontSize="small" /> },
            { id: 'LUGGAGE', label: 'Baggage Drop', icon: <LuggageIcon fontSize="small" /> },
          ].map((f) => {
            const selected = serviceFilter === f.id
            return (
              <Chip
                key={f.id}
                icon={f.icon}
                label={f.label}
                clickable
                onClick={() => setServiceFilter(f.id)}
                sx={{
                  fontWeight: 700,
                  bgcolor: (theme) => selected
                    ? BRAND
                    : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9'),
                  color: (theme) => selected
                    ? '#fff'
                    : (theme.palette.mode === 'dark' ? '#CBD5E1' : '#475569'),
                  '& .MuiChip-icon': {
                    color: (theme) => selected
                      ? '#fff'
                      : (theme.palette.mode === 'dark' ? '#CBD5E1' : '#475569'),
                  },
                }}
              />
            )
          })}
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: BRAND }} />
        </Box>
      ) : availableRides.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
          <LocalTaxiIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="text.primary">
            No pending RapidRide or baggage requests nearby
          </Typography>
          <Typography variant="body2" color="text.secondary">
            New customer RapidRide offers appear here in real time. Keep your status Online.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {availableRides.map((ride) => {
            const hasMyBid = ride.driverBids && ride.driverBids.length > 0
            const myBid = hasMyBid ? ride.driverBids[0] : null
            const payout = calculateDriverPayout(Number(ride.customerFare) || 0, fareSettings)

            return (
              <Grid item xs={12} md={6} key={ride.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                    p: 2.5,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
                  }}
                >
                  {/* Top Bar: Service Type & Offered Fare */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={ride.serviceType === 'LUGGAGE' ? <LuggageIcon fontSize="small" /> : <LocalTaxiIcon fontSize="small" />}
                        label={ride.serviceType === 'LUGGAGE' ? 'Baggage Drop' : `RapidRide: ${ride.rideCategory}`}
                        size="small"
                        sx={{
                          bgcolor: (theme) => theme.palette.mode === 'dark'
                            ? (ride.serviceType === 'LUGGAGE' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(56, 189, 248, 0.18)')
                            : (ride.serviceType === 'LUGGAGE' ? '#EDE9FE' : '#E0F2FE'),
                          color: (theme) => theme.palette.mode === 'dark'
                            ? (ride.serviceType === 'LUGGAGE' ? '#C4B5FD' : '#7DD3FC')
                            : (ride.serviceType === 'LUGGAGE' ? '#6D28D9' : '#0369A1'),
                          fontWeight: 800,
                          fontSize: '0.75rem',
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        ~{ride.estimatedDistanceKm || 5} km
                      </Typography>
                      {ride.packageWeight && (
                        <Chip label={`${ride.packageWeight} kg`} size="small" variant="outlined" sx={{ height: 20, fontSize: 10.5 }} />
                      )}
                      {ride.isFragile && (
                        <Chip label="Fragile" size="small" color="warning" variant="outlined" sx={{ height: 20, fontSize: 10.5 }} />
                      )}
                    </Box>

                    {/* Customer Offer Fare & Driver Net */}
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>
                        CUSTOMER FARE
                      </Typography>
                      <Typography variant="h6" fontWeight={900} sx={{ color: '#22C55E', lineHeight: 1.1 }}>
                        {cur} {Number(ride.customerFare).toLocaleString()}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                        Your Net: <strong>{cur} {payout.driverNetEarning}</strong> (Fee: {cur} {payout.totalPlatformFee})
                      </Typography>
                    </Box>
                  </Box>

                  {/* Route */}
                  <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <LocationOnIcon sx={{ color: '#22C55E', fontSize: 20, mt: 0.2 }} />
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {ride.pickupAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.2 }}>
                      <NavigationIcon sx={{ color: '#EF4444', fontSize: 20, mt: 0.2 }} />
                      <Typography variant="body2" fontWeight={600} color="text.primary">
                        {ride.dropoffAddress}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Notes / Baggage details */}
                  {ride.customerNotes && (
                    <Box sx={{
                      p: 1.2,
                      mb: 2,
                      borderRadius: 1.5,
                      bgcolor: 'grey.50',
                      border: '1px solid',
                      borderColor: 'divider',
                    }}>
                      <Typography variant="caption" color="text.secondary">
                        Note: <strong style={{ color: 'inherit' }}>{ride.customerNotes}</strong>
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ mb: 2 }} />

                  {/* Action Buttons */}
                  {hasMyBid ? (
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                      border: '1px solid',
                      borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(52, 211, 153, 0.35)' : '#A7F3D0',
                      textAlign: 'center',
                    }}>
                      <Typography
                        variant="subtitle2"
                        fontWeight={800}
                        sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#34D399' : '#065F46' }}
                      >
                        ✓ Bid Placed: {cur} {Number(myBid.bidAmount).toLocaleString()} ({myBid.etaMinutes} min ETA)
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#6EE7B7' : '#047857' }}
                      >
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
                          Accept {cur} {Number(ride.customerFare).toLocaleString()}
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => openCounterModal(ride)}
                          disabled={submittingBid}
                          sx={{
                            borderColor: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK_MODE : BRAND,
                            color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK_MODE : BRAND,
                            fontWeight: 800,
                            textTransform: 'none',
                            py: 1,
                            borderRadius: 2,
                            '&:hover': { borderColor: '#22c55e', bgcolor: 'rgba(34, 197, 94, 0.08)' },
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
          Propose RapidRide Counter-Fare
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                Customer proposed: <strong>{cur} {Number(bidModalRide?.customerFare || 0).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {bidModalRide?.pickupAddress} ➔ {bidModalRide?.dropoffAddress}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label={`Your Counter-Fare (${cur})`}
              type="number"
              value={counterAmount}
              onChange={e => setCounterAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">{cur}</InputAdornment>,
              }}
            />

            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Platform Fee (Basic + {counterPayoutPreview.commissionPercent}%):
                </Typography>
                <Typography variant="caption" fontWeight={700} color="error.main">
                  − {cur} {counterPayoutPreview.totalPlatformFee}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.4 }}>
                <Typography variant="caption" fontWeight={800} color="text.primary">
                  Your Estimated Net Take-Home:
                </Typography>
                <Typography variant="caption" fontWeight={900} sx={{ color: '#10B981' }}>
                  {cur} {counterPayoutPreview.driverNetEarning.toLocaleString()}
                </Typography>
              </Box>
            </Box>

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
          <Button onClick={() => setBidModalRide(null)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitCounterBid}
            disabled={submittingBid}
            sx={{ bgcolor: BRAND, color: '#fff', fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#2d5e21' } }}
          >
            {submittingBid ? 'Sending...' : 'Send Counter Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
