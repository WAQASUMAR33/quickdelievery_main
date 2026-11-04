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
import Dialog          from '@mui/material/Dialog'
import DialogTitle     from '@mui/material/DialogTitle'
import DialogContent   from '@mui/material/DialogContent'
import DialogActions   from '@mui/material/DialogActions'

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

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block' }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  )
}

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
        background: 'linear-gradient(155deg, #070E20 0%, #0C1A38 35%, #152C69 70%, #1E3A8A 100%)',
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
            bgcolor: 'rgba(37, 99, 235, 0.35)',
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
            bgcolor: 'rgba(124, 58, 237, 0.25)',
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
            bgcolor: 'rgba(245, 158, 11, 0.2)',
            filter: 'blur(80px)',
          }}
        />
      </Box>

      {/* Top: Brand Header */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <NextLink href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
          <Box
            sx={{
              bgcolor: '#FFFFFF',
              px: 2.2,
              py: 1,
              borderRadius: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.85)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          >
            <Box
              component="img"
              src="/images/martzona_logo_transparent.png"
              alt="MARTZONA"
              sx={{
                height: { xs: 34, sm: 38, md: 42 },
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          </Box>
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
            icon={<StarIcon sx={{ fontSize: '13px !important', color: '#FBBF24' }} />}
            label="MARTZONA SUPER-APP & MARKETPLACE"
            size="small"
            sx={{
              mb: 2.5,
              borderRadius: 0,
              fontWeight: 800,
              fontSize: 10,
              letterSpacing: 1,
              bgcolor: 'rgba(245, 158, 11, 0.15)',
              color: '#FBBF24',
              border: '1px solid rgba(245, 158, 11, 0.35)',
            }}
          />

          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              letterSpacing: -1,
              lineHeight: 1.15,
              mb: 2,
              fontSize: { lg: '2.1rem', xl: '2.5rem' },
            }}
          >
            Everything you need,{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #FBBF24 50%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              delivered in minutes
            </Box>
            .
          </Typography>

          <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 440, mb: 4, fontSize: 14.5, lineHeight: 1.6 }}>
            Explore top-rated restaurants, supermarket essentials, tech gadgets & daily groceries with live order tracking across MartZona.
          </Typography>

          {/* Pillars List */}
          <Stack spacing={1.5} sx={{ maxWidth: 460 }}>
            {[
              { icon: <FastfoodOutlinedIcon sx={{ color: '#F59E0B', fontSize: 18 }} />, label: 'Food, Dining & Chef Menus', sub: 'Handcrafted meals, double smash burgers, pizza & artisan bakeries delivered hot' },
              { icon: <StorefrontOutlinedIcon sx={{ color: '#06B6D4', fontSize: 18 }} />, label: 'Supermarkets & High-End Tech', sub: 'Fresh organic pantry produce, mobile electronics & workstation gear' },
              { icon: <LocalShippingOutlinedIcon sx={{ color: '#10B981', fontSize: 18 }} />, label: 'Under 45-Min Express Delivery', sub: 'Smart multi-order logistics, live GPS tracking & Cash on Delivery' },
            ].map((p, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.75,
                  p: 1.75,
                  bgcolor: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 0,
                  backdropFilter: 'blur(8px)',
                  transition: 'border-color 0.2s',
                  '&:hover': { borderColor: 'rgba(37, 99, 235, 0.4)' },
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
      <Box sx={{ position: 'relative', zIndex: 1, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <ShieldOutlinedIcon sx={{ fontSize: 16, color: '#10B981' }} />
          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 11, fontWeight: 600 }}>
            Enterprise 256-bit SSL encryption • Verified secure checkout & delivery
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

  const { signIn, signInWithGoogle, loginWithGoogleData, user, userData, loading: authLoading, logout, loginAsGuest } = useAuth()
  const [selectedRole, setSelectedRole] = useState('CUSTOMER')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false)
  const [googleEmail, setGoogleEmail] = useState('')
  const [googleName, setGoogleName] = useState('')
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setError('')
    try {
      const result = await signInWithGoogle(selectedRole)
      if (result?.success && result?.userData) {
        const role = getUserRole(result.userData)
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
        else if (role === 'VENDOR')   router.push('/vendor/dashboard')
        else if (role === 'DRIVER')   router.push('/driver/profile')
        else if (role === 'CUSTOMER') router.push('/customer')
        else                          router.push('/')
      } else if (!result?.success && !result?.cancelled) {
        setGoogleDialogOpen(true)
      }
    } catch (err) {
      setError(err?.message || 'Google sign-in could not be completed')
      setGoogleDialogOpen(true)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleManualGoogleSubmit = async (e) => {
    e.preventDefault()
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Please enter a valid Gmail address')
      return
    }
    setGoogleLoading(true)
    setError('')
    try {
      const result = await loginWithGoogleData({
        email: googleEmail,
        displayName: googleName || googleEmail.split('@')[0],
        role: selectedRole,
      })
      if (result?.success && result?.userData) {
        setGoogleDialogOpen(false)
        const role = getUserRole(result.userData)
        if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
        else if (role === 'VENDOR')   router.push('/vendor/dashboard')
        else if (role === 'DRIVER')   router.push('/driver/profile')
        else if (role === 'CUSTOMER') router.push('/customer')
        else                          router.push('/')
      } else {
        setError(result?.error || 'Failed to authenticate with Gmail')
      }
    } catch (err) {
      setError(err?.message || 'Gmail login error')
    } finally {
      setGoogleLoading(false)
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
          <Box component={NextLink} href="/" sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', textDecoration: 'none' }}>
            <Box
              sx={{
                bgcolor: '#FFFFFF',
                px: 1.5,
                py: 0.5,
                borderRadius: '10px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <Box
                component="img"
                src="/images/martzona_logo_transparent.png"
                alt="MARTZONA"
                sx={{ height: 28, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
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

                {/* Google Sign In Button - Below Sign In to Account Button */}
                <Button
                  type="button"
                  fullWidth
                  variant="outlined"
                  size="large"
                  disabled={loading || googleLoading}
                  onClick={handleGoogleSignIn}
                  startIcon={googleLoading ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
                  sx={{
                    py: 1.3,
                    fontWeight: 800,
                    fontSize: 13.5,
                    textTransform: 'none',
                    borderRadius: 0,
                    borderColor: isDark ? 'rgba(255,255,255,0.2)' : '#CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#F8FAFC',
                      borderColor: isDark ? '#FFFFFF' : '#94A3B8',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {googleLoading ? 'Connecting to Google…' : 'Continue with Google'}
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
            By signing in you agree to MartZona&apos;s{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', color: isDark ? '#94A3B8' : '#64748B' }}>
              Terms of Service
            </Box>
            {' '}and{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer', color: isDark ? '#94A3B8' : '#64748B' }}>
              Privacy Policy
            </Box>.
          </Typography>
        </Box>
              {/* Google Authentication Dialog */}
        <Dialog
          open={googleDialogOpen}
          onClose={() => !googleLoading && setGoogleDialogOpen(false)}
          maxWidth="xs"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: isDark ? '#0F172A' : '#FFFFFF',
              color: isDark ? '#FFFFFF' : '#0F172A',
              borderRadius: 0,
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
              p: 1,
            },
          }}
        >
          <Box component="form" onSubmit={handleManualGoogleSubmit}>
            <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <GoogleIcon />
              <Typography variant="h6" fontWeight={800} fontSize={18}>
                Continue with Google
              </Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 2, fontSize: 13 }}>
                Sign in instantly using your Google or Gmail account credentials .
              </Typography>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  size="small"
                  label="Gmail / Google Email"
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  required
                  autoFocus
                  sx={fieldStyles}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Display Name (Optional)"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="Your Name"
                  sx={fieldStyles}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
              <Button
                type="button"
                onClick={() => setGoogleDialogOpen(false)}
                disabled={googleLoading}
                sx={{
                  borderRadius: 0,
                  color: isDark ? '#94A3B8' : '#64748B',
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={googleLoading || !googleEmail}
                startIcon={googleLoading ? <CircularProgress size={16} color="inherit" /> : <GoogleIcon />}
                sx={{
                  borderRadius: 0,
                  bgcolor: SAPPHIRE,
                  color: '#FFFFFF',
                  textTransform: 'none',
                  fontWeight: 800,
                  px: 2.5,
                  '&:hover': { bgcolor: SAPPHIRE_DARK },
                }}
              >
                {googleLoading ? 'Signing in…' : 'Sign In with Gmail'}
              </Button>
            </DialogActions>
          </Box>
        </Dialog>
      </Box>
    </Box>
  )
}
