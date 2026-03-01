'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import NextLink from 'next/link'

import Box              from '@mui/material/Box'
import Paper            from '@mui/material/Paper'
import Typography       from '@mui/material/Typography'
import Stack            from '@mui/material/Stack'
import Grid             from '@mui/material/Grid'
import TextField        from '@mui/material/TextField'
import InputAdornment   from '@mui/material/InputAdornment'
import IconButton       from '@mui/material/IconButton'
import Button           from '@mui/material/Button'
import Alert            from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import Chip             from '@mui/material/Chip'

// MUI Icons
import PersonOutlinedIcon             from '@mui/icons-material/PersonOutlined'
import EmailOutlinedIcon              from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon              from '@mui/icons-material/PhoneOutlined'
import LockOutlinedIcon               from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon         from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon      from '@mui/icons-material/VisibilityOffOutlined'
import ArrowForwardIcon               from '@mui/icons-material/ArrowForward'
import ArrowBackIcon                  from '@mui/icons-material/ArrowBack'
import CheckIcon                      from '@mui/icons-material/Check'
import StorefrontOutlinedIcon         from '@mui/icons-material/StorefrontOutlined'
import LocalShippingOutlinedIcon      from '@mui/icons-material/LocalShippingOutlined'
import ShoppingCartOutlinedIcon       from '@mui/icons-material/ShoppingCartOutlined'
import RestaurantOutlinedIcon         from '@mui/icons-material/RestaurantOutlined'
import ShoppingBagOutlinedIcon        from '@mui/icons-material/ShoppingBagOutlined'
import Inventory2Icon                 from '@mui/icons-material/Inventory2'
import CheckCircleIcon                from '@mui/icons-material/CheckCircle'

// ─── Brand colour ─────────────────────────────────────────────────────────────
const BRAND = '#D70F64'

// ─── Role definitions ─────────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'CUSTOMER',
    label: 'Customer',
    subtitle: 'Order food & essentials',
    Icon: ShoppingCartOutlinedIcon,
    color: '#7C3AED',
    gradient: 'linear-gradient(135deg, #7C3AED22, #7C3AED08)',
    perks: ['Browse restaurants & stores', 'Real-time order tracking', 'Exclusive deals & offers'],
  },
  {
    value: 'VENDOR',
    label: 'Vendor / Restaurant',
    subtitle: 'Sell your products',
    Icon: StorefrontOutlinedIcon,
    color: BRAND,
    gradient: `linear-gradient(135deg, ${BRAND}22, ${BRAND}08)`,
    perks: ['List your menu or products', 'Manage orders in real-time', 'Fast & secure payouts'],
  },
  {
    value: 'DRIVER',
    label: 'Delivery Driver',
    subtitle: 'Deliver & earn',
    Icon: LocalShippingOutlinedIcon,
    color: '#059669',
    gradient: 'linear-gradient(135deg, #05966922, #05966908)',
    perks: ['Flexible working hours', 'Earn per delivery', 'GPS-assisted navigation'],
  },
]

// ─── Shared TextField sx ──────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset':       { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& label.Mui-focused': { color: BRAND },
}

const adornment = Icon => (
  <InputAdornment position="start">
    <Icon sx={{ color: 'action.active', fontSize: 20 }} />
  </InputAdornment>
)

// ─── Slide variants ───────────────────────────────────────────────────────────
const slideIn  = { hidden: { opacity: 0, x: 40 },  visible: { opacity: 1, x: 0 },  exit: { opacity: 0, x: -40 }  }
const slideOut = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0 },  exit: { opacity: 0, x: 40 }   }

