'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { getUserRole } from '@/lib/authHelpers'
import NextLink from 'next/link'
import { motion } from 'framer-motion'

import Alert           from '@mui/material/Alert'
import Box             from '@mui/material/Box'
import Button          from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider         from '@mui/material/Divider'
import IconButton      from '@mui/material/IconButton'
import InputAdornment  from '@mui/material/InputAdornment'
import Stack           from '@mui/material/Stack'
import TextField       from '@mui/material/TextField'
import Typography      from '@mui/material/Typography'
import Chip            from '@mui/material/Chip'

import ArrowBackOutlinedIcon    from '@mui/icons-material/ArrowBackOutlined'
import ArrowForwardIcon         from '@mui/icons-material/ArrowForward'
import EmailOutlinedIcon        from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon         from '@mui/icons-material/LockOutlined'
import LogoutOutlinedIcon       from '@mui/icons-material/LogoutOutlined'
import ShoppingBagIcon          from '@mui/icons-material/ShoppingBag'
import VisibilityOutlinedIcon   from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import LightModeOutlinedIcon    from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon     from '@mui/icons-material/DarkModeOutlined'
import ShieldOutlinedIcon       from '@mui/icons-material/ShieldOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import FastfoodOutlinedIcon     from '@mui/icons-material/FastfoodOutlined'
import StorefrontOutlinedIcon   from '@mui/icons-material/StorefrontOutlined'
import StarIcon                 from '@mui/icons-material/Star'

// Luxury Brand Tokens
const SAPPHIRE = '#2563EB'
const SAPPHIRE_DARK = '#1D4ED8'
const GOLD = '#F59E0B'
const GRADIENT = 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)'

