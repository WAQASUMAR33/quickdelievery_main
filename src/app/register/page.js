'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import NextLink from 'next/link'

import Box              from '@mui/material/Box'
import Typography       from '@mui/material/Typography'
import Stack            from '@mui/material/Stack'
import TextField        from '@mui/material/TextField'
import InputAdornment   from '@mui/material/InputAdornment'
import IconButton       from '@mui/material/IconButton'
import Button           from '@mui/material/Button'
import Alert            from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import Chip             from '@mui/material/Chip'

// Icons
import PersonOutlinedIcon         from '@mui/icons-material/PersonOutlined'
import EmailOutlinedIcon          from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon          from '@mui/icons-material/PhoneOutlined'
import LockOutlinedIcon           from '@mui/icons-material/LockOutlined'
import VisibilityOutlinedIcon     from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon  from '@mui/icons-material/VisibilityOffOutlined'
import ArrowForwardIcon           from '@mui/icons-material/ArrowForward'
import ArrowBackIcon              from '@mui/icons-material/ArrowBack'
import CheckIcon                  from '@mui/icons-material/Check'
import StorefrontOutlinedIcon     from '@mui/icons-material/StorefrontOutlined'
import LocalShippingOutlinedIcon  from '@mui/icons-material/LocalShippingOutlined'
import ShoppingCartOutlinedIcon   from '@mui/icons-material/ShoppingCartOutlined'
import ShoppingBagIcon            from '@mui/icons-material/ShoppingBag'
import FastfoodOutlinedIcon       from '@mui/icons-material/FastfoodOutlined'
import ShieldOutlinedIcon         from '@mui/icons-material/ShieldOutlined'
import LightModeOutlinedIcon      from '@mui/icons-material/LightModeOutlined'
import DarkModeOutlinedIcon       from '@mui/icons-material/DarkModeOutlined'
import StarIcon                   from '@mui/icons-material/Star'
import CameraAltOutlinedIcon      from '@mui/icons-material/CameraAltOutlined'
import DeleteOutlineIcon          from '@mui/icons-material/DeleteOutline'
import CloudUploadOutlinedIcon    from '@mui/icons-material/CloudUploadOutlined'

// Luxury Brand Tokens
const SAPPHIRE = '#2563EB'
const SAPPHIRE_DARK = '#1D4ED8'
const GOLD = '#F59E0B'
const GRADIENT = 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)'

// Role definitions
const ROLES = [
  {
    value: 'CUSTOMER',
    label: 'Customer Account',
    badge: 'SHOPPING & DINING',
    subtitle: 'Order gourmet meals, fresh produce, and tech hardware with real-time tracking.',
    Icon: ShoppingCartOutlinedIcon,
    accentColor: '#2563EB',
    perks: ['Curated multi-vendor catalog', 'Live GPS courier tracking', 'Exclusive deals & flash drops'],
  },
  {
    value: 'VENDOR',
    label: 'Merchant / Kitchen Partner',
    badge: 'BOUTIQUE COMMERCE',
    subtitle: 'List your restaurant, bakery menu, or electronics boutique and manage orders.',
    Icon: StorefrontOutlinedIcon,
    accentColor: '#F59E0B',
    perks: ['Direct boutique profile with logo & cover', 'Live order dispatch dashboard', 'Instant automated payout schedules'],
  },
  {
    value: 'DRIVER',
    label: 'Delivery Partner',
    badge: 'EXPRESS FLEET',
    subtitle: 'Deliver orders across your city and earn competitive weekly earnings.',
    Icon: LocalShippingOutlinedIcon,
    accentColor: '#10B981',
    perks: ['Flexible dispatch schedule', 'Smart spatial batching & routing', 'Direct driver performance bonuses'],
  },
]

