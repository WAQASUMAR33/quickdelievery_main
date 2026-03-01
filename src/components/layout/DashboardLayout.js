'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'

import AppBar         from '@mui/material/AppBar'
import Avatar         from '@mui/material/Avatar'
import Badge          from '@mui/material/Badge'
import Box            from '@mui/material/Box'
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

const BRAND = '#D70F64'

const DashboardLayout = ({ children }) => {
  const { user, userData, logout } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)
  const menuOpen = Boolean(anchorEl)

  const handleLogout = async () => {
    setAnchorEl(null)
    try { await logout() } catch (e) { console.error('Logout error:', e) }
  }

  const initials    = (userData?.username || user?.displayName || 'U').charAt(0).toUpperCase()
  const displayName = userData?.username || user?.displayName || 'User'
  const role        = userData?.role?.toLowerCase() || 'user'

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex' }}>

      {/* Sidebar */}
      <Sidebar />

      {/* Right panel */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Top AppBar ── */}
        <AppBar
          position="static"
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

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <Badge variant="dot" color="error">
                  <NotificationsOutlinedIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User avatar */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', px: 1, py: 0.5, '&:hover': { bgcolor: 'grey.100' } }}
              onClick={e => setAnchorEl(e.currentTarget)}
            >
              <Avatar sx={{ width: 30, height: 30, bgcolor: BRAND, fontSize: 13, fontWeight: 700 }}>
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
              <MenuItem onClick={() => setAnchorEl(null)} dense>
                <PersonOutlinedIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} />
                <Typography variant="body2">Profile</Typography>
              </MenuItem>
              <MenuItem onClick={() => setAnchorEl(null)} dense>
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
        <Box component="main" sx={{ flex: 1, overflow: 'auto' }}>
          {children}
        </Box>

      </Box>
    </Box>
  )
}

export default DashboardLayout
