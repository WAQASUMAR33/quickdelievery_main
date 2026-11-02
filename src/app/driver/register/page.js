'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress from '@mui/material/LinearProgress'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckIcon from '@mui/icons-material/Check'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar'
import ElectricRickshawIcon from '@mui/icons-material/ElectricRickshaw'
import AirportShuttleIcon from '@mui/icons-material/AirportShuttle'
import AddPhotoAlternateOutlinedIcon from '@mui/icons-material/AddPhotoAlternateOutlined'
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural'
import ReplayIcon from '@mui/icons-material/Replay'

// ── MartZona Brand Logo Colors ───────────────────────────────────────────────
const BRAND_PURPLE = '#43046C'
const BRAND_PURPLE_LIGHT = '#6B12A8'
const BRAND_PURPLE_HOVER = '#370359'
const BRAND_GOLD = '#FDB600'
const BRAND_GOLD_DARK = '#D99B00'
const MIN_VEHICLE_IMAGES = 4

const CITIES = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Mandi Bahauddin', 'Faisalabad',
  'Multan', 'Gujranwala', 'Sialkot', 'Peshawar', 'Quetta', 'Other',
]

const VEHICLES = [
  { value: 'Motorcycle', label: 'Motorcycle', icon: TwoWheelerIcon },
  { value: 'Car', label: 'Car', icon: DirectionsCarIcon },
  { value: 'Rickshaw', label: 'Rickshaw', icon: ElectricRickshawIcon },
  { value: 'Van', label: 'Van / Loader', icon: AirportShuttleIcon },
]

const STEPS = [
  { title: 'Account', subtitle: 'Photo, name & login details' },
  { title: 'Contact', subtitle: 'Phone numbers & address' },
  { title: 'Identity', subtitle: 'Date of birth & CNIC' },
  { title: 'License', subtitle: 'Driving license details' },
  { title: 'Vehicle', subtitle: 'Vehicle type, number & photos' },
  { title: 'Selfie', subtitle: 'Live selfie & create profile' },
]

// ── Upload helper ────────────────────────────────────────────────────────────
async function uploadImage(fileOrBlob, folder) {
  const fd = new FormData()
  const file = fileOrBlob instanceof File ? fileOrBlob : new File([fileOrBlob], 'selfie.jpg', { type: 'image/jpeg' })
  fd.append('file', file)
  fd.append('folder', folder)
  const res = await fetch('/api/upload-image', { method: 'POST', body: fd })
  const data = await res.json()
  if (!data.success || !data.url) throw new Error(data.error || 'Upload failed')
  return data.url
}

// ── Single image upload box ──────────────────────────────────────────────────
function ImageUploadBox({ label, value, onChange, folder, isDark, round = false, height = 150 }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please select an image file')
    if (file.size > 8 * 1024 * 1024) return setError('Image must be under 8MB')
    setError('')
    setUploading(true)
    try {
      onChange(await uploadImage(file, folder))
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <Box sx={{ textAlign: round ? 'center' : 'left' }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: isDark ? '#E2E8F0' : '#0F172A' }}>{label}</Typography>
      <Box
        onClick={() => !uploading && inputRef.current?.click()}
        sx={{
          position: 'relative',
          width: round ? 120 : '100%',
          height: round ? 120 : height,
          mx: round ? 'auto' : 0,
          borderRadius: round ? '50%' : '14px',
          border: `2px dashed ${value ? BRAND_PURPLE : isDark ? 'rgba(255,255,255,0.18)' : '#CBD5E1'}`,
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color .2s',
          '&:hover': { borderColor: BRAND_PURPLE },
        }}
      >
        {value ? (
          <Box component="img" src={value} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : uploading ? (
          <CircularProgress size={26} sx={{ color: BRAND_PURPLE }} />
        ) : (
          <Stack alignItems="center" spacing={0.5} sx={{ color: isDark ? '#64748B' : '#94A3B8', px: 1 }}>
            {round ? <CameraAltOutlinedIcon sx={{ color: BRAND_PURPLE }} /> : <CloudUploadOutlinedIcon sx={{ color: BRAND_PURPLE }} />}
            <Typography sx={{ fontSize: 11.5, fontWeight: 600 }}>{round ? 'Add photo' : 'Click to upload'}</Typography>
          </Stack>
        )}
        {value && uploading && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={24} sx={{ color: '#fff' }} />
          </Box>
        )}
      </Box>
      {value && !uploading && (
        <Button size="small" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => onChange('')} sx={{ mt: 0.5, textTransform: 'none', fontSize: 12 }}>
          Remove
        </Button>
      )}
      {error && <Typography sx={{ color: '#EF4444', fontSize: 11.5, mt: 0.5 }}>{error}</Typography>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }}
      />
    </Box>
  )
}

