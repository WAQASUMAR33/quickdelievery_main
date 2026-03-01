'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import NextLink from 'next/link'
import toast from 'react-hot-toast'
import { styled } from '@mui/material/styles'
import ImageUploadField from '@/components/ui/ImageUploadField'

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
import ChevronRightIcon           from '@mui/icons-material/ChevronRight'
import ChevronLeftIcon            from '@mui/icons-material/ChevronLeft'
// Filled — used inside Stepper icon
import PersonIcon         from '@mui/icons-material/Person'
import StoreIcon          from '@mui/icons-material/Store'
import DescriptionIcon    from '@mui/icons-material/Description'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CameraAltIcon      from '@mui/icons-material/CameraAlt'

// ─── Brand colour ─────────────────────────────────────────────────────────────
const BRAND = '#D70F64'

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
  businessName: '', businessTypeId: '', businessCategoryId: '',
  buildingPlaceName: '', streetAddress: '', houseNumber: '', state: '', city: '', postalCode: '',
  urlCnicFront: '', urlCnicBack: '', ntnNo: '',
  bankName: '', bankIbanNo: '', bankAccountTitle: '', billingAddress: '',
  urlLogo: '', urlCoverPhoto: '', urlRestaurantImages: '',
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
    <Icon sx={{ color: 'action.active', fontSize: 20 }} />
  </InputAdornment>
)

// ─── Page (inner — needs useSearchParams) ────────────────────────────────────
function BusinessRegisterInner() {
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const vendorEmail   = searchParams.get('email') || ''   // passed from /register for VENDOR flow
  const isVendorFlow  = !!vendorEmail

  const [step,               setStep]               = useState(1)
  const [loading,            setLoading]            = useState(false)
  const [formData,           setFormData]           = useState({ ...INITIAL, email: vendorEmail })
  const [businessTypes,      setBusinessTypes]      = useState([])
  const [businessCategories, setBusinessCategories] = useState([])

  useEffect(() => {
    fetch('/api/business-types')
      .then(r => r.json())
      .then(d => { if (d.success) setBusinessTypes(d.data.map(t => ({ id: t.id, label: t.typeTitle }))) })
      .catch(() => {})

    fetch('/api/business-categories')
      .then(r => r.json())
      .then(d => { if (d.success) setBusinessCategories(d.data.map(c => ({ id: c.id, label: c.categoryTitle }))) })
      .catch(() => {})
  }, [])

  const onChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const validateStep = () => {
    const d = formData
    const rules = {
      1: [d.firstName, d.lastName, d.email, d.cnicNo, d.phoneNumber1],
      2: [d.businessName, d.businessTypeId, d.businessCategoryId, d.streetAddress, d.state, d.city, d.postalCode],
      3: [d.urlCnicFront, d.urlCnicBack],
      4: [d.bankName, d.bankIbanNo, d.bankAccountTitle, d.billingAddress],
      5: [],
    }
    return rules[step].every(v => v && String(v).trim())
  }

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
          businessName:        formData.businessName,
          firstName:           formData.firstName,
          lastName:            formData.lastName,
          cnicNo:              formData.cnicNo,
          businessTypeId:      parseInt(formData.businessTypeId),
          businessCategoryId:  parseInt(formData.businessCategoryId),
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
                foodpanda
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

        {/* ═══════════════ VENDOR ONBOARDING BANNER ════════════════════════ */}
        {isVendorFlow && (
          <Paper
            variant="outlined"
            sx={{
              mb: 3, p: 2.5, borderRadius: 3,
              borderColor: `${BRAND}44`,
              bgcolor: `${BRAND}08`,
              display: 'flex', gap: 2, alignItems: 'flex-start',
            }}
          >
            <StorefrontOutlinedIcon sx={{ color: BRAND, mt: 0.25, flexShrink: 0 }} />
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color={BRAND} gutterBottom>
                Complete Your Vendor Profile — Step 2 of 2
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your account has been created successfully. Now set up your business
                profile so customers can find and order from your store.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                {[
                  'Account created',
                  'Business details',
                  'Banking & payout',
                ].map((label, i) => (
                  <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleOutlinedIcon sx={{ fontSize: 16, color: i === 0 ? BRAND : 'text.disabled' }} />
                    <Typography variant="caption" color={i === 0 ? BRAND : 'text.disabled'} fontWeight={i === 0 ? 700 : 400}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
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

                    <TextField
                      fullWidth label="CNIC Number" name="cnicNo"
                      value={formData.cnicNo} onChange={onChange}
                      placeholder="35201-1234567-1" required sx={fieldSx}
                      InputProps={{ startAdornment: adornment(CreditCardOutlinedIcon) }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Phone Number 1" name="phoneNumber1" type="tel"
                          value={formData.phoneNumber1} onChange={onChange}
                          placeholder="+92 300 1234567" required sx={fieldSx}
                          InputProps={{ startAdornment: adornment(PhoneOutlinedIcon) }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth label="Phone Number 2 (Optional)" name="phoneNumber2" type="tel"
                          value={formData.phoneNumber2} onChange={onChange}
                          placeholder="+92 321 7654321" sx={fieldSx}
                          InputProps={{ startAdornment: adornment(PhoneOutlinedIcon) }}
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

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required sx={{ ...fieldSx, minWidth: 300 }}>
                          <InputLabel>Business Type</InputLabel>
                          <Select
                            name="businessTypeId" label="Business Type"
                            value={formData.businessTypeId} onChange={onChange}
                            startAdornment={adornment(BusinessOutlinedIcon)}
                          >
                            <MenuItem value="" disabled><em>Select type…</em></MenuItem>
                            {businessTypes.map(o => (
                              <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth required sx={{ ...fieldSx, minWidth: 300 }}>
                          <InputLabel>Business Category</InputLabel>
                          <Select
                            name="businessCategoryId" label="Business Category"
                            value={formData.businessCategoryId} onChange={onChange}
                            startAdornment={adornment(CategoryOutlinedIcon)}
                          >
                            <MenuItem value="" disabled><em>Select category…</em></MenuItem>
                            {businessCategories.map(o => (
                              <MenuItem key={o.id} value={o.id}>{o.label}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>

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
                        <TextField
                          fullWidth label="City" name="city"
                          value={formData.city} onChange={onChange}
                          placeholder="Lahore" required sx={fieldSx}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth label="State / Province" name="state"
                          value={formData.state} onChange={onChange}
                          placeholder="Punjab" required sx={fieldSx}
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          fullWidth label="Postal Code" name="postalCode"
                          value={formData.postalCode} onChange={onChange}
                          placeholder="54000" required sx={fieldSx}
                        />
                      </Grid>
                    </Grid>
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
                      label="Restaurant / Store Image (Optional)"
                      value={formData.urlRestaurantImages}
                      onChange={(url) => setFormData(p => ({ ...p, urlRestaurantImages: url }))}
                      helperText="A photo of your restaurant or store front"
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
                  bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' },
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
                  bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' },
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
