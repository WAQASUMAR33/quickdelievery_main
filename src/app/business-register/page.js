'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import NextLink from 'next/link'
import toast from 'react-hot-toast'
import { styled, createTheme, ThemeProvider } from '@mui/material/styles'
import ImageUploadField from '@/components/ui/ImageUploadField'
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api'
import { COUNTRIES, getCountry, formatNationalPhone, buildFullPhoneNumber, parsePhoneAndCountry } from '@/lib/countryData'

import AppBar            from '@mui/material/AppBar'
import Toolbar           from '@mui/material/Toolbar'
import Container         from '@mui/material/Container'
import Box               from '@mui/material/Box'
import Paper             from '@mui/material/Paper'
import Typography        from '@mui/material/Typography'
import Stack             from '@mui/material/Stack'
import Grid              from '@mui/material/Grid'
import TextField         from '@mui/material/TextField'
import InputAdornment    from '@mui/material/InputAdornment'
import FormControl       from '@mui/material/FormControl'
import InputLabel        from '@mui/material/InputLabel'
import Select            from '@mui/material/Select'
import MenuItem          from '@mui/material/MenuItem'
import Divider           from '@mui/material/Divider'
import Alert             from '@mui/material/Alert'
import Chip              from '@mui/material/Chip'
import Button            from '@mui/material/Button'
import CircularProgress  from '@mui/material/CircularProgress'
import Stepper           from '@mui/material/Stepper'
import Step              from '@mui/material/Step'
import StepLabel         from '@mui/material/StepLabel'
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector'

// MUI Icons
import PersonOutlinedIcon         from '@mui/icons-material/PersonOutlined'
import EmailOutlinedIcon          from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon          from '@mui/icons-material/PhoneOutlined'
import CreditCardOutlinedIcon     from '@mui/icons-material/CreditCardOutlined'
import BusinessOutlinedIcon       from '@mui/icons-material/BusinessOutlined'
import LocationOnOutlinedIcon     from '@mui/icons-material/LocationOnOutlined'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import DescriptionOutlinedIcon    from '@mui/icons-material/DescriptionOutlined'
import StoreOutlinedIcon          from '@mui/icons-material/StoreOutlined'
import CameraAltOutlinedIcon      from '@mui/icons-material/CameraAltOutlined'
import NumbersOutlinedIcon        from '@mui/icons-material/NumbersOutlined'
import PublicOutlinedIcon         from '@mui/icons-material/PublicOutlined'
import Inventory2OutlinedIcon     from '@mui/icons-material/Inventory2Outlined'
import InfoOutlinedIcon           from '@mui/icons-material/InfoOutlined'
import CategoryOutlinedIcon       from '@mui/icons-material/CategoryOutlined'
import HomeOutlinedIcon           from '@mui/icons-material/HomeOutlined'
import CheckIcon                  from '@mui/icons-material/Check'
import CheckCircleOutlinedIcon    from '@mui/icons-material/CheckCircleOutlined'
import StorefrontOutlinedIcon     from '@mui/icons-material/StorefrontOutlined'
import MyLocationIcon             from '@mui/icons-material/MyLocation'
import PinDropOutlinedIcon        from '@mui/icons-material/PinDropOutlined'
import ChevronRightIcon           from '@mui/icons-material/ChevronRight'
import ChevronLeftIcon            from '@mui/icons-material/ChevronLeft'
// Filled — used inside Stepper icon
import PersonIcon         from '@mui/icons-material/Person'
import StoreIcon          from '@mui/icons-material/Store'
import DescriptionIcon    from '@mui/icons-material/Description'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CameraAltIcon      from '@mui/icons-material/CameraAlt'

// ─── Google Maps constants ─────────────────────────────────────────────────────
const MAP_LIBRARIES = ['places']
const MAP_CONTAINER = { width: '100%', height: '300px' }
const DEFAULT_CENTER = { lat: 33.6844, lng: 73.0479 } // Islamabad

// ─── Brand colour ─────────────────────────────────────────────────────────────
const BRAND = '#39772A'

// ─── Steps config ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, title: 'Personal Info',    Icon: PersonIcon         },
  { id: 2, title: 'Business Details', Icon: StoreIcon          },
  { id: 3, title: 'Documents',        Icon: DescriptionIcon    },
  { id: 4, title: 'Banking',          Icon: AccountBalanceIcon },
  { id: 5, title: 'Branding',         Icon: CameraAltIcon      },
]

// ─── Initial form state ───────────────────────────────────────────────────────
const INITIAL = {
  firstName: '', lastName: '', email: '', cnicNo: '', phoneNumber1: '', phoneNumber2: '',
  country: 'Pakistan',
  businessName: '', categoryId: '', businessCategoryId: '', businessTypeId: '',
  buildingPlaceName: '', streetAddress: '', houseNumber: '', state: 'Punjab', city: '', postalCode: '',
  urlCnicFront: '', urlCnicBack: '', ntnNo: '',
  bankName: '', bankIbanNo: '', bankAccountTitle: '', billingAddress: '',
  urlLogo: '', urlCoverPhoto: '', urlRestaurantImages: '',
  latitude: null, longitude: null,
}