// ── Multiple vehicle images uploader ─────────────────────────────────────────
function VehicleImagesUploader({ images, onChange, isDark }) {
  const inputRef = useRef(null)
  const [uploadingCount, setUploadingCount] = useState(0)
  const [error, setError] = useState('')

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return
    setError('')
    setUploadingCount(files.length)
    const uploaded = []
    for (const file of files) {
      try {
        uploaded.push(await uploadImage(file, 'drivers/vehicle'))
      } catch (e) {
        setError(e.message)
      }
      setUploadingCount((c) => c - 1)
    }
    onChange([...images, ...uploaded].slice(0, 10))
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: isDark ? '#E2E8F0' : '#0F172A' }}>
          Vehicle Images (minimum {MIN_VEHICLE_IMAGES})
        </Typography>
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: images.length >= MIN_VEHICLE_IMAGES ? '#16A34A' : BRAND_GOLD }}>
          {images.length}/{MIN_VEHICLE_IMAGES} {images.length >= MIN_VEHICLE_IMAGES ? '✓' : ''}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 11.5, color: isDark ? '#94A3B8' : '#64748B', mb: 1.5 }}>
        Front, back, left & right side of the vehicle with the number plate clearly visible.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1.25 }}>
        {images.map((url, i) => (
          <Box key={url + i} sx={{ position: 'relative', pt: '100%', borderRadius: '12px', overflow: 'hidden', border: `1px solid ${isDark ? 'rgba(255,255,255,.12)' : '#E2E8F0'}` }}>
            <Box component="img" src={url} alt={`Vehicle ${i + 1}`} sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton
              size="small"
              onClick={() => onChange(images.filter((_, idx) => idx !== i))}
              sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(0,0,0,.6)', color: '#fff', p: 0.4, '&:hover': { bgcolor: '#EF4444' } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}
        {Array.from({ length: uploadingCount }).map((_, i) => (
          <Box key={`u${i}`} sx={{ position: 'relative', pt: '100%', borderRadius: '12px', bgcolor: isDark ? 'rgba(255,255,255,.04)' : '#F1F5F9' }}>
            <CircularProgress size={22} sx={{ position: 'absolute', top: 'calc(50% - 11px)', left: 'calc(50% - 11px)', color: BRAND_PURPLE }} />
          </Box>
        ))}
        {images.length < 10 && (
          <Box
            onClick={() => inputRef.current?.click()}
            sx={{
              position: 'relative', pt: '100%', borderRadius: '12px', cursor: 'pointer',
              border: `2px dashed ${isDark ? 'rgba(255,255,255,.18)' : '#CBD5E1'}`,
              '&:hover': { borderColor: BRAND_PURPLE },
            }}
          >
            <Stack alignItems="center" justifyContent="center" spacing={0.25} sx={{ position: 'absolute', inset: 0, color: isDark ? '#64748B' : '#94A3B8' }}>
              <AddPhotoAlternateOutlinedIcon sx={{ color: BRAND_PURPLE }} />
              <Typography sx={{ fontSize: 11, fontWeight: 600 }}>Add</Typography>
            </Stack>
          </Box>
        )}
      </Box>
      {error && <Typography sx={{ color: '#EF4444', fontSize: 11.5, mt: 1 }}>{error}</Typography>}
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = '' }} />
    </Box>
  )
}