function BrandPanel() {
  return (
    <Box
      sx={{
        display: { xs: 'none', lg: 'flex' },
        width: '45%',
        flexShrink: 0,
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: { lg: 6, xl: 8 },
        position: 'sticky',
        top: 0,
        height: '100vh',
        background: 'linear-gradient(155deg, #060A14 0%, #0A0F1D 45%, #101935 75%, #1E1B4B 100%)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        color: '#FFFFFF',
      }}
    >
      {/* Background Ambient Glow Orbs */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 420,
            height: 420,
            borderRadius: '50%',
            bgcolor: 'rgba(37, 99, 235, 0.22)',
            filter: 'blur(90px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            right: -100,
            width: 480,
            height: 480,
            borderRadius: '50%',
            bgcolor: 'rgba(124, 58, 237, 0.18)',
            filter: 'blur(100px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '45%',
            right: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            bgcolor: 'rgba(245, 158, 11, 0.12)',
            filter: 'blur(80px)',
          }}
        />
      </Box>

      {/* Top: Brand Header */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <NextLink href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                background: GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
                borderRadius: 0,
              }}
            >
              <ShoppingBagIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: -0.5, lineHeight: 1 }}>
                Quick<Box component="span" sx={{ color: '#60A5FA' }}>Delivery</Box>
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Boutique Marketplace
              </Typography>
            </Box>
          </Stack>
        </NextLink>
      </Box>

      {/* Middle: Architectural Glassmorphic Showcase */}
      <Box sx={{ position: 'relative', zIndex: 1, my: 'auto', py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Chip
            icon={<StarIcon sx={{ fontSize: '13px !important', color: GOLD }} />}
            label="CURATED MULTI-VENDOR PLATFORM"
            size="small"
            sx={{
              mb: 2.5,
              borderRadius: 0,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: 1,
              bgcolor: 'rgba(245, 158, 11, 0.12)',
              color: GOLD,
              border: '1px solid rgba(245, 158, 11, 0.3)',
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.15,
              mb: 2,
              fontSize: { lg: '2.1rem', xl: '2.6rem' },
            }}
          >
            Welcome back to the{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              future of express dining
            </Box>{' '}
            & luxury commerce.
          </Typography>

          <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 440, mb: 4, fontSize: 14.5, lineHeight: 1.6 }}>
            Access curated merchant boutiques, track gourmet orders in real-time, and experience bespoke delivery.
          </Typography>

          {/* Pillars List */}
          <Stack spacing={1.5} sx={{ maxWidth: 460 }}>
            {[
              { icon: <FastfoodOutlinedIcon sx={{ color: '#F59E0B', fontSize: 18 }} />, label: 'Artisan Dining & Chef Menus', sub: 'Handcrafted double smash burgers, Neapolitan pizzas & French bakeries' },
              { icon: <StorefrontOutlinedIcon sx={{ color: '#06B6D4', fontSize: 18 }} />, label: 'High-End Tech & Groceries', sub: 'Flagship electronics, workstation peripherals & organic pantry produce' },
              { icon: <LocalShippingOutlinedIcon sx={{ color: '#10B981', fontSize: 18 }} />, label: '30-45 Min Express Fleet', sub: 'Temperature-controlled rapid dispatch across Pakistan' },
            ].map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.75,
                  p: 1.75,
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 0,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <Box sx={{ mt: 0.25 }}>{p.icon}</Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, color: '#F1F5F9' }}>
                    {p.label}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 11, display: 'block' }}>
                    {p.sub}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </motion.div>
      </Box>

      {/* Bottom Security Note */}
      <Box sx={{ position: 'relative', zIndex: 1, pt: 2, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShieldOutlinedIcon sx={{ fontSize: 16, color: '#10B981' }} />
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 11, fontWeight: 600 }}>
            Enterprise 256-bit SSL encryption • Verified secure customer portal
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export default function LoginPage() {
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')

  const { signIn, user, userData, loading: authLoading, logout, loginAsGuest } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user && userData) {
      const role = getUserRole(userData)
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
      else if (role === 'VENDOR')   router.push('/vendor/dashboard')
      else if (role === 'DRIVER')   router.push('/driver/profile')
      else if (role === 'CUSTOMER') router.push('/customer')
    }
  }, [user, userData, authLoading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn(email, password)
      if (result?.success && result?.userData) {
        const role = getUserRole(result.userData)
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
        else if (role === 'VENDOR')   router.push('/vendor/dashboard')
        else if (role === 'DRIVER')   router.push('/driver/profile')
        else if (role === 'CUSTOMER') router.push('/customer')
        else                          router.push('/')
      } else if (!result?.success) {
        setError(result?.error || 'Login failed. Please check your credentials.')
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await loginAsGuest()
      if (result.success) router.push('/customer')
      else setError(result.error || 'Failed to login as guest')
    } catch {
      setError('An error occurred during guest login')
    } finally {
      setLoading(false)
    }
  }

  const fieldStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
      color: isDark ? '#FFFFFF' : '#0F172A',
      '& fieldset': {
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
      },
      '&:hover fieldset': {
        borderColor: SAPPHIRE,
      },
      '&.Mui-focused fieldset': {
        borderColor: SAPPHIRE,
        borderWidth: '1.5px',
      },
    },
    '& .MuiInputLabel-root': {
      color: isDark ? '#94A3B8' : '#64748B',
      '&.Mui-focused': {
        color: SAPPHIRE,
      },
    },
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        bgcolor: isDark ? '#060A14' : '#F8FAFC',
        color: isDark ? '#F1F5F9' : '#0F172A',
        transition: 'background-color 0.25s ease',
      }}
    >
      {/* ── 1. LUXURY LEFT BRAND PANEL ── */}
      <BrandPanel />

      {/* ── 2. RIGHT LOGIN FORM PANEL ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          overflowY: 'auto',
          bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
        }}
      >
        {/* Top Utility Bar */}
        <Box
          sx={{
            px: { xs: 2.5, sm: 4, lg: 6 },
            py: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
            position: 'sticky',
            top: 0,
            bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
            zIndex: 10,
          }}
        >
          {/* Mobile Brand Logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                background: GRADIENT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 0,
              }}
            >
              <ShoppingBagIcon sx={{ color: '#fff', fontSize: 18 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: isDark ? '#FFFFFF' : '#0F172A' }}>
              Quick<Box component="span" sx={{ color: SAPPHIRE }}>Delivery</Box>
            </Typography>
          </Box>

          {/* Desktop Left: Home navigation link */}
          <Button
            component={NextLink}
            href="/"
            size="small"
            startIcon={<ArrowBackOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{
              display: { xs: 'none', lg: 'inline-flex' },
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 12,
              color: isDark ? '#94A3B8' : '#64748B',
              '&:hover': { color: SAPPHIRE, bgcolor: 'transparent' },
            }}
          >
            Storefront Home
          </Button>

          {/* Right: Theme Toggle & Sign Up Link */}
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton
              size="small"
              onClick={toggleTheme}
              sx={{
                color: isDark ? '#F59E0B' : '#64748B',
                borderRadius: 0,
                p: 0.75,
                border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' },
              }}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 18 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />}
            </IconButton>

            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13 }}>
              Don&apos;t have an account?{' '}
              <Box
                component={NextLink}
                href="/register"
                sx={{
                  color: SAPPHIRE,
                  fontWeight: 800,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign Up
              </Box>
            </Typography>
          </Stack>
        </Box>

        {/* Form Body Container */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, sm: 5, md: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 440 }}>
            {/* Header Titles */}
            <Box mb={4}>
              <Chip
                label="SIGN IN PORTAL"
                size="small"
                sx={{
                  mb: 1.5,
                  borderRadius: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: 1,
                  bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.1)',
                  color: SAPPHIRE,
                  border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.25)'}`,
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, mb: 1, fontSize: { xs: 26, sm: 30 } }}>
                Welcome back
              </Typography>
              <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13.5 }}>
                Enter your credentials to access your orders, wishlist, and boutique management.
              </Typography>
            </Box>

            {/* Already Signed In Alert (For active non-guest sessions) */}
            {user && userData?.role !== 'GUEST' && (
              <Alert
                severity="info"
                sx={{
                  mb: 3,
                  borderRadius: 0,
                  bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
                  border: '1px solid #2563EB',
                  color: isDark ? '#93C5FD' : '#1D4ED8',
                  '& .MuiAlert-icon': { color: SAPPHIRE },
                }}
                action={
                  <Button
                    size="small"
                    startIcon={<LogoutOutlinedIcon sx={{ fontSize: 16 }} />}
                    onClick={logout}
                    sx={{ color: SAPPHIRE, textTransform: 'none', fontWeight: 800, fontSize: 12 }}
                  >
                    Logout
                  </Button>
                }
              >
                <Typography variant="body2" fontWeight={800}>Already signed in</Typography>
                <Typography variant="caption">Active account: {user.email}</Typography>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 0,
                  bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2',
                  border: '1px solid #EF4444',
                  color: '#EF4444',
                }}
              >
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {/* Email Address */}
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  sx={fieldStyles}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#94A3B8' : '#64748B' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password with Forgot Password link */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 12.5, color: isDark ? '#CBD5E1' : '#334155' }}>
                      Password
                    </Typography>
                    <Box
                      component={NextLink}
                      href="/forgot-password"
                      sx={{
                        fontSize: 12,
                        color: SAPPHIRE,
                        fontWeight: 700,
                        textDecoration: 'none',
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Forgot Password?
                    </Box>
                  </Box>

                  <TextField
                    fullWidth
                    size="small"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    required
                    sx={fieldStyles}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#94A3B8' : '#64748B' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            edge="end"
                            onClick={() => setShowPassword((v) => !v)}
                            sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                          >
                            {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Sign In Button */}
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                  sx={{
                    py: 1.4,
                    fontWeight: 800,
                    fontSize: 14,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    borderRadius: 0,
                    background: GRADIENT,
                    color: '#FFFFFF',
                    boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1D4ED8 0%, #4338CA 50%, #6D28D9 100%)',
                      boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {loading ? 'Authenticating…' : 'Sign In to Account'}
                </Button>

                {/* Divider */}
                <Divider sx={{ my: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }}>
                  <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', px: 1, fontWeight: 700 }}>
                    OR
                  </Typography>
                </Divider>

                {/* Continue as Guest */}
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  size="large"
                  disabled={loading}
                  onClick={handleGuestLogin}
                  sx={{
                    py: 1.3,
                    fontWeight: 700,
                    fontSize: 13.5,
                    textTransform: 'none',
                    borderRadius: 0,
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                    color: isDark ? '#E2E8F0' : '#334155',
                    bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
                    '&:hover': {
                      borderColor: SAPPHIRE,
                      color: SAPPHIRE,
                      bgcolor: isDark ? 'rgba(37, 99, 235, 0.08)' : '#EFF6FF',
                    },
                  }}
                >
                  Continue as Guest Explorer
                </Button>
              </Stack>
            </Box>

            {/* Mobile Return to Home */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'center', mt: 4 }}>
              <Button
                component={NextLink}
                href="/"
                variant="text"
                size="small"
                startIcon={<ArrowBackOutlinedIcon />}
                sx={{
                  textTransform: 'none',
                  color: isDark ? '#94A3B8' : '#64748B',
                  fontWeight: 700,
                  fontSize: 12,
                  '&:hover': { color: SAPPHIRE },
                }}
              >
                Back to Storefront Home
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            px: { xs: 3, sm: 6 },
            py: 2,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 11 }}>
            By signing in you agree to QuickDelivery&apos;s{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', color: isDark ? '#94A3B8' : '#64748B' }}>
              Terms of Service
            </Box>
            {' '}and{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', color: isDark ? '#94A3B8' : '#64748B' }}>
              Privacy Policy
            </Box>.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