// ─── Left branding panel ──────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <Box sx={{
      display: { xs: 'none', lg: 'flex' },
      width: '45%', flexShrink: 0,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 6, position: 'sticky', top: 0, height: '100vh',
      background: `linear-gradient(155deg, ${BRAND} 0%, #FF1F8D 60%, #FF6B6B 100%)`,
      overflow: 'hidden',
    }}>
      {/* Decorative blobs */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', top: -60, left: -60, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', filter: 'blur(40px)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, right: -80, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', filter: 'blur(60px)' }} />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 5 }}>
            <Box sx={{ width: 60, height: 60, bgcolor: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
              <Typography variant="h5" fontWeight={900} color={BRAND}>FP</Typography>
            </Box>
            <Typography variant="h3" fontWeight={900} letterSpacing={-1}>foodpanda</Typography>
          </Box>
        </motion.div>

        {/* Illustration */}
        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 5 }}>
            <Box sx={{
              width: 220, height: 220,
              bgcolor: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: '32px',
              border: '1px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Inventory2Icon sx={{ fontSize: 90, color: '#fff' }} />
            </Box>

            <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 2.8, repeat: Infinity }}
              style={{ position: 'absolute', top: -18, right: -18 }}>
              <Paper elevation={12} sx={{ width: 56, height: 56, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RestaurantOutlinedIcon sx={{ fontSize: 28, color: BRAND }} />
              </Paper>
            </motion.div>

            <motion.div animate={{ y: [0, 14, 0] }} transition={{ duration: 2.8, repeat: Infinity, delay: 0.5 }}
              style={{ position: 'absolute', bottom: -18, left: -18 }}>
              <Paper elevation={12} sx={{ width: 56, height: 56, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagOutlinedIcon sx={{ fontSize: 28, color: BRAND }} />
              </Paper>
            </motion.div>
          </Box>
        </motion.div>

        {/* Tagline */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
          <Typography variant="h4" fontWeight={800} gutterBottom sx={{ lineHeight: 1.2 }}>
            Join foodpanda
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 280, mx: 'auto' }}>
            Connect with thousands of customers. Start your journey today.
          </Typography>
        </motion.div>
      </Box>
    </Box>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const { signUp } = useAuth()
  const router     = useRouter()

  // phase: 'select' | 'form'
  const [phase,    setPhase]    = useState('select')
  const [formData, setFormData] = useState({
    email: '', password: '', confirmPassword: '',
    displayName: '', phoneNumber: '', role: '', type: 'local',
  })
  const [showPassword,        setShowPassword]        = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading,             setLoading]             = useState(false)
  const [error,               setError]               = useState('')

  const selectedRole = ROLES.find(r => r.value === formData.role)

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))

  const selectRole = (value) => {
    setFormData(p => ({ ...p, role: value }))
  }

  const continueToForm = () => {
    if (formData.role) setPhase('form')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return }
    if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    try {
      const result = await signUp(
        formData.email, formData.password, formData.displayName,
        formData.phoneNumber, formData.role, formData.type,
      )
      if (result.success) {
        if (formData.role === 'VENDOR') {
          router.push(`/business-register?email=${encodeURIComponent(formData.email)}`)
        } else {
          router.push('/login')
        }
      } else {
        setError(result.error || 'Registration failed. Please try again.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <BrandPanel />

      {/* ══════ RIGHT PANEL ══════════════════════════════════════════════════ */}
      <Box sx={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minHeight: '100vh', overflowY: 'auto', bgcolor: 'background.paper',
      }}>
        {/* Top bar */}
        <Box sx={{
          px: { xs: 3, sm: 5 }, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: 1, borderColor: 'divider',
          position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10,
        }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, bgcolor: BRAND, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" fontWeight={900} color="#fff">FP</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color={BRAND}>foodpanda</Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', lg: 'block' } }} /> {/* spacer */}

          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Box component={NextLink} href="/login"
              sx={{ color: BRAND, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Sign In
            </Box>
          </Typography>
        </Box>

        {/* ── Main content ── */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 5 } }}>
          <Box sx={{ width: '100%', maxWidth: 560 }}>
            <AnimatePresence mode="wait">

              {/* ════ PHASE 1: Role Selection ════════════════════════════════ */}
              {phase === 'select' && (
                <motion.div
                  key="select"
                  variants={slideIn}
                  initial="hidden" animate="visible" exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {/* Header */}
                  <Box mb={4}>
                    <Typography variant="h4" fontWeight={800} gutterBottom>
                      Create your account
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Choose the account type that fits you best
                    </Typography>
                  </Box>

                  {/* Role cards */}
                  <Grid container spacing={2} mb={4}>
                    {ROLES.map(role => {
                      const active = formData.role === role.value
                      return (
                        <Grid item xs={12} sm={6} key={role.value}>
                          <Paper
                            variant="outlined"
                            onClick={() => selectRole(role.value)}
                            sx={{
                              p: 2.5, cursor: 'pointer', height: '100%',
                              borderWidth: 2,
                              borderColor: active ? role.color : 'divider',
                              background: active ? role.gradient : 'background.paper',
                              position: 'relative', overflow: 'hidden',
                              transition: 'all 0.22s ease',
                              '&:hover': {
                                borderColor: role.color,
                                background: role.gradient,
                                transform: 'translateY(-2px)',
                                boxShadow: `0 8px 24px ${role.color}22`,
                              },
                            }}
                          >
                            {/* Selected check */}
                            {active && (
                              <Box sx={{
                                position: 'absolute', top: 10, right: 10,
                                width: 22, height: 22, borderRadius: '50%',
                                bgcolor: role.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                              </Box>
                            )}

                            {/* Icon */}
                            <Box sx={{
                              width: 48, height: 48, borderRadius: 2.5, mb: 1.5,
                              bgcolor: active ? role.color : `${role.color}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.22s',
                            }}>
                              <role.Icon sx={{ fontSize: 26, color: active ? '#fff' : role.color }} />
                            </Box>

                            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                              {role.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                              {role.subtitle}
                            </Typography>

                            {/* Perks */}
                            <Stack spacing={0.6}>
                              {role.perks.map(perk => (
                                <Box key={perk} sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75 }}>
                                  <CheckCircleIcon sx={{ fontSize: 14, color: role.color, mt: '2px', flexShrink: 0 }} />
                                  <Typography variant="caption" color="text.secondary" lineHeight={1.4}>
                                    {perk}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Paper>
                        </Grid>
                      )
                    })}
                  </Grid>

                  {/* Continue */}
                  <Button
                    fullWidth variant="contained" size="large"
                    onClick={continueToForm}
                    disabled={!formData.role}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      py: 1.6, fontWeight: 700, fontSize: '1rem', textTransform: 'none',
                      bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' },
                      boxShadow: formData.role ? `0 6px 20px ${BRAND}44` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {formData.role
                      ? `Continue as ${selectedRole?.label}`
                      : 'Select an account type to continue'
                    }
                  </Button>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ textAlign: 'center' }}>
                    <Button
                      component={NextLink} href="/"
                      variant="text" size="small"
                      startIcon={<ArrowBackIcon />}
                      sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: BRAND, bgcolor: 'transparent' } }}
                    >
                      Back to Home
                    </Button>
                  </Box>
                </motion.div>
              )}

              {/* ════ PHASE 2: Registration Form ═════════════════════════════ */}
              {phase === 'form' && (
                <motion.div
                  key="form"
                  variants={slideOut}
                  initial="hidden" animate="visible" exit="exit"
                  transition={{ duration: 0.3 }}
                >
                  {/* Header with back + role badge */}
                  <Box mb={4}>
                    <Button
                      variant="text" size="small"
                      startIcon={<ArrowBackIcon />}
                      onClick={() => { setPhase('select'); setError('') }}
                      sx={{ textTransform: 'none', color: 'text.secondary', mb: 2, pl: 0,
                            '&:hover': { color: BRAND, bgcolor: 'transparent' } }}
                    >
                      Change account type
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Typography variant="h4" fontWeight={800}>Create Account</Typography>
                      {selectedRole && (
                        <Chip
                          icon={<selectedRole.Icon sx={{ fontSize: '16px !important' }} />}
                          label={selectedRole.label}
                          size="small"
                          sx={{
                            bgcolor: `${selectedRole.color}18`,
                            color: selectedRole.color,
                            fontWeight: 700,
                            border: `1px solid ${selectedRole.color}44`,
                            '& .MuiChip-icon': { color: selectedRole.color },
                          }}
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Fill in your details to get started
                    </Typography>
                  </Box>

                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2.5}>

                      {/* Error */}
                      <AnimatePresence>
                        {error && (
                          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Name + Phone */}
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth label="Full Name" name="displayName"
                            value={formData.displayName} onChange={handleChange}
                            placeholder="John Doe" required sx={fieldSx}
                            InputProps={{ startAdornment: adornment(PersonOutlinedIcon) }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth label="Phone Number" name="phoneNumber" type="tel"
                            value={formData.phoneNumber} onChange={handleChange}
                            placeholder="+92 300 1234567" sx={fieldSx}
                            InputProps={{ startAdornment: adornment(PhoneOutlinedIcon) }}
                          />
                        </Grid>
                      </Grid>

                      {/* Email */}
                      <TextField
                        fullWidth label="Email Address" name="email" type="email"
                        value={formData.email} onChange={handleChange}
                        placeholder="name@example.com" required sx={fieldSx}
                        InputProps={{ startAdornment: adornment(EmailOutlinedIcon) }}
                      />

                      {/* Vendor notice */}
                      {formData.role === 'VENDOR' && (
                        <Alert
                          severity="info"
                          icon={<StorefrontOutlinedIcon fontSize="inherit" />}
                          sx={{
                            borderRadius: 2,
                            bgcolor: `${BRAND}08`,
                            border: `1px solid ${BRAND}33`,
                            color: BRAND,
                            '& .MuiAlert-icon': { color: BRAND },
                          }}
                        >
                          After creating your account you&apos;ll complete{' '}
                          <strong>Business Registration</strong> — store details, banking &amp; branding.
                        </Alert>
                      )}

                      {/* Passwords */}
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth label="Password" name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password} onChange={handleChange}
                            placeholder="Min. 6 characters" required sx={fieldSx}
                            InputProps={{
                              startAdornment: adornment(LockOutlinedIcon),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton size="small" edge="end" onClick={() => setShowPassword(p => !p)}>
                                    {showPassword
                                      ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                                      : <VisibilityOutlinedIcon   sx={{ fontSize: 18 }} />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth label="Confirm Password" name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={formData.confirmPassword} onChange={handleChange}
                            placeholder="Re-enter password" required sx={fieldSx}
                            InputProps={{
                              startAdornment: adornment(LockOutlinedIcon),
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton size="small" edge="end" onClick={() => setShowConfirmPassword(p => !p)}>
                                    {showConfirmPassword
                                      ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                                      : <VisibilityOutlinedIcon   sx={{ fontSize: 18 }} />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Grid>
                      </Grid>

                      {/* Submit */}
                      <Button
                        type="submit" fullWidth variant="contained" size="large"
                        disabled={loading}
                        endIcon={loading
                          ? <CircularProgress size={18} color="inherit" />
                          : <ArrowForwardIcon />
                        }
                        sx={{
                          mt: 0.5, py: 1.6, fontWeight: 700, fontSize: '1rem',
                          textTransform: 'none',
                          bgcolor: selectedRole?.color || BRAND,
                          '&:hover': { bgcolor: BRAND, filter: 'brightness(0.9)' },
                          boxShadow: `0 6px 20px ${selectedRole?.color || BRAND}44`,
                        }}
                      >
                        {loading ? 'Creating Account…' : 'Create Account'}
                      </Button>

                    </Stack>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="body2" color="text.secondary" textAlign="center">
                    Already have an account?{' '}
                    <Box component={NextLink} href="/login"
                      sx={{ color: BRAND, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Sign In
                    </Box>
                  </Typography>
                </motion.div>
              )}

            </AnimatePresence>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ px: { xs: 3, sm: 5 }, py: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled">
            By creating an account you agree to our{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</Box>
            {' '}and{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</Box>.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