// ─── Styled Stepper connector ─────────────────────────────────────────────────
const PinkConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 21 },
  [`& .${stepConnectorClasses.line}`]: {
    borderTopWidth: 2,
    borderColor: '#e0e0e0',
  },
  [`&.${stepConnectorClasses.active}   .${stepConnectorClasses.line}`]: { borderColor: BRAND },
  [`&.${stepConnectorClasses.completed} .${stepConnectorClasses.line}`]: { borderColor: BRAND },
}))

// ─── Custom Stepper Icon ──────────────────────────────────────────────────────
const STEP_ICONS = {
  1: PersonIcon, 2: StoreIcon, 3: DescriptionIcon,
  4: AccountBalanceIcon, 5: CameraAltIcon,
}

function PinkStepIcon({ active, completed, icon }) {
  const IconComp = STEP_ICONS[icon]
  return (
    <Box sx={{
      width: 44, height: 44, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: active || completed ? BRAND : 'grey.200',
      color: active || completed ? '#fff' : 'grey.500',
      boxShadow: active ? `0 0 0 5px ${BRAND}22` : 'none',
      transition: 'all 0.3s',
    }}>
      {completed
        ? <CheckIcon sx={{ fontSize: 22 }} />
        : <IconComp   sx={{ fontSize: 22 }} />
      }
    </Box>
  )
}

// ─── Shared TextField colour override ────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset':        { borderColor: BRAND },
    '&.Mui-focused fieldset':  { borderColor: BRAND },
  },
  '& label.Mui-focused': { color: BRAND },
}

// ─── Adornment helper ─────────────────────────────────────────────────────────
const adornment = Icon => (
  <InputAdornment position="start">
    <Icon sx={{ color: 'action.active', fontSize: 18 }} />
  </InputAdornment>
)

// ─── Small-size theme override for all form fields ────────────────────────────
const smallTheme = createTheme({
  components: {
    MuiTextField:    { defaultProps: { size: 'small' } },
    MuiFormControl:  { defaultProps: { size: 'small' } },
    MuiSelect:       { defaultProps: { size: 'small' } },
    MuiOutlinedInput:{ defaultProps: { size: 'small' } },
  },
})

