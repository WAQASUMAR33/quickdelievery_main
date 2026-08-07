'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

import Alert            from '@mui/material/Alert'
import Avatar           from '@mui/material/Avatar'
import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import FormControl      from '@mui/material/FormControl'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Select           from '@mui/material/Select'
import Switch           from '@mui/material/Switch'
import Tab              from '@mui/material/Tab'
import Tabs             from '@mui/material/Tabs'
import TextField        from '@mui/material/TextField'
import Typography       from '@mui/material/Typography'

import BadgeOutlinedIcon          from '@mui/icons-material/BadgeOutlined'
import CheckCircleOutlinedIcon     from '@mui/icons-material/CheckCircleOutlined'
import TwoWheelerOutlinedIcon      from '@mui/icons-material/TwoWheelerOutlined'
import DirectionsCarOutlinedIcon   from '@mui/icons-material/DirectionsCarOutlined'
import EmailOutlinedIcon           from '@mui/icons-material/EmailOutlined'
import LocationOnOutlinedIcon      from '@mui/icons-material/LocationOnOutlined'
import PersonOutlinedIcon          from '@mui/icons-material/PersonOutlined'
import PhoneOutlinedIcon           from '@mui/icons-material/PhoneOutlined'
import SaveOutlinedIcon            from '@mui/icons-material/SaveOutlined'
import ShieldOutlinedIcon          from '@mui/icons-material/ShieldOutlined'
import StarIcon                    from '@mui/icons-material/Star'
import VerifiedUserOutlinedIcon    from '@mui/icons-material/VerifiedUserOutlined'
import WarningAmberOutlinedIcon    from '@mui/icons-material/WarningAmberOutlined'
import AccountBalanceOutlinedIcon  from '@mui/icons-material/AccountBalanceOutlined'
import LocalShippingOutlinedIcon   from '@mui/icons-material/LocalShippingOutlined'
import AccessTimeOutlinedIcon      from '@mui/icons-material/AccessTimeOutlined'
import EditOutlinedIcon            from '@mui/icons-material/EditOutlined'
import PowerSettingsNewOutlinedIcon from '@mui/icons-material/PowerSettingsNewOutlined'
import ReportProblemOutlinedIcon   from '@mui/icons-material/ReportProblemOutlined'
import SendOutlinedIcon            from '@mui/icons-material/SendOutlined'

const BRAND = '#D70F64'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    '&:hover fieldset':       { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& label.Mui-focused': { color: BRAND },
}

const VEHICLE_TYPES = [
  { value: 'Motorcycle', label: 'Motorcycle / Bike', icon: <TwoWheelerOutlinedIcon fontSize="small" /> },
  { value: 'Scooter',    label: 'Scooter',           icon: <TwoWheelerOutlinedIcon fontSize="small" /> },
  { value: 'Car',        label: 'Car',               icon: <DirectionsCarOutlinedIcon fontSize="small" /> },
  { value: 'Bicycle',    label: 'Bicycle',           icon: <TwoWheelerOutlinedIcon fontSize="small" /> },
  { value: 'Van',        label: 'Delivery Van',      icon: <LocalShippingOutlinedIcon fontSize="small" /> },
]

