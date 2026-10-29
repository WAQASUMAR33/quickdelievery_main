'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import {
  DEFAULT_RAPIDRIDE_SETTINGS,
  normalizeRapidRideSettings,
  calculateRapidRideFare,
  calculateDriverPayout,
} from '@/lib/rapidRideFormula'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined'
import DirectionsCarOutlinedIcon from '@mui/icons-material/DirectionsCarOutlined'
import ElectricRickshawOutlinedIcon from '@mui/icons-material/ElectricRickshawOutlined'
import LocalTaxiOutlinedIcon from '@mui/icons-material/LocalTaxiOutlined'
import LuggageOutlinedIcon from '@mui/icons-material/LuggageOutlined'
import RestartAltOutlinedIcon from '@mui/icons-material/RestartAltOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined'

const BRAND = '#39772A'
const BRAND_DARK = '#4ade80'
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

const VEHICLE_ICONS = {
  MOTO: <TwoWheelerOutlinedIcon sx={{ fontSize: 20 }} />,
  AUTO: <ElectricRickshawOutlinedIcon sx={{ fontSize: 20 }} />,
  CAR_MINI: <DirectionsCarOutlinedIcon sx={{ fontSize: 20 }} />,
  CAR_AC: <LocalTaxiOutlinedIcon sx={{ fontSize: 20 }} />,
}