// ─── Page (inner — needs useSearchParams) ────────────────────────────────────
function BusinessRegisterInner() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const vendorEmail   = searchParams.get('email') || ''   // passed from /register for VENDOR flow
  const isVendorFlow  = !!vendorEmail

  const [step,               setStep]               = useState(1)
  const [loading,            setLoading]            = useState(false)
  const [formData,           setFormData]           = useState({ ...INITIAL, email: vendorEmail })
  const [categories,         setCategories]         = useState([])
  const [businessCategories, setBusinessCategories] = useState([])

  // ── Country, State & Phone Formatting State ───────────────────────────────────
  const [selectedCountry, setSelectedCountry] = useState(getCountry('PK'))
  const [phone1Local,     setPhone1Local]     = useState('')
  const [phone2Local,     setPhone2Local]     = useState('')
  const [isCustomState,   setIsCustomState]   = useState(false)

  // ── Google Maps state ────────────────────────────────────────────────────────
  const mapRef       = useRef(null)
  const searchBoxRef = useRef(null)
  const [markerPos,  setMarkerPos]  = useState(null)
  const [mapCenter,  setMapCenter]  = useState(DEFAULT_CENTER)

  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAP_LIBRARIES,
  })

  const pinLocation = useCallback((lat, lng) => {
    const pos = { lat, lng }
    setMarkerPos(pos)
    setMapCenter(pos)
    setFormData(p => ({ ...p, latitude: lat, longitude: lng }))
  }, [])

  const handleMapClick       = useCallback(e => pinLocation(e.latLng.lat(), e.latLng.lng()), [pinLocation])
  const handleMarkerDragEnd  = useCallback(e => pinLocation(e.latLng.lat(), e.latLng.lng()), [pinLocation])

  const handleSearchChanged = useCallback(() => {
    const places = searchBoxRef.current?.getPlaces?.()
    if (!places?.length) return
    const loc = places[0].geometry?.location
    if (!loc) return
    pinLocation(loc.lat(), loc.lng())
  }, [pinLocation])

  const handleGetLiveLocation = () => {
    if (!navigator.geolocation) return toast.error('Geolocation not supported')
    navigator.geolocation.getCurrentPosition(
      pos => pinLocation(pos.coords.latitude, pos.coords.longitude),
      ()  => toast.error('Unable to get your location'),
    )
  }

  useEffect(() => {
    fetch('/api/customer/categories')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.data)) setCategories(d.data.map(c => ({ id: String(c.id), label: c.name }))) })
      .catch(err => console.error('Failed to fetch categories:', err))

    fetch('/api/business/categories')
      .then(r => r.json())
      .then(d => { if (d.success && Array.isArray(d.data)) setBusinessCategories(d.data) })
      .catch(err => console.error('Failed to fetch business categories:', err))
  }, [])

  const [isEmailUnverified,  setIsEmailUnverified]  = useState(false)

  // Auto-populate user data & existing business profile from database
  useEffect(() => {
    if (!vendorEmail) return

    fetch(`/api/users?email=${encodeURIComponent(vendorEmail)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.user) {
          const u = d.user
          if (!u.emailVerification) {
            setIsEmailUnverified(true)
          }
          const nameParts = (u.username || '').trim().split(' ')
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          if (u.phoneNumber) {
            const parsed = parsePhoneAndCountry(u.phoneNumber, selectedCountry.code)
            if (parsed.nationalNumber) {
              setPhone1Local(parsed.nationalNumber)
              if (parsed.country) setSelectedCountry(parsed.country)
            }
          }

          setFormData(p => ({
            ...p,
            email: u.email || p.email,
            firstName: p.firstName || firstName,
            lastName: p.lastName || lastName,
            phoneNumber1: p.phoneNumber1 || u.phoneNumber || '',
          }))
        }
      })
      .catch(() => {})

    fetch(`/api/vendor/profile?email=${encodeURIComponent(vendorEmail)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          const b = d.data
          const c = getCountry(b.country || 'PK')
          setSelectedCountry(c)

          const p1 = parsePhoneAndCountry(b.phoneNumber1, c.code)
          const p2 = parsePhoneAndCountry(b.phoneNumber2, c.code)
          if (p1.nationalNumber) setPhone1Local(p1.nationalNumber)
          if (p2.nationalNumber) setPhone2Local(p2.nationalNumber)

          if (b.state && !c.states.includes(b.state)) {
            setIsCustomState(true)
          }

          setFormData(p => ({
            ...p,
            country: b.country || c.name,
            businessName: b.businessName || p.businessName,
            categoryId: b.categoryId ? String(b.categoryId) : (b.category?.id ? String(b.category.id) : p.categoryId),
            businessCategoryId: b.businessCategoryId ? String(b.businessCategoryId) : p.businessCategoryId,
            businessTypeId: b.businessTypeId ? String(b.businessTypeId) : p.businessTypeId,
            firstName: b.firstName || p.firstName,
            lastName: b.lastName || p.lastName,
            cnicNo: b.cnicNo || p.cnicNo,
            phoneNumber1: b.phoneNumber1 || p.phoneNumber1,
            phoneNumber2: b.phoneNumber2 || p.phoneNumber2,
            buildingPlaceName: b.buildingPlaceName || p.buildingPlaceName,
            streetAddress: b.streetAddress || p.streetAddress,
            houseNumber: b.houseNumber || p.houseNumber,
            state: b.state || (c.states[0] || p.state),
            city: b.city || p.city,
            postalCode: b.postalCode || p.postalCode,
            urlCnicFront: b.urlCnicFront || p.urlCnicFront,
            urlCnicBack: b.urlCnicBack || p.urlCnicBack,
            ntnNo: b.ntnNo || p.ntnNo,
            bankName: b.bankName || p.bankName,
            bankIbanNo: b.bankIbanNo || p.bankIbanNo,
            bankAccountTitle: b.bankAccountTitle || p.bankAccountTitle,
            billingAddress: b.billingAddress || p.billingAddress,
            urlLogo: b.urlLogo || p.urlLogo,
            urlCoverPhoto: b.urlCoverPhoto || p.urlCoverPhoto,
            urlRestaurantImages: b.urlRestaurantImages || p.urlRestaurantImages,
            latitude: b.latitude ?? p.latitude,
            longitude: b.longitude ?? p.longitude,
          }))
          if (b.latitude && b.longitude) {
            const pos = { lat: b.latitude, lng: b.longitude }
            setMarkerPos(pos)
            setMapCenter(pos)
          }
        }
      })
      .catch(() => {})
  }, [vendorEmail])

  const onChange = e => {
    const { name, value } = e.target
    setFormData(p => ({
      ...p,
      [name]: value,
    }))
  }

  // ── Country change handler (auto synchronizes dialCode, masks, and state options) ──
  const handleCountryChange = (e) => {
    const code = e.target.value
    const c = getCountry(code)
    setSelectedCountry(c)
    setIsCustomState(false)

    // Reformat phone numbers under new country mask
    const reformat1 = formatNationalPhone(phone1Local, c.code)
    const reformat2 = formatNationalPhone(phone2Local, c.code)
    setPhone1Local(reformat1)
    setPhone2Local(reformat2)

    setFormData(p => ({
      ...p,
      country: c.name,
      state: c.states[0] || '',
      phoneNumber1: reformat1 ? buildFullPhoneNumber(reformat1, c.code) : '',
      phoneNumber2: reformat2 ? buildFullPhoneNumber(reformat2, c.code) : '',
    }))
  }

  // ── Phone 1 Change handler with live mask formatting ──
  const handlePhone1Change = (e) => {
    const raw = e.target.value
    const formatted = formatNationalPhone(raw, selectedCountry.code)
    setPhone1Local(formatted)
    setFormData(p => ({
      ...p,
      phoneNumber1: formatted ? buildFullPhoneNumber(formatted, selectedCountry.code) : '',
    }))
  }

  // ── Phone 2 Change handler with live mask formatting ──
  const handlePhone2Change = (e) => {
    const raw = e.target.value
    const formatted = formatNationalPhone(raw, selectedCountry.code)
    setPhone2Local(formatted)
    setFormData(p => ({
      ...p,
      phoneNumber2: formatted ? buildFullPhoneNumber(formatted, selectedCountry.code) : '',
    }))
  }

  const validateStep = () => {
    const d = formData
    const rules = {
      1: [d.firstName, d.lastName, d.email, d.cnicNo, d.phoneNumber1, d.country],
      2: [d.businessName, d.categoryId, d.businessCategoryId, d.businessTypeId, d.streetAddress, d.state, d.city, d.postalCode, d.country],
      3: [d.urlCnicFront, d.urlCnicBack],
      4: [d.bankName, d.bankIbanNo, d.bankAccountTitle, d.billingAddress],
      5: [],
    }
    return rules[step].every(v => v && String(v).trim())
  }

  const selectedBizCategory = businessCategories.find(bc => String(bc.id) === String(formData.businessCategoryId))
  const selectedProdCategory = categories.find(c => String(c.id) === String(formData.categoryId))
  const isRestaurantSelected = Boolean(
    selectedBizCategory?.categoryTitle?.toLowerCase() === 'restaurant' ||
    selectedProdCategory?.label?.toLowerCase() === 'restaurant'
  )

  const handleNext = () => {
    if (validateStep()) setStep(s => s + 1)
    else toast.error('Please fill all required fields.')
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/business/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:               formData.email,
          country:             formData.country || selectedCountry.name,
          businessName:        formData.businessName,
          categoryId:          formData.categoryId ? parseInt(formData.categoryId) : null,
          businessCategoryId:  formData.businessCategoryId ? parseInt(formData.businessCategoryId) : null,
          businessTypeId:      formData.businessTypeId ? parseInt(formData.businessTypeId) : null,
          firstName:           formData.firstName,
          lastName:            formData.lastName,
          cnicNo:              formData.cnicNo,
          phoneNumber1:        formData.phoneNumber1,
          phoneNumber2:        formData.phoneNumber2        || null,
          buildingPlaceName:   formData.buildingPlaceName  || null,
          streetAddress:       formData.streetAddress,
          houseNumber:         formData.houseNumber        || null,
          state:               formData.state,
          city:                formData.city,
          postalCode:          formData.postalCode,
          urlCnicFront:        formData.urlCnicFront,
          urlCnicBack:         formData.urlCnicBack,
          ntnNo:               formData.ntnNo              || null,
          bankName:            formData.bankName,
          bankIbanNo:          formData.bankIbanNo,
          bankAccountTitle:    formData.bankAccountTitle,
          billingAddress:      formData.billingAddress,
          urlLogo:             formData.urlLogo            || null,
          urlCoverPhoto:       formData.urlCoverPhoto      || null,
          urlRestaurantImages: formData.urlRestaurantImages || null,
          latitude:            formData.latitude  != null ? parseFloat(formData.latitude)  : null,
          longitude:           formData.longitude != null ? parseFloat(formData.longitude) : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Business registered! Our team will review and contact you.')
        router.push('/login')
      } else {
        toast.error(data.error || 'Registration failed.')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ═══════════════════════════ APP BAR ═══════════════════════════════ */}
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{
          maxWidth: 960, width: '100%', mx: 'auto',
          px: { xs: 2, sm: 3 }, justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 38, height: 38, bgcolor: BRAND, borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Inventory2OutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color={BRAND} lineHeight={1.2}>
                QuickDelivery
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1}>
                Business Registration
              </Typography>
            </Box>
          </Box>

          {/* Sign-in link */}
          <Button
            component={NextLink}
            href="/login"
            variant="text"
            size="small"
            sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: BRAND, bgcolor: 'transparent' } }}
          >
            Already a partner?&nbsp;<strong>Sign in</strong>
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>

        {/* ═══════════════ UNVERIFIED EMAIL WARNING BANNER ═════════════════ */}
        {isEmailUnverified && (
          <Alert
            severity="warning"
            sx={{ mb: 3, borderRadius: 0, fontWeight: 600 }}
            action={
              <Button component={NextLink} href="/register" color="inherit" size="small" sx={{ fontWeight: 800 }}>
                Verify Email Now
              </Button>
            }
          >
            Email verification required: Your account email is not yet verified. Please verify your email before submitting your business profile.
          </Alert>
        )}

        {/* ════════════════════════ STEPPER ════════════════════════════════ */}
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Stepper activeStep={step - 1} alternativeLabel connector={<PinkConnector />}>
            {STEPS.map(s => (
              <Step key={s.id} completed={step > s.id}>
                <StepLabel StepIconComponent={PinkStepIcon}>
                  <Typography
                    variant="caption"
                    fontWeight={step === s.id ? 700 : 400}
                    color={step === s.id ? BRAND : 'text.disabled'}
                  >
                    {s.title}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* ════════════════════════ FORM CARD ══════════════════════════════ */}
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>

          {/* ── Step content ─────────────────────────────────────────────── */}
          <Box sx={{ p: { xs: 3, sm: 4 } }}>
            <ThemeProvider theme={smallTheme}>
            <AnimatePresence mode="wait">

              {/* ─── STEP 1 · Personal Info ─────────────────────────────── */}
              {step === 1 && (
                <motion.div key="s1"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Personal Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Tell us about yourself — the business owner
                  </Typography>

                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="First Name" name="firstName"
                          value={formData.firstName} onChange={onChange}
                          placeholder="John" required sx={fieldSx}
                          InputProps={{ startAdornment: adornment(PersonOutlinedIcon) }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Last Name" name="lastName"
                          value={formData.lastName} onChange={onChange}
                          placeholder="Doe" required sx={fieldSx}
                          InputProps={{ startAdornment: adornment(PersonOutlinedIcon) }}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth label="Email Address" name="email" type="email"
                      value={formData.email} onChange={onChange}
                      placeholder="business@example.com" required sx={fieldSx}
                      disabled={isVendorFlow}
                      helperText={isVendorFlow ? 'Linked to your registered account' : undefined}
                      InputProps={{
                        startAdornment: adornment(EmailOutlinedIcon),
                        endAdornment: isVendorFlow
                          ? <InputAdornment position="end"><CheckCircleOutlinedIcon sx={{ color: BRAND, fontSize: 20 }} /></InputAdornment>
                          : undefined,
                      }}
                    />

                    {/* Country Selector with Flags */}
                    <FormControl fullWidth required sx={fieldSx}>
                      <InputLabel id="country-select-label">Country / Nationality</InputLabel>
                      <Select
                        labelId="country-select-label"
                        name="country"
                        label="Country / Nationality"
                        value={selectedCountry.code}
                        onChange={handleCountryChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <Typography sx={{ fontSize: 20, mr: 0.5, lineHeight: 1 }}>{selectedCountry.flag}</Typography>
                          </InputAdornment>
                        }
                      >
                        {COUNTRIES.map(c => (
                          <MenuItem key={c.code} value={c.code}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                <Typography sx={{ fontSize: 20, lineHeight: 1 }}>{c.flag}</Typography>
                                <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                              </Box>
                              <Chip label={c.dialCode} size="small" variant="outlined" sx={{ height: 22, fontSize: 11, fontWeight: 700 }} />
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth label="CNIC / National ID" name="cnicNo"
                      value={formData.cnicNo} onChange={onChange}
                      placeholder={selectedCountry.code === 'PK' ? "35201-1234567-1" : "National ID or Resident Permit #"} required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(CreditCardOutlinedIcon) }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Mobile Phone 1 (Primary)" name="phoneNumber1" type="tel"
                          value={phone1Local} onChange={handlePhone1Change}
                          placeholder={selectedCountry.placeholder}
                          helperText={`Format: ${selectedCountry.dialCode} ${selectedCountry.phoneMask}`}
                          required sx={fieldSx}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: '#f1f5f9', px: 1, py: 0.4, border: '1px solid #cbd5e1' }}>
                                  <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{selectedCountry.flag}</Typography>
                                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#334155' }}>{selectedCountry.dialCode}</Typography>
                                </Box>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Mobile Phone 2 (Optional)" name="phoneNumber2" type="tel"
                          value={phone2Local} onChange={handlePhone2Change}
                          placeholder={selectedCountry.placeholder}
                          helperText={`Format: ${selectedCountry.dialCode} ${selectedCountry.phoneMask}`}
                          sx={fieldSx}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, bgcolor: '#f1f5f9', px: 1, py: 0.4, border: '1px solid #cbd5e1' }}>
                                  <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{selectedCountry.flag}</Typography>
                                  <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: '#334155' }}>{selectedCountry.dialCode}</Typography>
                                </Box>
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Stack>
                </motion.div>
              )}

              {/* ─── STEP 2 · Business Details ──────────────────────────── */}
              {step === 2 && (
                <motion.div key="s2"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Business Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Tell us about your restaurant or store
                  </Typography>

                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth label="Business Name" name="businessName"
                      value={formData.businessName} onChange={onChange}
                      placeholder="e.g. The Pizza House" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(StoreOutlinedIcon) }}
                    />

                    <FormControl fullWidth required sx={{ ...fieldSx, minWidth: 240 }}>
                      <InputLabel id="category-select-label">Product Category</InputLabel>
                      <Select
                        labelId="category-select-label"
                        name="categoryId"
                        label="Product Category"
                        value={formData.categoryId}
                        onChange={(e) => {
                          const val = e.target.value
                          const prodCat = categories.find(c => String(c.id) === String(val))
                          const isRest = prodCat?.label?.toLowerCase() === 'restaurant'
                          setFormData(p => {
                            let newBizCatId = p.businessCategoryId
                            if (isRest) {
                              const restBizCat = businessCategories.find(bc => bc.categoryTitle?.toLowerCase() === 'restaurant')
                              if (restBizCat) newBizCatId = String(restBizCat.id)
                            }
                            return {
                              ...p,
                              categoryId: val,
                              businessCategoryId: newBizCatId,
                              ...(isRest ? { businessTypeId: '' } : {}),
                            }
                          })
                        }}
                        startAdornment={adornment(CategoryOutlinedIcon)}
                      >
                        <MenuItem value="" disabled><em>Select product category…</em></MenuItem>
                        {categories.map(o => (
                          <MenuItem key={o.id} value={o.id}>
                            {o.label.toLowerCase() === 'restaurant' ? '🍽️ Restaurant' : o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required sx={{ ...fieldSx, minWidth: 240 }}>
                          <InputLabel id="biz-category-select-label">Business Category</InputLabel>
                          <Select
                            labelId="biz-category-select-label"
                            name="businessCategoryId"
                            label="Business Category"
                            value={formData.businessCategoryId}
                            onChange={(e) => {
                              const val = e.target.value
                              const bizCat = businessCategories.find(bc => String(bc.id) === String(val))
                              const isRest = bizCat?.categoryTitle?.toLowerCase() === 'restaurant'
                              setFormData(p => {
                                let newCatId = p.categoryId
                                if (isRest) {
                                  const restProdCat = categories.find(c => c.label?.toLowerCase() === 'restaurant')
                                  if (restProdCat) newCatId = restProdCat.id
                                }
                                return {
                                  ...p,
                                  businessCategoryId: val,
                                  businessTypeId: '',
                                  categoryId: newCatId,
                                }
                              })
                            }}
                            startAdornment={adornment(StorefrontOutlinedIcon)}
                          >
                            <MenuItem value="" disabled><em>Select business category…</em></MenuItem>
                            {businessCategories.map(bc => (
                              <MenuItem key={bc.id} value={String(bc.id)}>
                                {bc.categoryTitle.toLowerCase() === 'restaurant' ? '🍽️ Restaurant' : bc.categoryTitle}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required sx={{ ...fieldSx, minWidth: 240 }} disabled={!formData.businessCategoryId}>
                          <InputLabel id="biz-type-select-label">Business Type</InputLabel>
                          <Select
                            labelId="biz-type-select-label"
                            name="businessTypeId"
                            label="Business Type"
                            value={formData.businessTypeId}
                            onChange={onChange}
                            startAdornment={adornment(BusinessOutlinedIcon)}
                          >
                            <MenuItem value="" disabled><em>{formData.businessCategoryId ? 'Select business type…' : 'Select a category first'}</em></MenuItem>
                            {(businessCategories.find(bc => String(bc.id) === String(formData.businessCategoryId))?.businessTypes || []).map(bt => (
                              <MenuItem key={bt.id} value={String(bt.id)}>{bt.typeTitle}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

                    {/* Scoped Restaurant Mode Banner */}
                    {isRestaurantSelected && (
                      <Box sx={{ p: 2, bgcolor: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                        <Box sx={{ fontSize: 22, lineHeight: 1 }}>🍽️</Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={800} color="#166534">
                            RESTAURANT BUSINESS CATEGORY ACTIVE
                          </Typography>
                          <Typography variant="caption" color="#15803d">
                            Your store is registered under culinary & dining verticals. Only relevant restaurant cuisines, preparation timings, and food certifications will apply to your vendor portal.
                          </Typography>
                        </Box>
                      </Box>
                    )}



                    <Divider>
                      <Chip
                        icon={<LocationOnOutlinedIcon />}
                        label="Business Location"
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: `${BRAND}55`, color: BRAND,
                          '& .MuiChip-icon': { color: BRAND },
                        }}
                      />
                    </Divider>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Building / Place Name (Optional)" name="buildingPlaceName"
                          value={formData.buildingPlaceName} onChange={onChange}
                          placeholder="e.g. City Mall, Ground Floor" sx={fieldSx}
                          InputProps={{ startAdornment: adornment(HomeOutlinedIcon) }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Shop / Unit No. (Optional)" name="houseNumber"
                          value={formData.houseNumber} onChange={onChange}
                          placeholder="e.g. 12-A" sx={fieldSx}
                          InputProps={{ startAdornment: adornment(NumbersOutlinedIcon) }}
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth label="Street Address" name="streetAddress"
                      value={formData.streetAddress} onChange={onChange}
                      placeholder="e.g. Main Boulevard, Gulberg III" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(LocationOnOutlinedIcon) }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        {/* Country Selector */}
                        <FormControl fullWidth required sx={fieldSx}>
                          <InputLabel id="biz-country-select-label">Country / Region</InputLabel>
                          <Select
                            labelId="biz-country-select-label"
                            name="country"
                            label="Country / Region"
                            value={selectedCountry.code}
                            onChange={handleCountryChange}
                            startAdornment={
                              <InputAdornment position="start">
                                <Typography sx={{ fontSize: 18, mr: 0.5, lineHeight: 1 }}>{selectedCountry.flag}</Typography>
                              </InputAdornment>
                            }
                          >
                            {COUNTRIES.map(c => (
                              <MenuItem key={c.code} value={c.code}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography sx={{ fontSize: 18, lineHeight: 1 }}>{c.flag}</Typography>
                                  <Typography sx={{ fontWeight: 600 }}>{c.name}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        {/* Dynamic State / Province Selector */}
                        {isCustomState ? (
                          <TextField
                            fullWidth
                            label="State / Province"
                            name="state"
                            value={formData.state}
                            onChange={onChange}
                            placeholder="Enter state or province"
                            required
                            sx={fieldSx}
                            InputProps={{
                              startAdornment: adornment(PublicOutlinedIcon),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <Button
                                    size="small"
                                    onClick={() => {
                                      setIsCustomState(false)
                                      if (selectedCountry.states?.length) {
                                        setFormData(p => ({ ...p, state: selectedCountry.states[0] }))
                                      }
                                    }}
                                    sx={{ textTransform: 'none', fontSize: 11, p: 0.5, minWidth: 0, color: BRAND }}
                                  >
                                    List
                                  </Button>
                                </InputAdornment>
                              ),
                            }}
                          />
                        ) : (
                          <FormControl fullWidth required sx={fieldSx}>
                            <InputLabel id="biz-state-select-label">State / Province</InputLabel>
                            <Select
                              labelId="biz-state-select-label"
                              name="state"
                              label="State / Province"
                              value={formData.state}
                              onChange={(e) => {
                                if (e.target.value === '__OTHER__') {
                                  setIsCustomState(true)
                                  setFormData(p => ({ ...p, state: '' }))
                                } else {
                                  setFormData(p => ({ ...p, state: e.target.value }))
                                }
                              }}
                              startAdornment={adornment(PublicOutlinedIcon)}
                            >
                              <MenuItem value="" disabled><em>Select state / province…</em></MenuItem>
                              {(selectedCountry.states || []).map(st => (
                                <MenuItem key={st} value={st}>{st}</MenuItem>
                              ))}
                              <Divider sx={{ my: 0.5 }} />
                              <MenuItem value="__OTHER__" sx={{ color: BRAND, fontWeight: 700 }}>
                                + Other / Custom State...
                              </MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </Grid>

                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth label="City" name="city"
                          value={formData.city} onChange={onChange}
                          placeholder={selectedCountry.code === 'PK' ? "Lahore" : (selectedCountry.code === 'SA' ? "Riyadh" : "Dubai")} required sx={fieldSx}
                          InputProps={{ startAdornment: adornment(PublicOutlinedIcon) }}
                        />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth label="Postal Code" name="postalCode"
                          value={formData.postalCode} onChange={onChange}
                          placeholder="54000" required sx={fieldSx}
                          InputProps={{ startAdornment: adornment(NumbersOutlinedIcon) }}
                        />
                      </Grid>
                    </Grid>

                    {/* ── Google Maps pin ──────────────────────────────── */}
                    <Divider>
                      <Chip
                        icon={<PinDropOutlinedIcon />}
                        label="Pin Location on Map"
                        size="small"
                        variant="outlined"
                        sx={{ borderColor: `${BRAND}55`, color: BRAND, '& .MuiChip-icon': { color: BRAND } }}
                      />
                    </Divider>

                    <Typography variant="body2" color="text.secondary">
                      Search your address or click/drag the pin to set your exact business location (optional but recommended).
                    </Typography>

                    {mapsLoaded ? (
                      <Box>
                        <StandaloneSearchBox
                          onLoad={ref => (searchBoxRef.current = ref)}
                          onPlacesChanged={handleSearchChanged}
                        >
                          <TextField
                            fullWidth
                            label="Search address"
                            placeholder="Search for your business address…"
                            sx={{ ...fieldSx, mb: 1.5 }}
                            InputProps={{ startAdornment: adornment(LocationOnOutlinedIcon) }}
                          />
                        </StandaloneSearchBox>

                        <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                          <GoogleMap
                            mapContainerStyle={MAP_CONTAINER}
                            center={mapCenter}
                            zoom={13}
                            onClick={handleMapClick}
                            onLoad={map => (mapRef.current = map)}
                            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                          >
                            {markerPos && (
                              <Marker
                                position={markerPos}
                                draggable
                                onDragEnd={handleMarkerDragEnd}
                              />
                            )}
                          </GoogleMap>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, flexWrap: 'wrap', gap: 1 }}>
                          <Button
                            variant="outlined" size="small"
                            startIcon={<MyLocationIcon />}
                            onClick={handleGetLiveLocation}
                            sx={{ textTransform: 'none', borderColor: BRAND, color: BRAND, '&:hover': { bgcolor: `${BRAND}08`, borderColor: BRAND } }}
                          >
                            Use My Current Location
                          </Button>

                          {markerPos && (
                            <Alert severity="success" icon={<LocationOnOutlinedIcon fontSize="small" />} sx={{ py: 0, flex: 1, minWidth: 200 }}>
                              {markerPos.lat.toFixed(5)}, {markerPos.lng.toFixed(5)}
                            </Alert>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
                        <CircularProgress size={18} sx={{ color: BRAND }} />
                        <Typography variant="body2" color="text.secondary">Loading map…</Typography>
                      </Box>
                    )}
                  </Stack>
                </motion.div>
              )}

              {/* ─── STEP 3 · Documents ─────────────────────────────────── */}
              {step === 3 && (
                <motion.div key="s3"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Identity Documents
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Provide your CNIC image URLs and optional tax info
                  </Typography>

                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <ImageUploadField
                          label="CNIC Front Image"
                          required
                          value={formData.urlCnicFront}
                          onChange={(url) => setFormData(p => ({ ...p, urlCnicFront: url }))}
                          helperText="JPG, PNG or WebP — front side of your CNIC"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ImageUploadField
                          label="CNIC Back Image"
                          required
                          value={formData.urlCnicBack}
                          onChange={(url) => setFormData(p => ({ ...p, urlCnicBack: url }))}
                          helperText="JPG, PNG or WebP — back side of your CNIC"
                        />
                      </Grid>
                    </Grid>

                    <TextField
                      fullWidth label="NTN Number (Optional)" name="ntnNo"
                      value={formData.ntnNo} onChange={onChange}
                      placeholder="e.g. 1234567-8" sx={fieldSx}
                      InputProps={{ startAdornment: adornment(NumbersOutlinedIcon) }}
                    />
                  </Stack>
                </motion.div>
              )}

              {/* ─── STEP 4 · Banking ───────────────────────────────────── */}
              {step === 4 && (
                <motion.div key="s4"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Banking Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Where should we send your earnings?
                  </Typography>

                  <Stack spacing={2.5}>
                    <TextField
                      fullWidth label="Bank Name" name="bankName"
                      value={formData.bankName} onChange={onChange}
                      placeholder="e.g. HBL, MCB, UBL, Meezan" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(AccountBalanceOutlinedIcon) }}
                    />

                    <TextField
                      fullWidth label="IBAN Number" name="bankIbanNo"
                      value={formData.bankIbanNo} onChange={onChange}
                      placeholder="PK36SCBL0000001123456702" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(NumbersOutlinedIcon) }}
                    />

                    <TextField
                      fullWidth label="Account Title" name="bankAccountTitle"
                      value={formData.bankAccountTitle} onChange={onChange}
                      placeholder="Full name as on bank account" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(PersonOutlinedIcon) }}
                    />

                    <TextField
                      fullWidth multiline rows={2}
                      label="Billing Address" name="billingAddress"
                      value={formData.billingAddress} onChange={onChange}
                      placeholder="Full billing address" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(LocationOnOutlinedIcon) }}
                    />
                  </Stack>
                </motion.div>
              )}

              {/* ─── STEP 5 · Branding ──────────────────────────────────── */}
              {step === 5 && (
                <motion.div key="s5"
                  initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}
                >
                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    Branding &amp; Images
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={3}>
                    Make your page stand out — all fields are optional
                  </Typography>

                  <Stack spacing={2.5}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <ImageUploadField
                          label="Business Logo (Optional)"
                          value={formData.urlLogo}
                          onChange={(url) => setFormData(p => ({ ...p, urlLogo: url }))}
                          helperText="Square logo — PNG or WebP recommended"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ImageUploadField
                          label="Cover Photo (Optional)"
                          value={formData.urlCoverPhoto}
                          onChange={(url) => setFormData(p => ({ ...p, urlCoverPhoto: url }))}
                          helperText="Wide banner shown at the top of your page"
                        />
                      </Grid>
                    </Grid>

                    <ImageUploadField
                      label={isRestaurantSelected ? "Kitchen & Dining Showcase Image (Optional)" : "Restaurant / Store Image (Optional)"}
                      value={formData.urlRestaurantImages}
                      onChange={(url) => setFormData(p => ({ ...p, urlRestaurantImages: url }))}
                      helperText={isRestaurantSelected ? "Photo of your kitchen hygiene, dining hall, or signature culinary presentation" : "A photo of your restaurant or store front"}
                    />

                    {/* ── Summary ── */}
                    <Paper variant="outlined" sx={{ p: 2.5, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Registration Summary
                      </Typography>
                      <Stack spacing={0.75}>
                        {[
                          ['Business', formData.businessName],
                          ['Owner',    `${formData.firstName} ${formData.lastName}`],
                          ['Email',    formData.email],
                          ['Phone',    formData.phoneNumber1],
                          ['Country',  `${selectedCountry.flag} ${formData.country || selectedCountry.name}`],
                          ['Location', `${formData.city}, ${formData.state}`],
                        ].map(([key, val]) => (
                          <Box key={key} sx={{ display: 'flex', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 76 }}>
                              {key}:
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>{val}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Stack>
                </motion.div>
              )}

            </AnimatePresence>
            </ThemeProvider>
          </Box>

          {/* ── Footer nav ──────────────────────────────────────────────── */}
          <Box sx={{
            px: { xs: 3, sm: 4 }, py: 2.5,
            bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {/* Back / Login */}
            {step > 1 ? (
              <Button
                variant="outlined"
                startIcon={<ChevronLeftIcon />}
                onClick={() => setStep(s => s - 1)}
                sx={{ textTransform: 'none', borderColor: 'divider', color: 'text.secondary',
                      '&:hover': { borderColor: 'text.secondary' } }}
              >
                Back
              </Button>
            ) : (
              <Button
                component={NextLink} href="/login"
                variant="outlined"
                startIcon={<ChevronLeftIcon />}
                sx={{ textTransform: 'none', borderColor: 'divider', color: 'text.secondary',
                      '&:hover': { borderColor: 'text.secondary' } }}
              >
                Login
              </Button>
            )}

            {/* Continue / Submit */}
            {step < STEPS.length ? (
              <Button
                variant="contained"
                endIcon={<ChevronRightIcon />}
                onClick={handleNext}
                sx={{
                  textTransform: 'none', fontWeight: 700, px: 3.5,
                  bgcolor: BRAND, '&:hover': { bgcolor: '#2E5F22' },
                  boxShadow: `0 4px 12px ${BRAND}44`,
                }}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading
                  ? <CircularProgress size={16} color="inherit" />
                  : <CheckIcon />
                }
                sx={{
                  textTransform: 'none', fontWeight: 700, px: 3.5,
                  bgcolor: BRAND, '&:hover': { bgcolor: '#2E5F22' },
                  boxShadow: `0 4px 12px ${BRAND}44`,
                }}
              >
                {loading ? 'Submitting…' : 'Submit Registration'}
              </Button>
            )}
          </Box>
        </Paper>

        {/* Terms */}
        <Typography variant="caption" color="text.secondary" display="block" align="center" mt={3}>
          By registering you agree to our{' '}
          <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
            Terms of Service
          </Box>{' '}and{' '}
          <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', '&:hover': { color: 'text.primary' } }}>
            Privacy Policy
          </Box>.
        </Typography>
      </Container>
    </Box>
  )
}

// ─── Default export — wraps in Suspense for useSearchParams ──────────────────
export default function BusinessRegisterPage() {
  return (
    <Suspense fallback={<Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }} />}>
      <BusinessRegisterInner />
    </Suspense>
  )
}