function DriverProfileContent({ driverData: initialDriver, onSaveSuccess, readOnly = false }) {
  const { user, userData, loadUserData } = useAuth()
  const searchParams = useSearchParams()
  const tabQuery = searchParams?.get('tab')

  const [driver, setDriver] = useState(initialDriver || null)
  const [loading, setLoading] = useState(!initialDriver)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [isEditing, setIsEditing] = useState(false)

  // Dispute form state
  const [disputeForm, setDisputeForm] = useState({
    orderId: '',
    issueType: 'Payment Issue',
    description: '',
  })

  // Sample disputes list
  const [disputesList, setDisputesList] = useState([
    {
      id: 'DISP-1092',
      orderId: '#ORD-8842',
      issueType: 'Payment Tip Discrepancy',
      date: '2026-07-20',
      status: 'RESOLVED',
      response: 'Adjusted payout credited to your weekly balance.',
    },
    {
      id: 'DISP-1045',
      orderId: '#ORD-8710',
      issueType: 'Customer Unreachable at Dropoff',
      date: '2026-07-15',
      status: 'RESOLVED',
      response: 'Order cancellation fee approved.',
    },
  ])

  // Sync tabQuery with activeTab
  useEffect(() => {
    if (tabQuery !== null && tabQuery !== undefined) {
      const parsed = parseInt(tabQuery)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) {
        setActiveTab(parsed)
      } else {
        const tabMap = {
          personal: 0,
          vehicle: 1,
          verification: 2,
          docs: 2,
          duty: 3,
          shift: 3,
          payout: 4,
          bank: 4,
          disputes: 5,
        }
        if (tabMap[tabQuery] !== undefined) {
          setActiveTab(tabMap[tabQuery])
        }
      }
    }
  }, [tabQuery])

  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    emailVerification: false,
    
    // Required Driver Fields
    cnicNumber: '',
    licenseNumber: '',
    homeAddress: '',
    bankName: '',
    bankAccountTitle: '',
    bankAccountNumber: '',
    profilePhotoUrl: '',
    equipmentDepositPaid: false,
    smartphoneCompatible: false,

    // Optional Fields
    vehicleType: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    preferredZone: '',
    shiftSchedule: '',
    dutyStatus: 'OFF_DUTY',
  })

  // Populate profile
  const populateProfile = useCallback((data) => {
    setDriver(data)
    const dp = data.driverProfile || {}
    setFormData({
      username: data.username || '',
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      emailVerification: data.emailVerification ?? false,
      
      cnicNumber: data.cnicNumber || dp.cnicNumber || '',
      licenseNumber: data.licenseNumber || dp.licenseNumber || '',
      homeAddress: data.homeAddress || dp.homeAddress || '',
      bankName: data.bankName || dp.bankName || '',
      bankAccountTitle: data.bankAccountTitle || dp.bankAccountTitle || '',
      bankAccountNumber: data.bankAccountNumber || dp.bankAccountNumber || '',
      profilePhotoUrl: data.profilePhotoUrl || dp.profilePhotoUrl || '',
      equipmentDepositPaid: data.equipmentDepositPaid ?? dp.equipmentDepositPaid ?? false,
      smartphoneCompatible: data.smartphoneCompatible ?? dp.smartphoneCompatible ?? false,

      vehicleType: data.vehicleType || dp.vehicleType || '',
      emergencyContactName: data.emergencyContactName || dp.emergencyContactName || '',
      emergencyContactPhone: data.emergencyContactPhone || dp.emergencyContactPhone || '',
      preferredZone: data.preferredZone || dp.preferredZone || '',
      shiftSchedule: data.shiftSchedule || dp.shiftSchedule || '',
      dutyStatus: data.dutyStatus || dp.dutyStatus || 'OFF_DUTY',
    })
  }, [])

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    const queryEmail = initialDriver?.email || userData?.email || user?.email
    const queryUid = initialDriver?.uid || userData?.uid || user?.uid
    const queryId = initialDriver?.id

    if (!queryEmail && !queryUid && !queryId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (queryId) params.append('id', queryId.toString())
      else if (queryUid) params.append('uid', queryUid)
      else if (queryEmail) params.append('email', queryEmail)

      const res = await fetch(`/api/driver/profile?${params}`)
      const json = await res.json()

      if (json.success && json.data) {
        populateProfile(json.data)
      } else if (initialDriver) {
        populateProfile(initialDriver)
      } else if (userData) {
        populateProfile({ ...userData, role: 'DRIVER' })
      }
    } catch (err) {
      console.error('Error fetching driver profile:', err)
      if (initialDriver) populateProfile(initialDriver)
    } finally {
      setLoading(false)
    }
  }, [initialDriver, userData, user, populateProfile])

  useEffect(() => {
    if (initialDriver) {
      populateProfile(initialDriver)
    }
    fetchProfile()
  }, [initialDriver, fetchProfile, populateProfile])

  // Save profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        id: driver?.id,
        uid: driver?.uid || userData?.uid,
        ...formData
      }

      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()
      if (json.success) {
        toast.success('Driver profile saved successfully!')
        setIsEditing(false)
        if (loadUserData) await loadUserData()
        if (onSaveSuccess) onSaveSuccess(json.data)
      } else {
        toast.error(json.error || 'Failed to update profile')
      }
    } catch (err) {
      console.error('Save profile error:', err)
      toast.error('Error saving profile changes')
    } finally {
      setSaving(false)
    }
  }

  // Submit dispute
  const handleCreateDispute = (e) => {
    e.preventDefault()
    if (!disputeForm.orderId || !disputeForm.description) {
      toast.error('Please fill in the order ID and description.')
      return
    }

    const newTicket = {
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: disputeForm.orderId,
      issueType: disputeForm.issueType,
      date: new Date().toISOString().split('T')[0],
      status: 'PENDING',
      response: 'Dispute submitted. Admin review pending.',
    }

    setDisputesList([newTicket, ...disputesList])
    setDisputeForm({ orderId: '', issueType: 'Payment Issue', description: '' })
    toast.success('Dispute ticket submitted successfully!')
  }

  // Toggle duty status
  const handleToggleDuty = async () => {
    const newStatus = formData.dutyStatus === 'ON_DUTY' ? 'OFF_DUTY' : 'ON_DUTY'
    setFormData(prev => ({ ...prev, dutyStatus: newStatus }))

    try {
      const res = await fetch('/api/driver/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: driver?.id,
          uid: driver?.uid || userData?.uid,
          dutyStatus: newStatus
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Duty status updated to ${newStatus === 'ON_DUTY' ? 'ON DUTY' : 'OFF DUTY'}`)
      }
    } catch (err) {
      console.error('Duty toggle error:', err)
    }
  }

  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Loading driver profile…
        </Typography>
      </Box>
    )
  }

  const isVerified = formData.emailVerification
  const isOnDuty = formData.dutyStatus === 'ON_DUTY'
  const stats = driver?.stats || {
    totalDeliveries: 148,
    acceptanceRate: '98.5%',
    onTimeRate: '99.2%',
    rating: 4.9,
    reviewsCount: 42,
    totalEarnings: '$1,280.00'
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* ── Driver Header Banner ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, mb: 3 }}>
        <Box sx={{ p: 3, bgcolor: '#0f1724', color: 'white' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: BRAND,
                  fontSize: 28,
                  fontWeight: 800,
                  border: '2px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {(formData.username || 'D').charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={800} color="white">
                    {formData.username || 'Driver Profile'}
                  </Typography>
                  <Chip
                    label={formData.dutyStatus === 'ON_DUTY' ? 'ON DUTY' : 'OFF DUTY'}
                    size="small"
                    sx={{
                      bgcolor: isOnDuty ? '#15803d' : '#4b5563',
                      color: 'white',
                      fontWeight: 700,
                      borderRadius: 0,
                      fontSize: 11
                    }}
                  />
                  <Chip
                    icon={isVerified ? <VerifiedUserOutlinedIcon sx={{ fontSize: '14px !important', color: 'white !important' }} /> : <WarningAmberOutlinedIcon sx={{ fontSize: '14px !important', color: 'white !important' }} />}
                    label={isVerified ? 'VERIFIED DRIVER' : 'UNVERIFIED'}
                    size="small"
                    sx={{
                      bgcolor: isVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: isVerified ? '#34d399' : '#fbbf24',
                      border: '1px solid',
                      borderColor: isVerified ? '#059669' : '#d97706',
                      fontWeight: 700,
                      borderRadius: 0,
                      fontSize: 11
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 15 }} /> {formData.email || 'No email provided'}
                  </Box>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneOutlinedIcon sx={{ fontSize: 15 }} /> {formData.phoneNumber || 'No phone'}
                  </Box>
                </Typography>
              </Box>
            </Box>

            {/* Quick Action Controls */}
            {!readOnly && (
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', alignSelf: { xs: 'stretch', sm: 'center' } }}>
                <Button
                  variant={isOnDuty ? 'contained' : 'outlined'}
                  color={isOnDuty ? 'success' : 'inherit'}
                  onClick={handleToggleDuty}
                  startIcon={<PowerSettingsNewOutlinedIcon />}
                  size="small"
                  sx={{
                    borderRadius: 0,
                    fontWeight: 700,
                    bgcolor: isOnDuty ? '#16a34a' : 'transparent',
                    borderColor: isOnDuty ? '#16a34a' : 'rgba(255,255,255,0.3)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: isOnDuty ? '#15803d' : 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  {isOnDuty ? 'Go Off Duty' : 'Go On Duty'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setIsEditing(!isEditing)}
                  startIcon={isEditing ? <SaveOutlinedIcon /> : <EditOutlinedIcon />}
                  size="small"
                  sx={{
                    borderRadius: 0,
                    bgcolor: BRAND,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#b00d52' }
                  }}
                >
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>

        {/* Rating & Joined sub-bar */}
        <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#f59e0b', fontWeight: 800, fontSize: 14 }}>
              <StarIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" fontWeight={800} color="text.primary">
                {stats.rating} / 5.0
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({stats.reviewsCount} reviews)
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              UID: <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{driver?.uid || 'N/A'}</Box>
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Member since: {driver?.createdAt ? new Date(driver.createdAt).toLocaleDateString() : 'Recent'}
          </Typography>
        </Box>
      </Card>

      {/* ── KPI Stat Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Completed Deliveries', value: stats.totalDeliveries, color: '#10b981', icon: <LocalShippingOutlinedIcon /> },
          { label: 'Acceptance Rate',      value: stats.acceptanceRate,  color: '#3b82f6', icon: <CheckCircleOutlinedIcon /> },
          { label: 'On-Time Rate',         value: stats.onTimeRate,       color: '#8b5cf6', icon: <AccessTimeOutlinedIcon /> },
          { label: 'Rating',               value: `${stats.rating} ★`,   color: '#f59e0b', icon: <StarIcon /> },
          { label: 'Total Earnings',       value: stats.totalEarnings,   color: BRAND,     icon: <AccountBalanceOutlinedIcon /> },
        ].map(({ label, value, color, icon }) => (
          <Card key={label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5 }}>
                    {value}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: `${color}15`, color, borderRadius: 1, display: 'flex' }}>
                  {icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Section Tabs Navigation Bar ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: 13, minHeight: 48 },
            '& .Mui-selected': { color: BRAND },
            '& .MuiTabs-indicator': { bgcolor: BRAND, height: 3 },
          }}
        >
          <Tab icon={<PersonOutlinedIcon fontSize="small" />} iconPosition="start" label="Personal Info" />
          <Tab icon={<TwoWheelerOutlinedIcon fontSize="small" />} iconPosition="start" label="Vehicle & Equipment" />
          <Tab icon={<ShieldOutlinedIcon fontSize="small" />} iconPosition="start" label="Verification & Docs" />
          <Tab icon={<AccessTimeOutlinedIcon fontSize="small" />} iconPosition="start" label="Duty & Shift" />
          <Tab icon={<AccountBalanceOutlinedIcon fontSize="small" />} iconPosition="start" label="Payout & Bank" />
          <Tab icon={<ReportProblemOutlinedIcon fontSize="small" />} iconPosition="start" label="Disputes & Claims" />
        </Tabs>
      </Box>

      {/* ── Section Content Card ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <CardContent sx={{ p: 3 }}>
          <form onSubmit={handleSaveProfile}>
            {/* ── Section 0: Personal Info ── */}
            {activeTab === 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Personal & Account Details
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                    <TextField
                      label="Full Name / Username"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      {...fieldSx}
                    />
                    <TextField
                      label="Email Address"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      {...fieldSx}
                    />
                    <TextField
                      label="Phone Number"
                      value={formData.phoneNumber}
                      onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      {...fieldSx}
                    />
                    <Box sx={{ border: '1px solid', borderColor: 'divider', p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper', '&:hover': { borderColor: isEditing ? BRAND : 'divider' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={formData.profilePhotoUrl} sx={{ width: 40, height: 40, bgcolor: 'grey.200' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={700} sx={{ color: isEditing ? 'text.primary' : 'text.disabled' }}>Profile Photo *</Typography>
                          <Typography variant="caption" color={isEditing ? 'text.secondary' : 'text.disabled'}>Clear, recent passport-sized picture</Typography>
                        </Box>
                      </Box>
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        disabled={!isEditing}
                        sx={{ borderRadius: 0, textTransform: 'none', borderColor: BRAND, color: BRAND, '&:hover': { borderColor: '#b00d52', bgcolor: 'rgba(215, 15, 100, 0.04)' } }}
                      >
                        Upload
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (ev) => {
                                setFormData({ ...formData, profilePhotoUrl: ev.target.result })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                        />
                      </Button>
                    </Box>
                    <TextField
                      label="Home Address Verification *"
                      value={formData.homeAddress}
                      onChange={e => setFormData({ ...formData, homeAddress: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      required
                      fullWidth
                      placeholder="e.g. Utility bill verified address"
                      sx={{ gridColumn: { md: 'span 2' } }}
                      {...fieldSx}
                    />
                    <TextField
                      label="Preferred Working Zone"
                      value={formData.preferredZone}
                      onChange={e => setFormData({ ...formData, preferredZone: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      {...fieldSx}
                    />
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Emergency Contact Information
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                    <TextField
                      label="Emergency Contact Name"
                      value={formData.emergencyContactName}
                      onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      {...fieldSx}
                    />
                    <TextField
                      label="Emergency Contact Phone"
                      value={formData.emergencyContactPhone}
                      onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      {...fieldSx}
                    />
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* ── Section 1: Vehicle & Equipment ── */}
            {activeTab === 1 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Vehicle & Equipment Details
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                    <FormControl size="small" fullWidth disabled={!isEditing} sx={fieldSx}>
                      <InputLabel>Vehicle Type</InputLabel>
                      <Select
                        value={formData.vehicleType}
                        label="Vehicle Type"
                        onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                        sx={{ borderRadius: 0 }}
                      >
                        {VEHICLE_TYPES.map(vt => (
                          <MenuItem key={vt.value} value={vt.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {vt.icon}
                              <span>{vt.label}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Compatible Smartphone *</Typography>
                        <Typography variant="caption" color="text.secondary">Android 7.0+ or iOS 9.0+</Typography>
                      </Box>
                      <Switch
                        checked={formData.smartphoneCompatible}
                        onChange={e => setFormData({ ...formData, smartphoneCompatible: e.target.checked })}
                        disabled={!isEditing}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* ── Section 2: Verification & Docs ── */}
            {activeTab === 2 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Identity & Verification Status
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                    <TextField
                      label="National CNIC / ID Number *"
                      value={formData.cnicNumber}
                      onChange={e => setFormData({ ...formData, cnicNumber: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      required
                      fullWidth
                      placeholder="e.g. 35202-1234567-1"
                      {...fieldSx}
                    />

                    <TextField
                      label="Driving License Number *"
                      value={formData.licenseNumber}
                      onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      required
                      fullWidth
                      {...fieldSx}
                    />
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Document Upload Checklist
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {[
                      { name: 'CNIC Front & Back', status: 'VERIFIED', icon: <BadgeOutlinedIcon /> },
                      { name: 'Driving License Copy', status: 'VERIFIED', icon: <ShieldOutlinedIcon /> },
                      { name: 'Home Address Verification', status: 'VERIFIED', icon: <CheckCircleOutlinedIcon /> },
                    ].map(doc => (
                      <Box key={doc.name} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ color: BRAND }}>{doc.icon}</Box>
                          <Typography variant="body2" fontWeight={600}>{doc.name}</Typography>
                        </Box>
                        <Chip label="Verified" size="small" color="success" variant="outlined" sx={{ borderRadius: 0, fontSize: 10, fontWeight: 700 }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* ── Section 3: Duty & Shift ── */}
            {activeTab === 3 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Duty Status & Work Shift Preferences
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                    <FormControl size="small" fullWidth disabled={!isEditing} sx={fieldSx}>
                      <InputLabel>Duty Status</InputLabel>
                      <Select
                        value={formData.dutyStatus}
                        label="Duty Status"
                        onChange={e => setFormData({ ...formData, dutyStatus: e.target.value })}
                        sx={{ borderRadius: 0 }}
                      >
                        <MenuItem value="ON_DUTY">ON DUTY (Active & Ready for Orders)</MenuItem>
                        <MenuItem value="OFF_DUTY">OFF DUTY (Unavailable)</MenuItem>
                        <MenuItem value="ON_DELIVERY">ON DELIVERY (Busy)</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label="Shift Schedule & Availability"
                      value={formData.shiftSchedule}
                      onChange={e => setFormData({ ...formData, shiftSchedule: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      fullWidth
                      placeholder="e.g. Part-time / Full-time"
                      {...fieldSx}
                    />

                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gridColumn: { md: 'span 2' } }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>Equipment Deposit Paid *</Typography>
                        <Typography variant="caption" color="text.secondary">Paid for delivery bag and shirt (Rs. 1,500 - 2,000)</Typography>
                      </Box>
                      <Switch
                        checked={formData.equipmentDepositPaid}
                        onChange={e => setFormData({ ...formData, equipmentDepositPaid: e.target.checked })}
                        disabled={!isEditing}
                        size="small"
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND }
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* ── Section 4: Payout & Bank ── */}
            {activeTab === 4 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Financial Account & Payout Information
                  </Typography>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                    <TextField
                      label="Bank Name / Digital Wallet *"
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      required
                      fullWidth
                      placeholder="e.g. JazzCash / EasyPaisa / HBL Konnect"
                      {...fieldSx}
                    />

                    <TextField
                      label="Account Title *"
                      value={formData.bankAccountTitle}
                      onChange={e => setFormData({ ...formData, bankAccountTitle: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      required
                      fullWidth
                      {...fieldSx}
                    />

                    <TextField
                      label="Account Number *"
                      value={formData.bankAccountNumber}
                      onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      disabled={!isEditing}
                      size="small"
                      required
                      fullWidth
                      placeholder="e.g. 03001234567"
                      sx={{ gridColumn: { md: 'span 2' } }}
                      {...fieldSx}
                    />
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* ── Section 5: Disputes & Order Claims ── */}
            {activeTab === 5 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                    Driver Disputes & Support Claims
                  </Typography>

                  {/* Dispute Summary Stat Cards */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>TOTAL DISPUTES</Typography>
                      <Typography variant="h5" fontWeight={800} color={BRAND} mt={0.5}>{disputesList.length}</Typography>
                    </Box>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>PENDING RESOLUTION</Typography>
                      <Typography variant="h5" fontWeight={800} color="#f59e0b" mt={0.5}>
                        {disputesList.filter(d => d.status === 'PENDING').length}
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>RESOLVED CLAIMS</Typography>
                      <Typography variant="h5" fontWeight={800} color="#10b981" mt={0.5}>
                        {disputesList.filter(d => d.status === 'RESOLVED').length}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Form to submit new dispute */}
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, bgcolor: 'grey.50', p: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ReportProblemOutlinedIcon sx={{ color: BRAND, fontSize: 20 }} /> Log a New Dispute or Issue Claim
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                      <TextField
                        label="Order Reference ID"
                        value={disputeForm.orderId}
                        onChange={e => setDisputeForm({ ...disputeForm, orderId: e.target.value })}
                        size="small"
                        placeholder="e.g. #ORD-9912"
                        {...fieldSx}
                      />
                      <FormControl size="small" fullWidth sx={fieldSx}>
                        <InputLabel>Issue Type</InputLabel>
                        <Select
                          value={disputeForm.issueType}
                          label="Issue Type"
                          onChange={e => setDisputeForm({ ...disputeForm, issueType: e.target.value })}
                          sx={{ borderRadius: 0 }}
                        >
                          <MenuItem value="Payment Issue">Payment / Fare Discrepancy</MenuItem>
                          <MenuItem value="Customer Unreachable">Customer Unreachable / No Show</MenuItem>
                          <MenuItem value="Wrong Address">Incorrect Address / Location</MenuItem>
                          <MenuItem value="Damaged Items">Damaged Item Claim</MenuItem>
                          <MenuItem value="App Bug">App / Navigation Technical Issue</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <TextField
                      label="Detailed Description of the Incident"
                      value={disputeForm.description}
                      onChange={e => setDisputeForm({ ...disputeForm, description: e.target.value })}
                      multiline
                      rows={3}
                      size="small"
                      fullWidth
                      placeholder="Provide details about what happened during delivery..."
                      sx={{ mb: 2, ...fieldSx }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        onClick={handleCreateDispute}
                        startIcon={<SendOutlinedIcon />}
                        size="small"
                        sx={{ borderRadius: 0, bgcolor: BRAND, fontWeight: 700, '&:hover': { bgcolor: '#b00d52' } }}
                      >
                        Submit Dispute Claim
                      </Button>
                    </Box>
                  </Card>

                  {/* Disputes history table/list */}
                  <Typography variant="subtitle2" fontWeight={700}>Dispute History & Claims Log</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {disputesList.map(disp => (
                      <Box key={disp.id} sx={{ p: 2, border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Typography variant="body2" fontWeight={700}>{disp.id}</Typography>
                            <Chip label={disp.orderId} size="small" sx={{ borderRadius: 0, fontSize: 11, fontWeight: 600 }} />
                            <Typography variant="caption" color="text.secondary">{disp.issueType}</Typography>
                          </Box>
                          <Chip
                            label={disp.status}
                            size="small"
                            color={disp.status === 'RESOLVED' ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ borderRadius: 0, fontSize: 10, fontWeight: 700 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Date: {disp.date} | Admin Notes: <em>{disp.response}</em>
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </motion.div>
            )}

            {/* ── Save Bar (when editing) ── */}
            {isEditing && !readOnly && (
              <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsEditing(false)}
                  sx={{ borderRadius: 0, color: 'text.secondary', borderColor: 'divider' }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                  sx={{
                    borderRadius: 0,
                    bgcolor: BRAND,
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#b00d52' }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </Box>
            )}
          </form>
        </CardContent>
      </Card>
    </Box>
  )
}

export default function DriverProfile(props) {
  return (
    <Suspense fallback={<Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress sx={{ color: BRAND }} /></Box>}>
      <DriverProfileContent {...props} />
    </Suspense>
  )
}