// ── Live selfie (webcam) capture ─────────────────────────────────────────────
function LiveSelfieCapture({ value, onChange, isDark }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setCameraOn(false)
  }, [])

  useEffect(() => stopCamera, [stopCamera])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 720, height: 720 }, audio: false })
      streamRef.current = stream
      setCameraOn(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setError('Camera access denied or unavailable. Please allow camera permission to take a live selfie.')
    }
  }

  const capture = async () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const size = Math.min(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    // Mirror so the saved selfie matches the preview
    ctx.translate(size, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, (video.videoWidth - size) / 2, (video.videoHeight - size) / 2, size, size, 0, 0, size, size)
    stopCamera()
    setUploading(true)
    try {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
      onChange(await uploadImage(blob, 'drivers/selfie'))
    } catch (e) {
      setError(e.message || 'Selfie upload failed')
    } finally {
      setUploading(false)
    }
  }

  const frame = {
    width: 240, height: 240, mx: 'auto', borderRadius: '50%', overflow: 'hidden',
    border: `4px solid ${value ? BRAND_GOLD : BRAND_PURPLE}`,
    boxShadow: `0 0 0 6px ${value ? 'rgba(253, 182, 0, 0.25)' : 'rgba(67, 4, 108, 0.2)'}`,
    bgcolor: isDark ? '#0F172A' : '#F1F5F9',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Box sx={frame}>
        {cameraOn ? (
          <Box component="video" ref={videoRef} playsInline muted sx={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        ) : uploading ? (
          <CircularProgress sx={{ color: BRAND_PURPLE }} />
        ) : value ? (
          <Box component="img" src={value} alt="Live selfie" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <FaceRetouchingNaturalIcon sx={{ fontSize: 80, color: isDark ? '#334155' : '#CBD5E1' }} />
        )}
      </Box>

      <Typography sx={{ fontSize: 12.5, color: isDark ? '#94A3B8' : '#64748B', mt: 2, mb: 2, maxWidth: 360, mx: 'auto' }}>
        Look straight at the camera in good lighting. Remove sunglasses, masks or caps. Gallery uploads are not allowed.
      </Typography>

      {cameraOn ? (
        <Stack direction="row" spacing={1.5} justifyContent="center">
          <Button variant="outlined" onClick={stopCamera} sx={{ textTransform: 'none', borderRadius: '12px' }}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<CameraAltOutlinedIcon />}
            onClick={capture}
            sx={{
              textTransform: 'none',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${BRAND_PURPLE} 0%, ${BRAND_PURPLE_LIGHT} 100%)`,
              color: '#FFFFFF',
              fontWeight: 800,
            }}
          >
            Capture Selfie
          </Button>
        </Stack>
      ) : (
        <Button
          variant={value ? 'outlined' : 'contained'}
          startIcon={value ? <ReplayIcon /> : <CameraAltOutlinedIcon />}
          onClick={startCamera}
          disabled={uploading}
          sx={{
            textTransform: 'none',
            borderRadius: '12px',
            fontWeight: 800,
            ...(value
              ? { borderColor: BRAND_PURPLE, color: BRAND_PURPLE }
              : {
                  background: `linear-gradient(135deg, ${BRAND_PURPLE} 0%, ${BRAND_PURPLE_LIGHT} 100%)`,
                  color: '#FFFFFF',
                  boxShadow: '0 4px 14px rgba(67, 4, 108, 0.35)',
                }),
          }}
        >
          {value ? 'Retake Selfie' : 'Open Camera'}
        </Button>
      )}
      {error && <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{error}</Alert>}
    </Box>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function DriverRegisterPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const { isDark } = useTheme()

  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    profilePhotoUrl: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactNo01: '',
    contactNo02: '',
    city: 'Lahore',
    fullAddress: '',
    dateOfBirth: '',
    cnicNumber: '',
    cnicFrontUrl: '',
    cnicBackUrl: '',
    licenseNumber: '',
    licenseFrontUrl: '',
    licenseBackUrl: '',
    vehicleType: 'Motorcycle',
    vehicleNumber: '',
    vehicleImages: [],
    selfieUrl: '',
  })

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))
  const bind = (key) => ({ value: form[key], onChange: (e) => set(key)(e.target.value) })

  const formatCnic = (v) => {
    const d = v.replace(/\D/g, '').slice(0, 13)
    if (d.length <= 5) return d
    if (d.length <= 12) return `${d.slice(0, 5)}-${d.slice(5)}`
    return `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12)}`
  }

  const validate = () => {
    const f = form
    switch (step) {
      case 0:
        if (!f.profilePhotoUrl) return 'Please upload your profile photo'
        if (f.fullName.trim().length < 3) return 'Please enter your full name exactly as on your CNIC'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Please enter a valid email address'
        if (f.password.length < 6) return 'Password must be at least 6 characters'
        if (f.password !== f.confirmPassword) return 'Passwords do not match'
        return ''
      case 1:
        if (f.contactNo01.replace(/\D/g, '').length < 10) return 'Please enter a valid Contact No 01'
        if (f.contactNo02 && f.contactNo02.replace(/\D/g, '').length < 10) return 'Contact No 02 looks invalid'
        if (!f.city) return 'Please select your city'
        if (f.fullAddress.trim().length < 8) return 'Please enter your full address'
        return ''
      case 2: {
        if (!f.dateOfBirth) return 'Please select your date of birth'
        const age = (Date.now() - new Date(f.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)
        if (age < 18) return 'You must be at least 18 years old'
        if (f.cnicNumber.replace(/\D/g, '').length !== 13) return 'CNIC must be 13 digits (e.g. 35202-1234567-1)'
        if (!f.cnicFrontUrl) return 'Please upload CNIC front image'
        if (!f.cnicBackUrl) return 'Please upload CNIC back image'
        return ''
      }
      case 3:
        if (f.licenseNumber.trim().length < 4) return 'Please enter your license number'
        if (!f.licenseFrontUrl) return 'Please upload license front image'
        if (!f.licenseBackUrl) return 'Please upload license back image'
        return ''
      case 4:
        if (!f.vehicleType) return 'Please select vehicle type'
        if (f.vehicleNumber.trim().length < 3) return 'Please enter your vehicle number'
        if (f.vehicleImages.length < MIN_VEHICLE_IMAGES) return `Please upload at least ${MIN_VEHICLE_IMAGES} vehicle images`
        return ''
      case 5:
        if (!f.selfieUrl) return 'Please take a live selfie'
        return ''
      default:
        return ''
    }
  }

  const next = () => {
    const msg = validate()
    if (msg) return setError(msg)
    setError('')
    setStep((s) => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const back = () => {
    setError('')
    if (step === 0) router.push('/register')
    else setStep((s) => s - 1)
  }

  const submit = async () => {
    const msg = validate()
    if (msg) return setError(msg)
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/driver/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          displayName: form.fullName.trim(),
          email: form.email.trim(),
          phoneNumber: form.contactNo01.trim(),
          phoneNumber2: form.contactNo02.trim(),
          homeAddress: form.fullAddress.trim(),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Registration failed')

      const login = await signIn(form.email.trim(), form.password)
      router.push(login?.success ? '/driver/dashboard' : '/login')
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: BRAND_PURPLE,
        borderWidth: 2,
      },
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: BRAND_PURPLE,
      fontWeight: 700,
    },
  }
  const textColor = isDark ? '#F1F5F9' : '#0F172A'
  const subColor = isDark ? '#94A3B8' : '#64748B'

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#060A14' : '#F8FAFC', py: { xs: 2, md: 5 }, px: 2 }}>
      <Box sx={{ maxWidth: 640, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <NextLink href="/" style={{ display: 'inline-flex' }}>
            <Box sx={{ bgcolor: '#FFFFFF', px: 1.8, py: 0.8, borderRadius: '14px', boxShadow: '0 4px 14px rgba(67, 4, 108, 0.12)', border: '1px solid rgba(67, 4, 108, 0.15)', display: 'inline-flex' }}>
              <Box component="img" src="/images/martzona_logo_transparent.png" alt="MartZona" sx={{ height: 34 }} />
            </Box>
          </NextLink>
          <Button component={NextLink} href="/login" size="small" sx={{ textTransform: 'none', fontWeight: 800, color: BRAND_PURPLE }}>
            Already a driver? Sign in
          </Button>
        </Stack>

        {/* Card */}
        <Box
          sx={{
            bgcolor: isDark ? '#0B1222' : '#FFFFFF',
            borderRadius: '24px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : '#E2E8F0'}`,
            boxShadow: isDark ? '0 20px 50px rgba(0,0,0,.4)' : '0 20px 50px rgba(67,4,108,.08)',
            overflow: 'hidden',
          }}
        >
          {/* Progress: MartZona Royal Purple & Violet Gradient */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pb: 2.5, background: 'linear-gradient(135deg, #24023A 0%, #43046C 55%, #5B0692 100%)', color: '#fff' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography sx={{ fontWeight: 900, fontSize: { xs: 20, sm: 24 }, letterSpacing: -0.4 }}>Driver Registration</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 800, color: BRAND_GOLD }}>Step {step + 1} of {STEPS.length}</Typography>
            </Stack>
            <Typography sx={{ fontSize: 13, color: '#F3E8FF', mt: 0.5 }}>{STEPS[step].subtitle}</Typography>
            <LinearProgress
              variant="determinate"
              value={((step + 1) / STEPS.length) * 100}
              sx={{ mt: 2, height: 6, borderRadius: 3, bgcolor: 'rgba(255,255,255,.18)', '& .MuiLinearProgress-bar': { bgcolor: BRAND_GOLD, borderRadius: 3 } }}
            />
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
              {STEPS.map((s, i) => (
                <Stack key={s.title} alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                  <Box
                    sx={{
                      width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 900,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: i < step ? '#16A34A' : i === step ? BRAND_GOLD : 'rgba(255,255,255,.14)',
                      color: i === step ? BRAND_PURPLE : '#fff',
                      boxShadow: i === step ? '0 0 0 3px rgba(253, 182, 0, 0.35)' : 'none',
                    }}
                  >
                    {i < step ? <CheckIcon sx={{ fontSize: 16 }} /> : i + 1}
                  </Box>
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: i <= step ? '#fff' : '#E9D5FF', display: { xs: 'none', sm: 'block' } }}>
                    {s.title}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Body */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: 18, color: textColor, mb: 2.5 }}>
                  {step + 1}. {STEPS[step].title}
                </Typography>

                {step === 0 && (
                  <Stack spacing={2.2}>
                    <ImageUploadBox label="Profile Photo" round value={form.profilePhotoUrl} onChange={set('profilePhotoUrl')} folder="drivers/profile" isDark={isDark} />
                    <TextField label="Full Name (as on CNIC)" fullWidth sx={fieldSx} {...bind('fullName')} />
                    <TextField label="Email Address" type="email" fullWidth sx={fieldSx} {...bind('email')} />
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      sx={fieldSx}
                      {...bind('password')}
                      helperText="Minimum 6 characters"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword((v) => !v)} edge="end">
                              {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      label="Re-enter Password"
                      type={showPassword ? 'text' : 'password'}
                      fullWidth
                      sx={fieldSx}
                      {...bind('confirmPassword')}
                      error={!!form.confirmPassword && form.confirmPassword !== form.password}
                      helperText={form.confirmPassword && form.confirmPassword !== form.password ? 'Passwords do not match' : ' '}
                    />
                  </Stack>
                )}

                {step === 1 && (
                  <Stack spacing={2.2}>
                    <TextField label="Contact No 01" placeholder="03XX-XXXXXXX" fullWidth sx={fieldSx} {...bind('contactNo01')} inputProps={{ inputMode: 'tel' }} />
                    <TextField label="Contact No 02 (optional)" placeholder="03XX-XXXXXXX" fullWidth sx={fieldSx} {...bind('contactNo02')} inputProps={{ inputMode: 'tel' }} />
                    <TextField select label="City" fullWidth sx={fieldSx} {...bind('city')}>
                      {CITIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </TextField>
                    <TextField label="Full Address" multiline minRows={3} fullWidth sx={fieldSx} {...bind('fullAddress')} placeholder="House #, Street, Area" />
                  </Stack>
                )}

                {step === 2 && (
                  <Stack spacing={2.2}>
                    <TextField
                      label="Date of Birth"
                      type="date"
                      fullWidth
                      sx={fieldSx}
                      {...bind('dateOfBirth')}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: new Date(Date.now() - 18 * 365.25 * 864e5).toISOString().slice(0, 10) }}
                    />
                    <TextField
                      label="CNIC No"
                      placeholder="35202-1234567-1"
                      fullWidth
                      sx={fieldSx}
                      value={form.cnicNumber}
                      onChange={(e) => set('cnicNumber')(formatCnic(e.target.value))}
                      inputProps={{ inputMode: 'numeric' }}
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <ImageUploadBox label="CNIC Front" value={form.cnicFrontUrl} onChange={set('cnicFrontUrl')} folder="drivers/cnic" isDark={isDark} />
                      <ImageUploadBox label="CNIC Back" value={form.cnicBackUrl} onChange={set('cnicBackUrl')} folder="drivers/cnic" isDark={isDark} />
                    </Box>
                  </Stack>
                )}

                {step === 3 && (
                  <Stack spacing={2.2}>
                    <TextField label="License Number" fullWidth sx={fieldSx} {...bind('licenseNumber')} />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <ImageUploadBox label="License Front" value={form.licenseFrontUrl} onChange={set('licenseFrontUrl')} folder="drivers/license" isDark={isDark} />
                      <ImageUploadBox label="License Back" value={form.licenseBackUrl} onChange={set('licenseBackUrl')} folder="drivers/license" isDark={isDark} />
                    </Box>
                  </Stack>
                )}

                {step === 4 && (
                  <Stack spacing={2.5}>
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1, color: textColor }}>Vehicle Type</Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.25 }}>
                        {VEHICLES.map(({ value, label, icon: Icon }) => {
                          const active = form.vehicleType === value
                          return (
                            <Box
                              key={value}
                              onClick={() => set('vehicleType')(value)}
                              sx={{
                                cursor: 'pointer', textAlign: 'center', py: 1.6, px: 0.5, borderRadius: '14px',
                                border: `2px solid ${active ? BRAND_PURPLE : isDark ? 'rgba(255,255,255,.1)' : '#E2E8F0'}`,
                                bgcolor: active ? (isDark ? 'rgba(67, 4, 108, 0.3)' : '#FAF5FF') : 'transparent',
                                transition: 'all .15s',
                              }}
                            >
                              <Icon sx={{ fontSize: 28, color: active ? BRAND_PURPLE : subColor }} />
                              <Typography sx={{ fontSize: 11.5, fontWeight: 700, mt: 0.5, color: active ? BRAND_PURPLE : textColor }}>{label}</Typography>
                            </Box>
                          )
                        })}
                      </Box>
                    </Box>
                    <TextField
                      label="Vehicle Number"
                      placeholder="LEA-24-1234"
                      fullWidth
                      sx={fieldSx}
                      value={form.vehicleNumber}
                      onChange={(e) => set('vehicleNumber')(e.target.value.toUpperCase())}
                    />
                    <VehicleImagesUploader images={form.vehicleImages} onChange={set('vehicleImages')} isDark={isDark} />
                  </Stack>
                )}

                {step === 5 && (
                  <Stack spacing={3}>
                    <LiveSelfieCapture value={form.selfieUrl} onChange={set('selfieUrl')} isDark={isDark} />
                    <Box sx={{ p: 2, borderRadius: '14px', bgcolor: isDark ? 'rgba(255,255,255,.03)' : '#F8FAFC', border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : '#E2E8F0'}` }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 800, color: textColor, mb: 1 }}>Profile Summary</Typography>
                      {[
                        ['Name', form.fullName],
                        ['Email', form.email],
                        ['Contact', [form.contactNo01, form.contactNo02].filter(Boolean).join(' / ')],
                        ['City', form.city],
                        ['CNIC', form.cnicNumber],
                        ['License', form.licenseNumber],
                        ['Vehicle', `${form.vehicleType} • ${form.vehicleNumber} • ${form.vehicleImages.length} photos`],
                      ].map(([k, v]) => (
                        <Stack key={k} direction="row" justifyContent="space-between" sx={{ py: 0.4 }}>
                          <Typography sx={{ fontSize: 12.5, color: subColor }}>{k}</Typography>
                          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: textColor, textAlign: 'right', ml: 2 }}>{v || '—'}</Typography>
                        </Stack>
                      ))}
                    </Box>
                  </Stack>
                )}
              </motion.div>
            </AnimatePresence>

            {error && <Alert severity="error" sx={{ mt: 2.5, borderRadius: '12px' }}>{error}</Alert>}

            {/* Actions: MartZona Brand Buttons */}
            <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={back}
                disabled={submitting}
                sx={{
                  flex: 1,
                  py: 1.4,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 700,
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : '#CBD5E1',
                  color: isDark ? '#E2E8F0' : '#475569',
                  '&:hover': {
                    borderColor: BRAND_PURPLE,
                    color: BRAND_PURPLE,
                  },
                }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                endIcon={submitting ? null : step === STEPS.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
                onClick={step === STEPS.length - 1 ? submit : next}
                disabled={submitting}
                sx={{
                  flex: 2,
                  py: 1.4,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 15,
                  ...(step === STEPS.length - 1
                    ? {
                        background: `linear-gradient(135deg, ${BRAND_GOLD} 0%, #F59E0B 100%)`,
                        color: BRAND_PURPLE,
                        boxShadow: '0 4px 18px rgba(253, 182, 0, 0.45)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${BRAND_GOLD_DARK} 0%, #D97706 100%)`,
                        },
                      }
                    : {
                        background: `linear-gradient(135deg, ${BRAND_PURPLE} 0%, ${BRAND_PURPLE_LIGHT} 100%)`,
                        color: '#FFFFFF',
                        boxShadow: '0 4px 18px rgba(67, 4, 108, 0.35)',
                        '&:hover': {
                          background: `linear-gradient(135deg, ${BRAND_PURPLE_HOVER} 0%, #58088E 100%)`,
                        },
                      }),
                }}
              >
                {submitting ? (
                  <CircularProgress size={22} sx={{ color: step === STEPS.length - 1 ? BRAND_PURPLE : '#fff' }} />
                ) : step === STEPS.length - 1 ? (
                  'Create Profile'
                ) : (
                  `Continue to Step ${step + 2}`
                )}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

