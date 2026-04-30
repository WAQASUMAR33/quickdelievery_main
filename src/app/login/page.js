'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserRole } from '@/lib/authHelpers'
import NextLink from 'next/link'

import Alert           from '@mui/material/Alert'
import Box             from '@mui/material/Box'
import Button          from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider         from '@mui/material/Divider'
import IconButton      from '@mui/material/IconButton'
import InputAdornment  from '@mui/material/InputAdornment'
import Paper           from '@mui/material/Paper'
import Stack           from '@mui/material/Stack'
import TextField       from '@mui/material/TextField'
import Typography      from '@mui/material/Typography'

import ArrowBackOutlinedIcon    from '@mui/icons-material/ArrowBackOutlined'
import ArrowForwardIcon         from '@mui/icons-material/ArrowForward'
import EmailOutlinedIcon        from '@mui/icons-material/EmailOutlined'
import Inventory2Icon           from '@mui/icons-material/Inventory2'
import LockOutlinedIcon         from '@mui/icons-material/LockOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import LogoutOutlinedIcon       from '@mui/icons-material/LogoutOutlined'
import RestaurantOutlinedIcon   from '@mui/icons-material/RestaurantOutlined'
import ShoppingBagOutlinedIcon  from '@mui/icons-material/ShoppingBagOutlined'
import VisibilityOutlinedIcon   from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'

const BRAND = '#D70F64'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    '&:hover fieldset':       { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& label.Mui-focused': { color: BRAND },
}

/* ── Left branding panel (same as register) ── */
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
      {/* Blobs */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', top: -60, left: -60, width: 320, height: 320, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', filter: 'blur(40px)' }} />
        <Box sx={{ position: 'absolute', bottom: -80, right: -80, width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', filter: 'blur(60px)' }} />
      </Box>

      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', color: '#fff' }}>
        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 5 }}>
          <Box sx={{ width: 60, height: 60, bgcolor: '#fff', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            <Typography variant="h5" fontWeight={900} color={BRAND}>QD</Typography>
          </Box>
          <Typography variant="h3" fontWeight={900} letterSpacing={-1}>QuickDelivery</Typography>
        </Box>

        {/* Illustration */}
        <Box sx={{ position: 'relative', display: 'inline-block', mb: 5 }}>
          <Box sx={{
            width: 220, height: 220,
            bgcolor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(12px)',
            borderRadius: '32px',
            border: '1px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 90, color: '#fff' }} />
          </Box>
          <Paper elevation={12} sx={{ position: 'absolute', top: -18, right: -18, width: 56, height: 56, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RestaurantOutlinedIcon sx={{ fontSize: 28, color: BRAND }} />
          </Paper>
          <Paper elevation={12} sx={{ position: 'absolute', bottom: -18, left: -18, width: 56, height: 56, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 28, color: BRAND }} />
          </Paper>
        </Box>

        {/* Tagline */}
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ lineHeight: 1.2 }}>
          Welcome back!
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.85, maxWidth: 280, mx: 'auto' }}>
          Sign in to manage orders, products and your store.
        </Typography>
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
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && user && userData) {
      const role = getUserRole(userData)
      if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
      else if (role === 'VENDOR')   router.push('/vendor/dashboard')
      else if (role === 'CUSTOMER') router.push('/customer')
    }
  }, [user, userData, authLoading, router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn(email, password)
      if (!result.success) setError(result.error || 'Login failed. Please check your credentials.')
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

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <BrandPanel />

      {/* ── Right panel ── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflowY: 'auto', bgcolor: 'background.paper' }}>

        {/* Top bar */}
        <Box sx={{ px: { xs: 3, sm: 5 }, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider', position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 10 }}>
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, bgcolor: BRAND, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" fontWeight={900} color="#fff">QD</Typography>
            </Box>
            <Typography variant="h6" fontWeight={800} color={BRAND}>QuickDelivery</Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', lg: 'block' } }} />

          <Typography variant="body2" color="text.secondary">
            Don&apos;t have an account?{' '}
            <Box component={NextLink} href="/register"
              sx={{ color: BRAND, fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
              Sign Up
            </Box>
          </Typography>
        </Box>

        {/* Form area */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 5 } }}>
          <Box sx={{ width: '100%', maxWidth: 480 }}>

            {/* Header */}
            <Box mb={4}>
              <Typography variant="h4" fontWeight={800} gutterBottom>Welcome back</Typography>
              <Typography variant="body1" color="text.secondary">Sign in to your account to continue</Typography>
            </Box>

            {/* Already logged in notice — only for real (non-guest) users */}
            {user && userData?.role !== 'GUEST' && (
              <Alert
                severity="info"
                sx={{ mb: 3, borderRadius: 0, bgcolor: '#fce7f3', border: `1px solid ${BRAND}33`, color: BRAND, '& .MuiAlert-icon': { color: BRAND } }}
                action={
                  <Button size="small" startIcon={<LogoutOutlinedIcon />} onClick={logout}
                    sx={{ color: BRAND, textTransform: 'none', fontWeight: 700 }}>
                    Logout
                  </Button>
                }
              >
                <Typography variant="body2" fontWeight={600}>Already signed in</Typography>
                <Typography variant="caption">as {user.email}</Typography>
              </Alert>
            )}

            {/* Error */}
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>{error}</Alert>
            )}

            {/* Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2.5}>

                <TextField
                  fullWidth size="small" label="Email Address" type="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com" required
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlinedIcon sx={{ fontSize: 18, color: 'action.active' }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={600} color="text.primary">Password</Typography>
                    <Box component={NextLink} href="#"
                      sx={{ fontSize: 12, color: BRAND, fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Forgot Password?
                    </Box>
                  </Box>
                  <TextField
                    fullWidth size="small" label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password" required
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ fontSize: 18, color: 'action.active' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end" onClick={() => setShowPassword(v => !v)}>
                            {showPassword
                              ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                              : <VisibilityOutlinedIcon   sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Sign In */}
                <Button
                  type="submit" fullWidth variant="contained" size="large"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
                  sx={{
                    py: 1.4, fontWeight: 700, fontSize: '1rem', textTransform: 'none', borderRadius: 0,
                    bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' },
                    boxShadow: `0 6px 20px ${BRAND}44`,
                  }}
                >
                  {loading ? 'Signing In…' : 'Sign In'}
                </Button>

                <Divider>
                  <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>OR</Typography>
                </Divider>

                {/* Guest login */}
                <Button
                  type="button" fullWidth variant="outlined" size="large"
                  disabled={loading}
                  onClick={handleGuestLogin}
                  sx={{
                    py: 1.4, fontWeight: 700, fontSize: '1rem', textTransform: 'none', borderRadius: 0,
                    borderColor: 'divider', color: 'text.secondary',
                    '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: `${BRAND}08` },
                  }}
                >
                  Continue as Guest
                </Button>

              </Stack>
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                component={NextLink} href="/"
                variant="text" size="small"
                startIcon={<ArrowBackOutlinedIcon />}
                sx={{ textTransform: 'none', color: 'text.secondary', '&:hover': { color: BRAND, bgcolor: 'transparent' } }}
              >
                Back to Home
              </Button>
            </Box>

          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ px: { xs: 3, sm: 5 }, py: 2, borderTop: 1, borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="caption" color="text.disabled">
            By signing in you agree to our{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</Box>
            {' '}and{' '}
            <Box component="span" sx={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</Box>.
          </Typography>
        </Box>

      </Box>
    </Box>
  )
}
