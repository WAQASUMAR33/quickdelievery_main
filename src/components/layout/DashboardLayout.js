'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'

import AppBar         from '@mui/material/AppBar'
import Avatar         from '@mui/material/Avatar'
import Badge          from '@mui/material/Badge'
import Box            from '@mui/material/Box'
import Button         from '@mui/material/Button'
import Chip           from '@mui/material/Chip'
import Divider        from '@mui/material/Divider'
import IconButton     from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Menu           from '@mui/material/Menu'
import MenuItem       from '@mui/material/MenuItem'
import TextField      from '@mui/material/TextField'
import Toolbar        from '@mui/material/Toolbar'
import Tooltip        from '@mui/material/Tooltip'
import Typography     from '@mui/material/Typography'

import LogoutOutlinedIcon        from '@mui/icons-material/LogoutOutlined'
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined'
import PersonOutlinedIcon        from '@mui/icons-material/PersonOutlined'
import SearchIcon                from '@mui/icons-material/Search'
import SettingsOutlinedIcon      from '@mui/icons-material/SettingsOutlined'
import ShoppingBagOutlinedIcon   from '@mui/icons-material/ShoppingBagOutlined'

const BRAND = '#39772A'

const DashboardLayout = ({ children }) => {
  const { user, userData, logout } = useAuth()
  const router = useRouter()
  const [anchorEl, setAnchorEl] = useState(null)
  const [notifAnchorEl, setNotifAnchorEl] = useState(null)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const menuOpen = Boolean(anchorEl)
  const notifOpen = Boolean(notifAnchorEl)

  const fetchPendingCount = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (!token || token === 'GUEST_SESSION') return
      const res = await fetch('/api/orders/pending-count', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && typeof data.count === 'number') {
        setPendingOrdersCount(data.count)
      }
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchPendingCount()
    const interval = setInterval(fetchPendingCount, 20000)
    return () => clearInterval(interval)
  }, [fetchPendingCount])

  const handleLogout = async () => {
    setAnchorEl(null)
    try { await logout() } catch (e) { console.error('Logout error:', e) }
  }

  const initials    = (userData?.username || user?.displayName || 'U').charAt(0).toUpperCase()
  const displayName = userData?.username || user?.displayName || 'User'
  const role        = userData?.role?.toLowerCase() || 'user'

  const handleOpenPendingOrders = () => {
    setNotifAnchorEl(null)
    const targetPath = userData?.role === 'VENDOR'
      ? '/vendor/dashboard/orders/pending'
      : '/admin/dashboard/orders/pending'
    router.push(targetPath)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'flex-start' }}>

      {/* Sidebar */}
      <Sidebar />

      {/* Right panel */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>

        {/* ── Top AppBar ── */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}
        >
          <Toolbar sx={{ gap: 2, minHeight: '56px !important', px: 3 }}>

            {/* Search */}
            <TextField
              size="small"
              placeholder="Search…"
              sx={{ maxWidth: 360, flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ flex: 1 }} />

            {/* Notifications / Pending Orders Badge */}
            <Tooltip title={pendingOrdersCount > 0 ? `${pendingOrdersCount} Pending Order${pendingOrdersCount > 1 ? 's' : ''}` : 'Notifications'}>
              <IconButton size="small" sx={{ color: 'text.secondary' }} onClick={e => setNotifAnchorEl(e.currentTarget)}>
                <Badge
                  badgeContent={pendingOrdersCount}
                  color="error"
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontWeight: 800,
                      fontSize: 10,
                      minWidth: 18,
                      height: 18,
                      borderRadius: '9px',
                      bgcolor: '#ef4444'
                    }
                  }}
                >
                  <NotificationsOutlinedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications Dropdown Menu */}
            <Menu
              anchorEl={notifAnchorEl}
              open={notifOpen}
              onClose={() => setNotifAnchorEl(null)}
              PaperProps={{ elevation: 4, sx: { borderRadius: 0, width: 310, mt: 0.75, p: 0 } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingBagOutlinedIcon sx={{ color: BRAND, fontSize: 18 }} />
                  <Typography variant="subtitle2" fontWeight={800} color="#111827">Order Alerts</Typography>
                </Box>
                {pendingOrdersCount > 0 && (
                  <Chip
                    label={`${pendingOrdersCount} PENDING`}
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: 10, fontWeight: 800, borderRadius: 0 }}
                  />
                )}
              </Box>
              <Box sx={{ p: 2 }}>
                {pendingOrdersCount > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      You have <Box component="span" fontWeight={800} color="error.main">{pendingOrdersCount}</Box> pending order{pendingOrdersCount > 1 ? 's' : ''} requiring processing and review.
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      fullWidth
                      onClick={handleOpenPendingOrders}
                      sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2e6022' }, borderRadius: 0, textTransform: 'none', fontWeight: 700, py: 0.75 }}
                    >
                      View Pending Orders
                    </Button>
                  </Box>
                ) : (
                  <Box sx={{ py: 1.5, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">No pending orders at this moment.</Typography>
                  </Box>
                )}
              </Box>
            </Menu>

            {/* User avatar */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', px: 1, py: 0.5, '&:hover': { bgcolor: 'grey.100' } }}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              <Avatar
                src={userData?.urlLogo || userData?.avatarUrl || userData?.photoURL || user?.photoURL || ''}
                alt={displayName}
                sx={{ width: 32, height: 32, bgcolor: BRAND, fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0' }}
              >
                {initials}
              </Avatar>
              <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{displayName}</Typography>
                <Typography variant="caption" color="text.secondary" textTransform="capitalize" lineHeight={1}>{role}</Typography>
              </Box>
            </Box>

            {/* User dropdown menu */}
            <Menu
              anchorEl={anchorEl}
              open={menuOpen}
              onClose={() => setAnchorEl(null)}
              PaperProps={{ elevation: 2, sx: { borderRadius: 0, minWidth: 180, mt: 0.5 } }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { setAnchorEl(null); router.push(userData?.role === 'VENDOR' ? '/vendor/dashboard/profile' : '/admin/dashboard/settings') }} dense>
                <PersonOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Typography variant="body2">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={() => { setAnchorEl(null); router.push('/admin/dashboard/settings') }} dense>
                <SettingsOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Typography variant="body2">Settings</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} dense sx={{ color: 'error.main' }}>
                <LogoutOutlinedIcon fontSize="small" sx={{ mr: 1.5 }} />
                <Typography variant="body2">Logout</Typography>
              </MenuItem>
            </Menu>

          </Toolbar>
        </AppBar>

        {/* ── Main content ── */}
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>

      </Box>
    </Box>
  )
}

export default DashboardLayout

