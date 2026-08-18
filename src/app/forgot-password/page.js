'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import toast, { Toaster } from 'react-hot-toast'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LockResetIcon from '@mui/icons-material/LockReset'
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'

const BRAND = '#39772A'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    backgroundColor: '#fafbfc',
    transition: 'all 0.2s ease-in-out',
    '&:hover fieldset': { borderColor: BRAND },
    '&.Mui-focused': {
      backgroundColor: '#ffffff',
      '& fieldset': { borderColor: BRAND, borderWidth: '2px' },
    },
  },
  '& label.Mui-focused': { color: BRAND },
}

/* ── Left Branding Panel ── */
function BrandPanel({ step }) {
  const stepsInfo = [
    { title: 'Forgot Password?', desc: 'No worries! Enter your registered email and we’ll send you a 6-digit verification code.' },
    { title: 'Verify OTP Code', desc: 'Check your email inbox for the 6-digit code. It remains valid for 5 minutes.' },
    { title: 'Set New Password', desc: 'Choose a strong, secure password that you haven’t used before.' },
    { title: 'All Done!', desc: 'Your password has been securely updated. Redirecting you to login.' },
  ]

  const currentInfo = stepsInfo[step - 1] || stepsInfo[0]

  return (
    <Box sx={{
      display: { xs: 'none', lg: 'flex' },
      width: '44%', flexShrink: 0,
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      p: 6, position: 'sticky', top: 0, height: '100vh',
      background: `linear-gradient(155deg, ${BRAND} 0%, #1e4513 100%)`,
      overflow: 'hidden',
    }}>
      {/* Background ambient elements */}
      <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Box sx={{ position: 'absolute', top: -70, left: -70, width: 340, height: 340, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', filter: 'blur(50px)' }} />
        <Box sx={{ position: 'absolute', bottom: -90, right: -90, width: 420, height: 420, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', filter: 'blur(70px)' }} />
      </Box>

      {/* Center Content */}
      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
        <Box sx={{
          width: 90, height: 90, borderRadius: '24px',
          bgcolor: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          mx: 'auto', mb: 3,
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
          border: '1px solid rgba(255,255,255,0.2)',
        }}>
          {step === 1 && <EmailOutlinedIcon sx={{ fontSize: 44, color: '#fff' }} />}
          {step === 2 && <TimerOutlinedIcon sx={{ fontSize: 44, color: '#fff' }} />}
          {step === 3 && <LockResetIcon sx={{ fontSize: 44, color: '#fff' }} />}
          {step === 4 && <CheckCircleOutlineIcon sx={{ fontSize: 44, color: '#fff' }} />}
        </Box>

        <Typography variant="h4" fontWeight={800} color="#fff" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
          {currentInfo.title}
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, mb: 4 }}>
          {currentInfo.desc}
        </Typography>

        {/* Step Progress Indicators */}
        <Stack direction="row" spacing={1.5} justifyContent="center">
          {[1, 2, 3].map((s) => (
            <Box
              key={s}
              sx={{
                width: step === s ? 32 : 10,
                height: 10,
                borderRadius: '5px',
                bgcolor: step >= s ? '#fff' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  )
}

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Steps: 1 = Email, 2 = OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1)

  // Form Fields
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // States
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [resendLoading, setResendLoading] = useState(false)
  const [countdown, setCountdown] = useState(300) // 5 minutes = 300 seconds
  const [redirectCountdown, setRedirectCountdown] = useState(3)

  // OTP inputs refs
  const otpRefs = useRef([])

  // ── 5-Minute Countdown Timer ──
  useEffect(() => {
    let timer
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, countdown])

  // ── Auto redirect countdown on success ──
  useEffect(() => {
    let timer
    if (step === 4) {
      timer = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            router.push('/login')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [step, router])

  // Format seconds to MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // ── Step 1: Send OTP ──
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to send verification code. Please try again.')
        return
      }

      toast.success('Verification code sent to your email!')
      setCountdown(300) // Reset to 5 minutes
      setOtp(['', '', '', '', '', ''])
      setStep(2)
    } catch (err) {
      console.error(err)
      setErrorMsg('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Resend OTP ──
  const handleResendOtp = async () => {
    setErrorMsg('')
    setResendLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Failed to resend code.')
        return
      }

      toast.success('A new 6-digit code has been sent!')
      setCountdown(300)
      setOtp(['', '', '', '', '', ''])
      if (otpRefs.current[0]) otpRefs.current[0].focus()
    } catch (err) {
      toast.error('Network error while resending code.')
    } finally {
      setResendLoading(false)
    }
  }

  // ── OTP input change handling ──
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Auto-advance to next box
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pastedData) return

    const newOtp = [...otp]
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i]
    }
    setOtp(newOtp)
    const nextIndex = Math.min(pastedData.length, 5)
    otpRefs.current[nextIndex]?.focus()
  }

  // ── Step 2: Verify OTP ──
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    const fullOtp = otp.join('')
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.')
      return
    }

    if (countdown <= 0) {
      setErrorMsg('Verification code has expired. Please click "Resend Code".')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: fullOtp }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Invalid or expired verification code.')
        return
      }

      toast.success('Code verified successfully!')
      setStep(3)
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: Reset Password ──
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault()
    setErrorMsg('')

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.join(''),
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Failed to reset password. Please try again.')
        return
      }

      toast.success('Password updated successfully!')
      setStep(4)
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#ffffff' }}>
      <Toaster position="top-center" />

      {/* Left Brand Panel */}
      <BrandPanel step={step} />

      {/* Right Form Panel */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        px: { xs: 2.5, sm: 5, md: 8 },
        py: 6,
      }}>
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 460 }}>
          
          {/* Header Link / Back button */}
          {step < 4 && (
            <Box sx={{ mb: 3.5 }}>
              <Button
                component={NextLink}
                href={step === 1 ? '/login' : '#'}
                onClick={(e) => {
                  if (step > 1) {
                    e.preventDefault()
                    setErrorMsg('')
                    setStep((prev) => prev - 1)
                  }
                }}
                startIcon={<ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: 13,
                  p: 0,
                  '&:hover': { bgcolor: 'transparent', color: BRAND },
                }}
              >
                {step === 1 ? 'Back to Login' : 'Previous Step'}
              </Button>
            </Box>
          )}

          {/* ════════════ STEP 1: EMAIL INPUT ════════════ */}
          {step === 1 && (
            <Box component="form" onSubmit={handleSendOtp}>
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                  Reset Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter the email address associated with your Quick Delivery account to receive a 6-digit code.
                </Typography>
              </Box>

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setErrorMsg('')}>
                  {errorMsg}
                </Alert>
              )}

              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="e.g. name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlinedIcon sx={{ fontSize: 19, color: 'action.active' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading || !email}
                  sx={{
                    bgcolor: BRAND,
                    color: '#fff',
                    py: 1.5,
                    borderRadius: '12px',
                    fontWeight: 700,
                    fontSize: 15,
                    textTransform: 'none',
                    boxShadow: '0 4px 14px rgba(57, 119, 42, 0.35)',
                    '&:hover': { bgcolor: '#2e6122' },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: '#fff' }} />
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </Stack>
            </Box>
          )}

          {/* ════════════ STEP 2: OTP INPUT & 5-MIN TIMER ════════════ */}
          {step === 2 && (
            <Box component="form" onSubmit={handleVerifyOtp}>
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                  Enter 6-Digit Code
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  We have sent a verification code to <strong>{email}</strong>
                </Typography>
              </Box>

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setErrorMsg('')}>
                  {errorMsg}
                </Alert>
              )}

              {/* 6 Digit Inputs */}
              <Box sx={{ display: 'flex', gap: { xs: 1, sm: 1.5 }, justifyContent: 'space-between', mb: 3 }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <TextField
                    key={idx}
                    inputRef={(el) => (otpRefs.current[idx] = el)}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    inputProps={{
                      maxLength: 1,
                      style: {
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: 700,
                        padding: '14px 0',
                      },
                      inputMode: 'numeric',
                    }}
                    sx={{
                      width: { xs: '45px', sm: '56px' },
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#fafbfc',
                        '&:hover fieldset': { borderColor: BRAND },
                        '&.Mui-focused fieldset': { borderColor: BRAND, borderWidth: '2px' },
                      },
                    }}
                  />
                ))}
              </Box>

              {/* Timer Alert Badge */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: '12px',
                bgcolor: countdown > 0 ? '#f0fdf4' : '#fef2f2',
                border: '1px solid',
                borderColor: countdown > 0 ? '#bbf7d0' : '#fecaca',
                mb: 3,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimerOutlinedIcon sx={{ fontSize: 20, color: countdown > 0 ? BRAND : '#dc2626' }} />
                  <Typography variant="body2" fontWeight={600} color={countdown > 0 ? 'text.primary' : '#dc2626'}>
                    {countdown > 0 ? `Code expires in: ${formatTime(countdown)}` : 'Code has expired'}
                  </Typography>
                </Box>

                <Button
                  size="small"
                  onClick={handleResendOtp}
                  disabled={resendLoading || countdown > 240} // Allow resend after 1 min or expiry
                  startIcon={resendLoading ? <CircularProgress size={14} /> : <RefreshIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    color: BRAND,
                    fontWeight: 700,
                    fontSize: 13,
                    textTransform: 'none',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Resend Code
                </Button>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || otp.join('').length !== 6 || countdown <= 0}
                sx={{
                  bgcolor: BRAND,
                  color: '#fff',
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(57, 119, 42, 0.35)',
                  '&:hover': { bgcolor: '#2e6122' },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Verify Code'}
              </Button>
            </Box>
          )}

          {/* ════════════ STEP 3: SET NEW PASSWORD ════════════ */}
          {step === 3 && (
            <Box component="form" onSubmit={handleResetPassword}>
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                  Create New Password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Your new password must be at least 6 characters long.
                </Typography>
              </Box>

              {errorMsg && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }} onClose={() => setErrorMsg('')}>
                  {errorMsg}
                </Alert>
              )}

              <Stack spacing={2.5} sx={{ mb: 3.5 }}>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>
                    New Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ fontSize: 19, color: 'action.active' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowPassword((v) => !v)}>
                            {showPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ mb: 0.75 }}>
                    Confirm New Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    sx={fieldSx}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon sx={{ fontSize: 19, color: 'action.active' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" onClick={() => setShowConfirmPassword((v) => !v)}>
                            {showConfirmPassword ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} /> : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Validation checklist */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Stack spacing={0.75}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: newPassword.length >= 6 ? BRAND : '#cbd5e1' }} />
                      <Typography variant="caption" color={newPassword.length >= 6 ? 'text.primary' : 'text.secondary'} fontWeight={newPassword.length >= 6 ? 600 : 400}>
                        At least 6 characters
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 16, color: newPassword && newPassword === confirmPassword ? BRAND : '#cbd5e1' }} />
                      <Typography variant="caption" color={newPassword && newPassword === confirmPassword ? 'text.primary' : 'text.secondary'} fontWeight={newPassword && newPassword === confirmPassword ? 600 : 400}>
                        Passwords match
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}
                sx={{
                  bgcolor: BRAND,
                  color: '#fff',
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(57, 119, 42, 0.35)',
                  '&:hover': { bgcolor: '#2e6122' },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Reset Password'}
              </Button>
            </Box>
          )}

          {/* ════════════ STEP 4: SUCCESS CONFIRMATION ════════════ */}
          {step === 4 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '50%',
                bgcolor: '#f0fdf4',
                color: BRAND,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 3,
                boxShadow: '0 8px 24px rgba(57, 119, 42, 0.15)',
              }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 48 }} />
              </Box>

              <Typography variant="h4" fontWeight={800} color="text.primary" gutterBottom sx={{ letterSpacing: '-0.5px' }}>
                Password Updated!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 360, mx: 'auto' }}>
                Your password has been changed successfully. You can now log in using your new credentials.
              </Typography>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Redirecting to login in <strong>{redirectCountdown} seconds</strong>...
              </Typography>

              <Button
                component={NextLink}
                href="/login"
                fullWidth
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                sx={{
                  bgcolor: BRAND,
                  color: '#fff',
                  py: 1.5,
                  borderRadius: '12px',
                  fontWeight: 700,
                  fontSize: 15,
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(57, 119, 42, 0.35)',
                  '&:hover': { bgcolor: '#2e6122' },
                }}
              >
                Go to Login
              </Button>
            </Box>
          )}

        </Paper>
      </Box>
    </Box>
  )
}