// Slide animation variants
const slideIn = { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -30 } }

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

      {/* Middle: Value Prop Cards */}
      <Box sx={{ position: 'relative', zIndex: 1, my: 'auto', py: 4 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Chip
            icon={<StarIcon sx={{ fontSize: '13px !important', color: GOLD }} />}
            label="JOIN THE PLATFORM"
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
            Create your account in{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F59E0B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              less than 2 minutes
            </Box>.
          </Typography>

          <Typography variant="body1" sx={{ color: '#94A3B8', maxWidth: 440, mb: 4, fontSize: 14.5, lineHeight: 1.6 }}>
            Whether you are ordering dinner, growing your restaurant revenue, or delivering with our fleet — QuickDelivery is engineered for speed.
          </Typography>

          {/* Highlights List */}
          <Stack spacing={1.5} sx={{ maxWidth: 460 }}>
            {[
              { icon: <ShoppingCartOutlinedIcon sx={{ color: '#60A5FA', fontSize: 18 }} />, label: 'Fast 1-Click Ordering', sub: 'Saved addresses, encrypted payment methods, and live SMS updates' },
              { icon: <StorefrontOutlinedIcon sx={{ color: '#F59E0B', fontSize: 18 }} />, label: 'Merchant Onboarding Portal', sub: 'Launch your digital storefront with menu variants, modifiers, and SEO slugs' },
              { icon: <LocalShippingOutlinedIcon sx={{ color: '#10B981', fontSize: 18 }} />, label: 'Automated Fleet Network', sub: 'Smart logistics stacking orders to ensure hot and fresh handoffs' },
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

// ── Avatar Upload Component ──────────────────────────────────────────────────
function AvatarUploader({ isDark, value, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'avatars')
      const res = await fetch('/api/upload-image', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success && data.url) {
        onChange(data.url)
      }
    } catch (err) {
      console.error('Avatar upload failed:', err)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true) }
  const handleDragLeave = () => setDragOver(false)

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1 }}>
      {/* Avatar Preview */}
      <Box
        sx={{
          position: 'relative',
          width: 72,
          height: 72,
          flexShrink: 0,
          borderRadius: 0,
          overflow: 'hidden',
          border: dragOver
            ? `2px dashed #2563EB`
            : isDark ? '2px solid rgba(255,255,255,0.12)' : '2px solid #CBD5E1',
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
          cursor: 'pointer',
          transition: 'border-color 0.2s ease',
          '&:hover .overlay': { opacity: 1 },
        }}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {value ? (
          <Box component="img" src={value} alt="avatar" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {uploading ? (
              <CircularProgress size={22} sx={{ color: '#2563EB' }} />
            ) : (
              <CameraAltOutlinedIcon sx={{ fontSize: 28, color: isDark ? '#475569' : '#94A3B8' }} />
            )}
          </Box>
        )}
        {/* Overlay on hover */}
        <Box
          className="overlay"
          sx={{
            position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s ease',
          }}
        >
          {uploading
            ? <CircularProgress size={18} sx={{ color: '#fff' }} />
            : <CameraAltOutlinedIcon sx={{ color: '#fff', fontSize: 20 }} />
          }
        </Box>
      </Box>

      {/* Text + Actions */}
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: isDark ? '#F1F5F9' : '#0F172A', mb: 0.5 }}>
          Profile Photo <Box component="span" sx={{ fontSize: 11, fontWeight: 500, color: isDark ? '#64748B' : '#94A3B8' }}>(Optional)</Box>
        </Typography>
        <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', fontSize: 11, display: 'block', mb: 1 }}>
          JPG, PNG or WEBP · Max 5MB
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={12} /> : <CloudUploadOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            sx={{
              borderRadius: 0,
              textTransform: 'none',
              fontSize: 11,
              fontWeight: 700,
              py: 0.4,
              px: 1.25,
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
              color: isDark ? '#94A3B8' : '#475569',
              '&:hover': { borderColor: '#2563EB', color: '#2563EB', bgcolor: 'transparent' },
            }}
          >
            {uploading ? 'Uploading…' : 'Upload Photo'}
          </Button>
          {value && (
            <IconButton
              size="small"
              onClick={() => onChange(null)}
              sx={{ borderRadius: 0, color: '#EF4444', p: 0.5, border: '1px solid rgba(239,68,68,0.25)', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' } }}
              title="Remove photo"
            >
              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
        </Stack>
      </Box>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
      />
    </Box>
  )
}

export default function RegisterPage() {
  const { signUp } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const router = useRouter()

  // phase: 'select' | 'form'
  const [phase, setPhase] = useState('select')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phoneNumber: '',
    role: '',
    type: 'local',
  })
  const [profileImage, setProfileImage] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const selectedRole = ROLES.find((r) => r.value === formData.role)

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }))

  const selectRole = (value) => {
    setFormData((p) => ({ ...p, role: value }))
  }

  const continueToForm = () => {
    if (formData.role) setPhase('form')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.displayName,
        formData.phoneNumber,
        formData.role,
        formData.type,
        profileImage,
      )
      if (result.success) {
        if (formData.role === 'VENDOR') {
          router.push(`/business-register?email=${encodeURIComponent(formData.email)}`)
        } else if (formData.role === 'DRIVER') {
          router.push('/driver/profile')
        } else {
          router.push('/customer')
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

      {/* ── 2. RIGHT SIGNUP PANEL ── */}
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
            startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
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

          {/* Right: Theme Toggle & Sign In Link */}
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
              Already have an account?{' '}
              <Box
                component={NextLink}
                href="/login"
                sx={{
                  color: SAPPHIRE,
                  fontWeight: 800,
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Sign In
              </Box>
            </Typography>
          </Stack>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 3, sm: 5, md: 6 },
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 560 }}>
            <AnimatePresence mode="wait">
              {/* ════ PHASE 1: ROLE SELECTION ════ */}
              {phase === 'select' && (
                <motion.div
                  key="select"
                  variants={slideIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <Box mb={3.5}>
                    <Chip
                      label="STEP 1 OF 2"
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
                      Create your account
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13.5 }}>
                      Select the account profile that matches how you plan to use QuickDelivery.
                    </Typography>
                  </Box>

                  {/* Role Cards List */}
                  <Stack spacing={2} mb={3.5}>
                    {ROLES.map((r) => {
                      const isSelected = formData.role === r.value
                      const IconComp = r.Icon

                      return (
                        <Box
                          key={r.value}
                          onClick={() => selectRole(r.value)}
                          sx={{
                            p: 2.5,
                            borderRadius: 0,
                            cursor: 'pointer',
                            bgcolor: isDark
                              ? isSelected
                                ? 'rgba(37, 99, 235, 0.12)'
                                : 'rgba(255,255,255,0.03)'
                              : isSelected
                              ? '#EFF6FF'
                              : '#F8FAFC',
                            border: isSelected
                              ? `2px solid ${SAPPHIRE}`
                              : isDark
                              ? '1px solid rgba(255,255,255,0.1)'
                              : '1px solid #CBD5E1',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: SAPPHIRE,
                              bgcolor: isDark ? 'rgba(37, 99, 235, 0.08)' : '#EFF6FF',
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box
                              sx={{
                                width: 44,
                                height: 44,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isSelected ? SAPPHIRE : isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                                color: isSelected ? '#FFFFFF' : isDark ? '#CBD5E1' : '#334155',
                                borderRadius: 0,
                                flexShrink: 0,
                              }}
                            >
                              <IconComp sx={{ fontSize: 22 }} />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 15, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                                  {r.label}
                                </Typography>
                                <Chip
                                  label={r.badge}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: 9,
                                    fontWeight: 900,
                                    letterSpacing: 0.5,
                                    borderRadius: 0,
                                    bgcolor: isSelected ? 'rgba(37, 99, 235, 0.2)' : isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                                    color: isSelected ? SAPPHIRE : isDark ? '#94A3B8' : '#64748B',
                                  }}
                                />
                              </Stack>
                              <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12.5, mb: 1.5 }}>
                                {r.subtitle}
                              </Typography>

                              {/* Perks list */}
                              <Stack spacing={0.6}>
                                {r.perks.map((perk, i) => (
                                  <Stack key={i} direction="row" spacing={1} alignItems="center">
                                    <CheckIcon sx={{ fontSize: 13, color: isSelected ? SAPPHIRE : '#10B981' }} />
                                    <Typography variant="caption" sx={{ color: isDark ? '#CBD5E1' : '#475569', fontSize: 11.5, fontWeight: 600 }}>
                                      {perk}
                                    </Typography>
                                  </Stack>
                                ))}
                              </Stack>
                            </Box>
                          </Stack>
                        </Box>
                      )
                    })}
                  </Stack>

                  {/* Continue Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={!formData.role}
                    onClick={continueToForm}
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
                    sx={{
                      py: 1.4,
                      fontWeight: 800,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      borderRadius: 0,
                      background: formData.role ? GRADIENT : undefined,
                      color: '#FFFFFF',
                      boxShadow: formData.role ? '0 6px 20px rgba(37, 99, 235, 0.35)' : 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1D4ED8 0%, #4338CA 50%, #6D28D9 100%)',
                        boxShadow: '0 8px 25px rgba(37, 99, 235, 0.45)',
                        transform: 'translateY(-1px)',
                      },
                    }}
                  >
                    Continue to Details
                  </Button>
                </motion.div>
              )}

              {/* ════ PHASE 2: ACCOUNT DETAILS FORM ════ */}
              {phase === 'form' && (
                <motion.div
                  key="form"
                  variants={slideIn}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  {/* Step Back & Header */}
                  <Box mb={3.5}>
                    <Button
                      size="small"
                      startIcon={<ArrowBackIcon sx={{ fontSize: 15 }} />}
                      onClick={() => setPhase('select')}
                      sx={{
                        mb: 1.5,
                        p: 0,
                        minWidth: 0,
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: 12,
                        color: SAPPHIRE,
                        '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                      }}
                    >
                      Change Account Type
                    </Button>

                    <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                      <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, fontSize: { xs: 26, sm: 28 } }}>
                        Enter your credentials
                      </Typography>
                      {selectedRole && (
                        <Chip
                          label={selectedRole.label}
                          size="small"
                          sx={{
                            borderRadius: 0,
                            fontWeight: 800,
                            fontSize: 10.5,
                            bgcolor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
                            color: SAPPHIRE,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 13 }}>
                      Complete your profile information to activate your account.
                    </Typography>
                  </Box>

                  {/* Error Notification */}
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

                  {/* Details Form */}
                  <Box component="form" onSubmit={handleSubmit}>
                    <Stack spacing={2.25}>
                      {/* Profile Photo Upload */}
                      <Box
                        sx={{
                          p: 2,
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                        }}
                      >
                        <AvatarUploader isDark={isDark} value={profileImage} onChange={setProfileImage} />
                      </Box>
                      {/* Full Name */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Full Legal Name"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="e.g. John Doe"
                        required
                        sx={fieldStyles}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#94A3B8' : '#64748B' }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Email Address */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
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

                      {/* Phone Number */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Mobile Phone Number"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        placeholder="+92 300 1234567"
                        required
                        sx={fieldStyles}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneOutlinedIcon sx={{ fontSize: 18, color: isDark ? '#94A3B8' : '#64748B' }} />
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Password */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Create Password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Min. 6 alphanumeric characters"
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

                      {/* Confirm Password */}
                      <TextField
                        fullWidth
                        size="small"
                        label="Confirm Password"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Re-enter your password"
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
                                onClick={() => setShowConfirmPassword((v) => !v)}
                                sx={{ color: isDark ? '#94A3B8' : '#64748B' }}
                              >
                                {showConfirmPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />

                      {/* Register Submit Button */}
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon sx={{ fontSize: 18 }} />}
                        sx={{
                          mt: 1,
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
                        {loading ? 'Creating Account…' : 'Complete Registration'}
                      </Button>
                    </Stack>
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Return to Home */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, justifyContent: 'center', mt: 4 }}>
              <Button
                component={NextLink}
                href="/"
                variant="text"
                size="small"
                startIcon={<ArrowBackIcon />}
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
            By registering you agree to QuickDelivery&apos;s{' '}
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
