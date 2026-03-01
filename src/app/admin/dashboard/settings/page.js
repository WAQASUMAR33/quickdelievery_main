'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserVerification } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import FormControl      from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Select           from '@mui/material/Select'
import Switch           from '@mui/material/Switch'
import TextField        from '@mui/material/TextField'
import Typography       from '@mui/material/Typography'

import BellOutlinedIcon     from '@mui/icons-material/NotificationsOutlined'
import PersonOutlinedIcon   from '@mui/icons-material/PersonOutlined'
import SaveOutlinedIcon     from '@mui/icons-material/SaveOutlined'
import ShieldOutlinedIcon   from '@mui/icons-material/ShieldOutlined'
import VisibilityIcon       from '@mui/icons-material/Visibility'
import VisibilityOffIcon    from '@mui/icons-material/VisibilityOff'

const BRAND      = '#D70F64'
const DROP_MIN_W = 300
const tf         = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

export default function SettingsPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    displayName:     '',
    email:           '',
    phoneNumber:     '',
    currentPassword: '',
    newPassword:     '',
    confirmPassword: '',
    notifications: { email: true, push: true, sms: false },
    privacy:       { profileVisibility: 'public', dataSharing: false },
  })

  useEffect(() => {
    if (!loading) {
      const verification = checkUserVerification(user, userData)
      if (!verification.isVerified) router.push('/login')
    }
  }, [user, userData, loading, router])

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        displayName:  user.displayName  || '',
        email:        user.email        || '',
        phoneNumber:  user.phoneNumber  || '',
      }))
    }
  }, [user])

  const setTop = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))
  const setNested = (section, key, val) =>
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [key]: val } }))

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Settings updated:', formData)
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    )
  }

  if (!user || !userData) return null

  const verification = checkUserVerification(user, userData)
  if (!verification.isVerified) return null

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Settings</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your account settings and preferences
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3, alignItems: 'start' }}>

          {/* Profile Card */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <PersonOutlinedIcon sx={{ color: BRAND, fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={700}>Profile Information</Typography>
            </Box>
            <CardContent sx={{ p: 2.5 }}>
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    size="small"
                    label="Display Name"
                    value={formData.displayName}
                    onChange={e => setTop('displayName', e.target.value)}
                    {...tf}
                  />
                  <TextField
                    size="small"
                    label="Email"
                    type="email"
                    value={formData.email}
                    disabled
                    {...tf}
                  />
                  <TextField
                    size="small"
                    label="Phone Number"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={e => setTop('phoneNumber', e.target.value)}
                    {...tf}
                  />
                </Box>

                <Divider />

                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  Change Password
                </Typography>

                <TextField
                  size="small"
                  label="Current Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={e => setTop('currentPassword', e.target.value)}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(v => !v)} edge="end">
                          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    size="small"
                    label="New Password"
                    type="password"
                    value={formData.newPassword}
                    onChange={e => setTop('newPassword', e.target.value)}
                    {...tf}
                  />
                  <TextField
                    size="small"
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setTop('confirmPassword', e.target.value)}
                    {...tf}
                  />
                </Box>

                <Box>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveOutlinedIcon />}
                    sx={{ bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b00d52' } }}
                  >
                    Save Changes
                  </Button>
                </Box>

              </Box>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

            {/* Notifications Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <BellOutlinedIcon sx={{ color: BRAND, fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
              </Box>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { key: 'email', label: 'Email Notifications',  desc: 'Receive updates via email' },
                  { key: 'push',  label: 'Push Notifications',   desc: 'Browser notifications' },
                  { key: 'sms',   label: 'SMS Notifications',    desc: 'Text message alerts' },
                ].map(({ key, label, desc }) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{label}</Typography>
                      <Typography variant="caption" color="text.secondary">{desc}</Typography>
                    </Box>
                    <Switch
                      size="small"
                      checked={formData.notifications[key]}
                      onChange={e => setNested('notifications', key, e.target.checked)}
                      sx={{ '& .MuiSwitch-thumb': { borderRadius: 0 }, '& .MuiSwitch-track': { borderRadius: 0 } }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Privacy Card */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ShieldOutlinedIcon sx={{ color: BRAND, fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight={700}>Privacy</Typography>
              </Box>
              <CardContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

                <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
                  <InputLabel>Profile Visibility</InputLabel>
                  <Select
                    value={formData.privacy.profileVisibility}
                    label="Profile Visibility"
                    onChange={e => setNested('privacy', 'profileVisibility', e.target.value)}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value="public">Public</MenuItem>
                    <MenuItem value="private">Private</MenuItem>
                    <MenuItem value="friends">Friends Only</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={500}>Data Sharing</Typography>
                    <Typography variant="caption" color="text.secondary">Allow data sharing with partners</Typography>
                  </Box>
                  <Switch
                    size="small"
                    checked={formData.privacy.dataSharing}
                    onChange={e => setNested('privacy', 'dataSharing', e.target.checked)}
                    sx={{ '& .MuiSwitch-thumb': { borderRadius: 0 }, '& .MuiSwitch-track': { borderRadius: 0 } }}
                  />
                </Box>

              </CardContent>
            </Card>

          </Box>
        </Box>
      </Box>
    </DashboardLayout>
  )
}