export default function DriverFareSettings({ embedded = false }) {
  const { user, userData } = useAuth()
  const [settings, setSettings] = useState(() => normalizeRapidRideSettings(DEFAULT_RAPIDRIDE_SETTINGS))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Live Simulator state
  const [simMode, setSimMode] = useState('TAXI')
  const [simVehicle, setSimVehicle] = useState('CAR_AC')
  const [simDistanceKm, setSimDistanceKm] = useState(8)
  const [simDurationMin, setSimDurationMin] = useState(20)
  const [simBagCount, setSimBagCount] = useState(2)
  const [simWeightKg, setSimWeightKg] = useState(18)
  const [simFragile, setSimFragile] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/driver-settings?admin=true')
      const json = await res.json()
      if (json.success && json.data) {
        setSettings(normalizeRapidRideSettings(json.data))
        setLastUpdated({
          at: json.data.updatedAt || null,
          by: json.data.updatedBy || null,
        })
      }
    } catch (err) {
      console.error('Failed to load driver fare settings:', err)
      toast.error('Failed to load RapidRide fare settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSectionField = (section, field, rawVal) => {
    const val = rawVal === '' ? '' : Number(rawVal)
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: val,
      },
    }))
  }

  const updateVehicleField = (vehKey, field, rawVal) => {
    const val = rawVal === '' ? '' : Number(rawVal)
    setSettings(prev => ({
      ...prev,
      vehicles: {
        ...prev.vehicles,
        [vehKey]: {
          ...prev.vehicles[vehKey],
          [field]: val,
        },
      },
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const normalized = normalizeRapidRideSettings(settings)
      const res = await fetch('/api/admin/driver-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...normalized,
          updatedBy: userData?.username || user?.displayName || user?.email || 'Admin',
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSettings(normalizeRapidRideSettings(json.data))
        setLastUpdated({
          at: json.data?.updatedAt || new Date().toISOString(),
          by: json.data?.updatedBy || 'Admin',
        })
        toast.success(json.message || 'RapidRide settings saved!')
      } else {
        toast.error(json.error || 'Failed to save settings')
      }
    } catch (err) {
      toast.error('Error saving settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleResetDefaults = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/driver-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetToDefaults: true,
          updatedBy: userData?.username || user?.email || 'Admin',
        }),
      })
      const json = await res.json()
      if (json.success) {
        setSettings(normalizeRapidRideSettings(json.data))
        setLastUpdated({
          at: json.data?.updatedAt || new Date().toISOString(),
          by: json.data?.updatedBy || 'Admin',
        })
        toast.success('Reset to RapidRide factory defaults')
      } else {
        toast.error(json.error || 'Failed to reset settings')
      }
    } catch (err) {
      toast.error('Error resetting settings: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const simResult = useMemo(() => {
    return calculateRapidRideFare({
      serviceType: simMode,
      vehicleId: simVehicle,
      distanceKm: Number(simDistanceKm) || 1,
      durationMin: Number(simDurationMin) || 5,
      bagCount: Number(simBagCount) || 0,
      weightKg: Number(simWeightKg) || 0,
      isFragile: simFragile,
      settings,
    })
  }, [simMode, simVehicle, simDistanceKm, simDurationMin, simBagCount, simWeightKg, simFragile, settings])

  const simPayout = useMemo(() => {
    return calculateDriverPayout(simResult.suggestedFare, settings)
  }, [simResult.suggestedFare, settings])

  if (loading) {
    return (
      <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <CircularProgress size={32} sx={{ color: BRAND }} />
        <Typography variant="body2" color="text.secondary">
          Loading RapidRide Fare & Baggage Formula Settings…
        </Typography>
      </Box>
    )
  }

  const cur = settings.currency || 'Rs.'

  return (
    <Box sx={{ p: embedded ? 0 : 3 }}>
      {/* ── Top Action Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, flexWrap: 'wrap' }}>
            <Typography variant={embedded ? 'h6' : 'h5'} fontWeight={800} color="text.primary">
              RapidRide Driver & Fare Formula Settings
            </Typography>
            <Chip
              label="DYNAMIC BIDDING ENGINE"
              size="small"
              sx={{
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.16)' : '#DCFCE7',
                color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : '#15803D',
                fontWeight: 800,
                borderRadius: 0,
                fontSize: 10.5,
              }}
            />
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Configure Basic Fee (Platform Fee), Baggage Fare Calculation Fee, Vehicle Rates, and RapidRide Offer-Your-Fare rules.
            {lastUpdated?.at && (
              <> • Last saved {new Date(lastUpdated.at).toLocaleString()}{lastUpdated.by ? ` by ${lastUpdated.by}` : ''}</>
            )}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            disabled={saving}
            startIcon={<RestartAltOutlinedIcon />}
            onClick={handleResetDefaults}
            sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, borderColor: 'divider', color: 'text.secondary' }}
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            size="small"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveOutlinedIcon />}
            onClick={handleSave}
            sx={{
              bgcolor: BRAND,
              color: '#fff',
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 700,
              px: 2.5,
              '&:hover': { bgcolor: '#2e6022' },
            }}
          >
            {saving ? 'Saving Formula…' : 'Save Formula Settings'}
          </Button>
        </Box>
      </Box>

      {/* ── Active Formula Reference Banner ── */}
      <Card
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: 0,
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.3)' : '#BBF7D0',
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(22, 163, 74, 0.1)' : '#F0FDF4',
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Typography
            variant="caption"
            fontWeight={800}
            sx={{
              color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : '#166534',
              letterSpacing: 0.6,
              display: 'block',
              mb: 1,
            }}
          >
            ACTIVE RAPIDRIDE CALCULATION FORMULAS
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 1.5 }}>
            <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={800} color="text.primary" display="block">
                1. City Taxi Fare Formula (with Basic Platform Fee & Extra Bags)
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                Suggested = max(MinFare, (Base + Km×KmRate + Min×MinRate) × Surge) + BasicPlatformFee + ExtraBags×BagFee
              </Typography>
            </Box>
            <Box sx={{ p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={800} color="text.primary" display="block">
                2. Baggage / Luggage Fare Calculation Formula
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.5 }}>
                Suggested = max(MinBagFare, (BagBase + Km×Rate + Min×Rate)×Surge + ExtraKg×KgRate + FragileFee) + BasicPlatformFee
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ── Main Two-Column Grid (Settings Left, Live Simulator Right) ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', xl: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

          {/* 1. BASIC FEE AS PLATFORM FEE & DRIVER WALLET RULES */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <AccountBalanceWalletOutlinedIcon sx={{ color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : BRAND, fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  Fare Calculation: Basic Fee as Platform Fee
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Flat platform booking fee included in customer fares + driver service commission & COD limits
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Basic Fee (Platform Fee)"
                  value={settings.platformFee.basicPlatformFee}
                  onChange={e => updateSectionField('platformFee', 'basicPlatformFee', e.target.value)}
                  helperText="Added directly into every calculated fare"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Driver Platform Commission"
                  value={settings.platformFee.platformCommissionPercent}
                  onChange={e => updateSectionField('platformFee', 'platformCommissionPercent', e.target.value)}
                  helperText="RapidRide % deducted from driver fare"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Minimum Platform Fee"
                  value={settings.platformFee.minPlatformFee}
                  onChange={e => updateSectionField('platformFee', 'minPlatformFee', e.target.value)}
                  helperText="Minimum total platform fee per ride"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Driver COD Cash Limit"
                  value={settings.platformFee.codRemittanceLimit}
                  onChange={e => updateSectionField('platformFee', 'codRemittanceLimit', e.target.value)}
                  helperText="Max floating cash before deposit required"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Order Delivery Base Fee"
                  value={settings.platformFee.deliveryOrderBaseFee}
                  onChange={e => updateSectionField('platformFee', 'deliveryOrderBaseFee', e.target.value)}
                  helperText="Default rider fee on store/food deliveries"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  label="Currency Symbol"
                  value={settings.currency}
                  onChange={e => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                  helperText="Displayed across RapidRide fares"
                  {...tf}
                />
              </Box>
            </CardContent>
          </Card>

          {/* 2. BAGGAGE FARE CALCULATION FEE */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <LuggageOutlinedIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  Baggage Fare Calculation Fee Formula
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Controls dedicated Baggage / Luggage Drop pricing, weight tiers, fragile handling, and passenger extra bag surcharges
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Baggage Base Fee"
                  value={settings.baggage.baseFee}
                  onChange={e => updateSectionField('baggage', 'baseFee', e.target.value)}
                  helperText="Starting pickup fee for baggage dispatch"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Baggage Per-Km Rate"
                  value={settings.baggage.perKmRate}
                  onChange={e => updateSectionField('baggage', 'perKmRate', e.target.value)}
                  helperText="Distance charge per kilometer"
                  InputProps={{ endAdornment: <InputAdornment position="end">{cur}/km</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Baggage Per-Min Rate"
                  value={settings.baggage.perMinRate}
                  onChange={e => updateSectionField('baggage', 'perMinRate', e.target.value)}
                  helperText="Travel time charge per minute"
                  InputProps={{ endAdornment: <InputAdornment position="end">{cur}/min</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Minimum Baggage Fare"
                  value={settings.baggage.minFare}
                  onChange={e => updateSectionField('baggage', 'minFare', e.target.value)}
                  helperText="Minimum trip floor before platform fee"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Free Weight Allowance"
                  value={settings.baggage.freeWeightKg}
                  onChange={e => updateSectionField('baggage', 'freeWeightKg', e.target.value)}
                  helperText="Included weight at no extra charge"
                  InputProps={{ endAdornment: <InputAdornment position="end">kg</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Extra Weight Fee (Per Kg)"
                  value={settings.baggage.perKgRate}
                  onChange={e => updateSectionField('baggage', 'perKgRate', e.target.value)}
                  helperText="Added for each kg over free allowance"
                  InputProps={{ endAdornment: <InputAdornment position="end">{cur}/kg</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Fragile Handling Fee"
                  value={settings.baggage.fragileFee}
                  onChange={e => updateSectionField('baggage', 'fragileFee', e.target.value)}
                  helperText="Added when fragile care is selected"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Free Bags on City Taxi"
                  value={settings.baggage.freeBagsIncluded}
                  onChange={e => updateSectionField('baggage', 'freeBagsIncluded', e.target.value)}
                  helperText="Free suitcases included in passenger rides"
                  InputProps={{ endAdornment: <InputAdornment position="end">bags</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Extra Bag Fee (City Taxi)"
                  value={settings.baggage.extraBagFee}
                  onChange={e => updateSectionField('baggage', 'extraBagFee', e.target.value)}
                  helperText="Surcharge per extra bag on taxi rides"
                  InputProps={{ endAdornment: <InputAdornment position="end">{cur}/bag</InputAdornment> }}
                  {...tf}
                />
              </Box>
            </CardContent>
          </Card>

          {/* 3. RAPIDRIDE BIDDING RULES & VEHICLE CLASS RATES */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Box sx={{ px: 2.5, py: 1.8, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <TuneOutlinedIcon sx={{ color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : BRAND, fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                  RapidRide Bidding Guardrails & Vehicle Class Rates
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Offer-Your-Fare negotiation limits and per-vehicle base/distance/time rates
                </Typography>
              </Box>
            </Box>
            <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2 }}>
                <TextField
                  size="small"
                  type="number"
                  label="Min Offer Floor"
                  value={settings.bidding.minOfferPercent}
                  onChange={e => updateSectionField('bidding', 'minOfferPercent', e.target.value)}
                  helperText="% of suggested fare"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Max Offer Cap"
                  value={settings.bidding.maxOfferPercent}
                  onChange={e => updateSectionField('bidding', 'maxOfferPercent', e.target.value)}
                  helperText="% of suggested fare"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Bid Step (+/-)"
                  value={settings.bidding.fareStepAmount}
                  onChange={e => updateSectionField('bidding', 'fareStepAmount', e.target.value)}
                  helperText="Quick button step"
                  InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  label="Counter Markup"
                  value={settings.bidding.defaultCounterMarkupPercent}
                  onChange={e => updateSectionField('bidding', 'defaultCounterMarkupPercent', e.target.value)}
                  helperText="Driver default +%"
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  {...tf}
                />
                <TextField
                  size="small"
                  type="number"
                  inputProps={{ step: '0.1', min: '1.0' }}
                  label="Surge Multiplier"
                  value={settings.bidding.surgeMultiplier}
                  onChange={e => updateSectionField('bidding', 'surgeMultiplier', e.target.value)}
                  helperText="1.0 = Normal"
                  InputProps={{ endAdornment: <InputAdornment position="end">×</InputAdornment> }}
                  {...tf}
                />
              </Box>

              <Divider />

              <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>
                VEHICLE CATEGORY BASE & DISTANCE RATES
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.values(settings.vehicles).map((veh) => (
                  <Box
                    key={veh.id}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: '1.3fr repeat(4, 1fr)' },
                      gap: 1.5,
                      alignItems: 'center',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Box
                        sx={{
                          p: 1,
                          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(74, 222, 128, 0.14)' : '#DCFCE7',
                          color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : BRAND,
                          display: 'flex',
                        }}
                      >
                        {VEHICLE_ICONS[veh.id] || <DirectionsCarOutlinedIcon sx={{ fontSize: 20 }} />}
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={800} color="text.primary">
                          {veh.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {veh.desc}
                        </Typography>
                      </Box>
                    </Box>

                    <TextField
                      size="small"
                      type="number"
                      label="Base Fare"
                      value={veh.baseFare}
                      onChange={e => updateVehicleField(veh.id, 'baseFare', e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                      {...tf}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Per Km"
                      value={veh.perKmRate}
                      onChange={e => updateVehicleField(veh.id, 'perKmRate', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">/km</InputAdornment> }}
                      {...tf}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Per Min"
                      value={veh.perMinRate}
                      onChange={e => updateVehicleField(veh.id, 'perMinRate', e.target.value)}
                      InputProps={{ endAdornment: <InputAdornment position="end">/m</InputAdornment> }}
                      {...tf}
                    />
                    <TextField
                      size="small"
                      type="number"
                      label="Min Fare"
                      value={veh.minFare}
                      onChange={e => updateVehicleField(veh.id, 'minFare', e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start">{cur}</InputAdornment> }}
                      {...tf}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* ── RIGHT COLUMN: LIVE INTERACTIVE FORMULA SIMULATOR ── */}
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 0,
            position: { xl: 'sticky' },
            top: { xl: 24 },
          }}
        >
          <Box sx={{ px: 2.5, py: 1.8, bgcolor: '#0f1724', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalculateOutlinedIcon sx={{ color: BRAND_DARK, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={800} color="#fff">
                Live RapidRide Formula Simulator
              </Typography>
            </Box>
            <Chip
              label="REAL-TIME PREVIEW"
              size="small"
              sx={{ bgcolor: 'rgba(74, 222, 128, 0.2)', color: BRAND_DARK, fontWeight: 800, fontSize: 10, borderRadius: 0 }}
            />
          </Box>

          <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Service Mode Toggle */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Button
                variant={simMode === 'TAXI' ? 'contained' : 'outlined'}
                onClick={() => setSimMode('TAXI')}
                startIcon={<LocalTaxiOutlinedIcon />}
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 800,
                  ...(simMode === 'TAXI'
                    ? { bgcolor: BRAND, color: '#fff', '&:hover': { bgcolor: '#2e6022' } }
                    : { borderColor: 'divider', color: 'text.secondary' }),
                }}
              >
                City Taxi
              </Button>
              <Button
                variant={simMode === 'LUGGAGE' ? 'contained' : 'outlined'}
                onClick={() => setSimMode('LUGGAGE')}
                startIcon={<LuggageOutlinedIcon />}
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 800,
                  ...(simMode === 'LUGGAGE'
                    ? { bgcolor: '#7C3AED', color: '#fff', '&:hover': { bgcolor: '#6D28D9' } }
                    : { borderColor: 'divider', color: 'text.secondary' }),
                }}
              >
                Baggage Drop
              </Button>
            </Box>

            {/* Test Inputs */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              {simMode === 'TAXI' && (
                <FormControl size="small" fullWidth sx={{ gridColumn: 'span 2' }}>
                  <InputLabel>Vehicle Class</InputLabel>
                  <Select
                    value={simVehicle}
                    label="Vehicle Class"
                    onChange={e => setSimVehicle(e.target.value)}
                    sx={{ borderRadius: 0 }}
                  >
                    {Object.values(settings.vehicles).map(v => (
                      <MenuItem key={v.id} value={v.id}>
                        {v.label} ({v.desc})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <TextField
                size="small"
                type="number"
                label="Trip Distance (km)"
                value={simDistanceKm}
                onChange={e => setSimDistanceKm(e.target.value)}
                {...tf}
              />
              <TextField
                size="small"
                type="number"
                label="Est. Duration (min)"
                value={simDurationMin}
                onChange={e => setSimDurationMin(e.target.value)}
                {...tf}
              />

              {simMode === 'TAXI' ? (
                <TextField
                  size="small"
                  type="number"
                  label="Passenger Suitcases / Bags"
                  value={simBagCount}
                  onChange={e => setSimBagCount(e.target.value)}
                  helperText={`First ${settings.baggage.freeBagsIncluded} bag(s) free`}
                  sx={{ gridColumn: 'span 2', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
              ) : (
                <>
                  <TextField
                    size="small"
                    type="number"
                    label="Package Weight (kg)"
                    value={simWeightKg}
                    onChange={e => setSimWeightKg(e.target.value)}
                    helperText={`${settings.baggage.freeWeightKg} kg free`}
                    {...tf}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, border: '1px solid', borderColor: 'divider' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          size="small"
                          checked={simFragile}
                          onChange={e => setSimFragile(e.target.checked)}
                        />
                      }
                      label={<Typography variant="caption" fontWeight={700}>Fragile Item</Typography>}
                    />
                  </Box>
                </>
              )}
            </Box>

            <Divider />

            {/* Live Breakdown Receipt */}
            <Box sx={{ p: 2, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" letterSpacing={0.5}>
                CUSTOMER FARE CALCULATION BREAKDOWN
              </Typography>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Base Fare</Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">{cur} {simResult.baseFare}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Distance Charge ({simResult.distanceKm} km)</Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">{cur} {simResult.distanceCost}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Duration Charge ({simResult.durationMin} min)</Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary">{cur} {simResult.timeCost}</Typography>
              </Box>
              {simResult.surgeMultiplier !== 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="warning.main" fontWeight={700}>Surge Multiplier</Typography>
                  <Typography variant="body2" fontWeight={800} color="warning.main">×{simResult.surgeMultiplier}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  Baggage Calculation Fee {simMode === 'LUGGAGE' && simResult.extraWeightKg > 0 ? `(+${simResult.extraWeightKg}kg${simFragile ? ' + Fragile' : ''})` : ''}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: '#8B5CF6' }}>
                  + {cur} {simResult.baggageFee}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Basic Fee (Platform Fee)</Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : BRAND }}>
                  + {cur} {simResult.basicPlatformFee}
                </Typography>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                  Suggested RapidRide Fare
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ color: (theme) => theme.palette.mode === 'dark' ? BRAND_DARK : BRAND }}>
                  {cur} {simResult.suggestedFare.toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  Allowed Customer Bid Range:
                </Typography>
                <Typography variant="caption" fontWeight={800} color="text.primary">
                  {cur} {simResult.minAllowedFare} – {cur} {simResult.maxAllowedFare}
                </Typography>
              </Box>
            </Box>

            {/* Driver Payout vs Platform Revenue Split */}
            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(56, 189, 248, 0.3)' : '#BAE6FD',
                bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(14, 165, 233, 0.1)' : '#F0F9FF',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.8,
              }}
            >
              <Typography variant="caption" fontWeight={800} sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#7DD3FC' : '#0369A1', letterSpacing: 0.5 }}>
                DRIVER SETTLEMENT ON {cur} {simPayout.grossFare} FARE
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">
                  Basic Platform Fee + {simPayout.commissionPercent}% Commission
                </Typography>
                <Typography variant="caption" fontWeight={800} color="error.main">
                  − {cur} {simPayout.totalPlatformFee}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight={800} color="text.primary">
                  Driver Net Take-Home Earning
                </Typography>
                <Typography variant="subtitle1" fontWeight={900} sx={{ color: '#10B981' }}>
                  {cur} {simPayout.driverNetEarning.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

