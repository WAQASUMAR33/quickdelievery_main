'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'

import Box             from '@mui/material/Box'
import List            from '@mui/material/List'
import ListItem        from '@mui/material/ListItem'
import ListItemButton  from '@mui/material/ListItemButton'
import ListItemIcon    from '@mui/material/ListItemIcon'
import ListItemText    from '@mui/material/ListItemText'
import Collapse        from '@mui/material/Collapse'
import Avatar          from '@mui/material/Avatar'
import Typography      from '@mui/material/Typography'
import Divider         from '@mui/material/Divider'
import Tooltip         from '@mui/material/Tooltip'
import IconButton      from '@mui/material/IconButton'
import Chip            from '@mui/material/Chip'

import DashboardOutlinedIcon     from '@mui/icons-material/DashboardOutlined'
import PeopleOutlinedIcon        from '@mui/icons-material/PeopleOutlined'
import ShoppingBagOutlinedIcon   from '@mui/icons-material/ShoppingBagOutlined'
import Inventory2OutlinedIcon    from '@mui/icons-material/Inventory2Outlined'
import CreditCardOutlinedIcon    from '@mui/icons-material/CreditCardOutlined'
import SettingsOutlinedIcon      from '@mui/icons-material/SettingsOutlined'
import LogoutIcon                from '@mui/icons-material/Logout'
import StorefrontOutlinedIcon    from '@mui/icons-material/StorefrontOutlined'
import HowToRegOutlinedIcon      from '@mui/icons-material/HowToRegOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import WarningAmberOutlinedIcon  from '@mui/icons-material/WarningAmberOutlined'
import MenuOpenIcon              from '@mui/icons-material/MenuOpen'
import MenuIcon                  from '@mui/icons-material/Menu'
import WorkOutlinedIcon          from '@mui/icons-material/WorkOutlined'
import FolderOutlinedIcon        from '@mui/icons-material/FolderOutlined'
import AccountTreeOutlinedIcon   from '@mui/icons-material/AccountTreeOutlined'
import ExpandLessIcon            from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon            from '@mui/icons-material/ExpandMore'

const BRAND      = '#D70F64'
const BG         = '#0f1724'   // deep navy
const BG_HOVER   = 'rgba(255,255,255,0.06)'
const TEXT_DIM   = 'rgba(255,255,255,0.55)'
const BORDER     = 'rgba(255,255,255,0.07)'
const SIDEBAR_W  = 256
const COLLAPSED_W = 64

// ── Menu definitions ─────────────────────────────────────────────────────────
const ADMIN_ITEMS = [
  { id: 'dashboard',      label: 'Dashboard',         icon: DashboardOutlinedIcon,     path: '/dashboard' },
  { id: 'vendors',        label: 'Vendors',            icon: StorefrontOutlinedIcon,    path: '/dashboard/vendors' },
  { id: 'customers',      label: 'Customers',          icon: PeopleOutlinedIcon,        path: '/dashboard/customers' },
  { id: 'drivers',        label: 'Drivers',            icon: LocalShippingOutlinedIcon, path: '/dashboard/drivers' },
  { id: 'payments',       label: 'Payments',           icon: CreditCardOutlinedIcon,    path: '/dashboard/payments' },
  {
    id: 'orders', label: 'Orders', icon: ShoppingBagOutlinedIcon,
    children: [
      { id: 'new-orders',     label: 'New Orders',     path: '/dashboard/orders/new' },
      { id: 'order-history',  label: 'Order History',  path: '/dashboard/orders/history' },
      { id: 'pending-orders', label: 'Pending Orders', path: '/dashboard/orders/pending' },
    ],
  },
  { id: 'products',      label: 'Products',         icon: Inventory2OutlinedIcon,  path: '/dashboard/products' },
  { id: 'categories',    label: 'Categories',       icon: FolderOutlinedIcon,      path: '/dashboard/categories' },
  { id: 'subcategories', label: 'Subcategories',    icon: AccountTreeOutlinedIcon, path: '/dashboard/subcategories' },
  {
    id: 'business-setup', label: 'Business Setup', icon: WorkOutlinedIcon,
    children: [
      { id: 'business-categories', label: 'Business Categories', path: '/dashboard/business-categories' },
      { id: 'business-types',      label: 'Business Types',      path: '/dashboard/business-types' },
    ],
  },
  { id: 'employees', label: 'Employees', icon: HowToRegOutlinedIcon,    path: '/dashboard/employees' },
  { id: 'disputes',  label: 'Disputes',  icon: WarningAmberOutlinedIcon, path: '/dashboard/disputes' },
  { id: 'settings',  label: 'Settings',  icon: SettingsOutlinedIcon,    path: '/dashboard/settings' },
]

const VENDOR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon, path: '/dashboard' },
  {
    id: 'orders', label: 'Orders', icon: ShoppingBagOutlinedIcon,
    children: [
      { id: 'new-orders',     label: 'New Orders',     path: '/dashboard/orders/new' },
      { id: 'order-history',  label: 'Order History',  path: '/dashboard/orders/history' },
      { id: 'pending-orders', label: 'Pending Orders', path: '/dashboard/orders/pending' },
    ],
  },
  { id: 'products', label: 'Products', icon: Inventory2OutlinedIcon,   path: '/dashboard/products' },
  { id: 'disputes', label: 'Disputes', icon: WarningAmberOutlinedIcon, path: '/dashboard/disputes' },
  { id: 'settings', label: 'Settings', icon: SettingsOutlinedIcon,     path: '/dashboard/settings' },
]

const DEFAULT_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon, path: '/dashboard' },
  { id: 'settings',  label: 'Settings',  icon: SettingsOutlinedIcon,  path: '/dashboard/settings' },
]

// ── Main component ────────────────────────────────────────────────────────────
const Sidebar = () => {
  const [collapsed, setCollapsed]     = useState(false)
  const [expanded,  setExpanded]      = useState({})
  const { user, userData, logout }    = useAuth()
  const router   = useRouter()
  const pathname = usePathname()

  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))
  const go     = (path) => router.push(path)

  const handleLogout = async () => {
    try { await logout(); router.push('/login') }
    catch (e) { console.error('Logout error:', e) }
  }

  const isActive = (path) => {
    if (!path) return false
    if (path === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(path)
  }

  const role  = userData?.role || 'CUSTOMER'
  const items = role === 'ADMIN' ? ADMIN_ITEMS : role === 'VENDOR' ? VENDOR_ITEMS : DEFAULT_ITEMS

  // ── NavItem sub-component ──────────────────────────────────────────────────
  const NavItem = ({ item }) => {
    const Icon         = item.icon
    const hasChildren  = !!item.children?.length
    const isExpanded   = expanded[item.id]
    const active       = isActive(item.path)
    const childActive  = hasChildren && item.children.some(c => isActive(c.path))
    const highlighted  = active || childActive

    const btn = (
      <ListItemButton
        onClick={() => hasChildren ? (!collapsed && toggle(item.id)) : go(item.path)}
        sx={{
          borderRadius: '8px',
          mb: 0.25,
          pl: collapsed ? 1.5 : 1.5,
          pr: 1,
          minHeight: 42,
          bgcolor:   active   ? BRAND        : childActive ? `${BRAND}30` : 'transparent',
          color:     highlighted ? '#fff'    : TEXT_DIM,
          '&:hover': {
            bgcolor: active ? '#b00d52' : childActive ? `${BRAND}40` : BG_HOVER,
            color: '#fff',
          },
          transition: 'all 0.18s ease',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {Icon && (
          <ListItemIcon sx={{
            color:    highlighted ? '#fff' : TEXT_DIM,
            minWidth: collapsed ? 'auto' : 36,
            '& .MuiSvgIcon-root': { fontSize: 20 },
          }}>
            <Icon />
          </ListItemIcon>
        )}
        {!collapsed && (
          <>
            <ListItemText
              primary={item.label}
              primaryTypographyProps={{
                variant: 'body2',
                fontWeight: highlighted ? 600 : 400,
                fontSize: 13.5,
                lineHeight: 1.3,
              }}
            />
            {hasChildren && (
              isExpanded
                ? <ExpandLessIcon sx={{ fontSize: 16, opacity: 0.6 }} />
                : <ExpandMoreIcon sx={{ fontSize: 16, opacity: 0.6 }} />
            )}
          </>
        )}
      </ListItemButton>
    )

    return (
      <ListItem disablePadding sx={{ display: 'block' }}>
        {collapsed && !hasChildren
          ? <Tooltip title={item.label} placement="right" arrow><span>{btn}</span></Tooltip>
          : btn
        }

        {/* Children */}
        {hasChildren && !collapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List disablePadding sx={{ pl: 1 }}>
              {item.children.map(child => {
                const ca = isActive(child.path)
                return (
                  <ListItem key={child.id} disablePadding>
                    <ListItemButton
                      onClick={() => go(child.path)}
                      sx={{
                        borderRadius: '8px',
                        mb: 0.25,
                        pl: 2,
                        minHeight: 36,
                        color:   ca ? '#fff' : TEXT_DIM,
                        bgcolor: ca ? BRAND  : 'transparent',
                        '&:hover': { bgcolor: ca ? '#b00d52' : BG_HOVER, color: '#fff' },
                        transition: 'all 0.18s ease',
                      }}
                    >
                      <Box sx={{
                        width: 5, height: 5, borderRadius: '50%', flexShrink: 0, mr: 1.5,
                        bgcolor: ca ? '#fff' : 'rgba(255,255,255,0.25)',
                      }} />
                      <ListItemText
                        primary={child.label}
                        primaryTypographyProps={{
                          variant: 'body2', fontWeight: ca ? 600 : 400, fontSize: 13,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                )
              })}
            </List>
          </Collapse>
        )}
      </ListItem>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{
      width:    collapsed ? COLLAPSED_W : SIDEBAR_W,
      minWidth: collapsed ? COLLAPSED_W : SIDEBAR_W,
      height:   '100vh',
      bgcolor:  BG,
      display:  'flex',
      flexDirection: 'column',
      borderRight: `1px solid ${BORDER}`,
      transition: 'width 0.25s ease, min-width 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
      position: 'relative',
    }}>

      {/* ── Logo / Header ── */}
      <Box sx={{
        px: collapsed ? 0 : 2, py: 1.5,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 60, flexShrink: 0,
      }}>
        {!collapsed && (
          <Box
            onClick={() => go('/dashboard')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flex: 1, '&:hover': { opacity: 0.85 }, transition: 'opacity 0.2s' }}
          >
            <Box sx={{
              width: 34, height: 34, bgcolor: BRAND, borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>QD</Typography>
            </Box>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>
                Quick Delivery
              </Typography>
              <Typography sx={{ color: TEXT_DIM, fontSize: 10, letterSpacing: 0.3 }}>
                Admin Panel
              </Typography>
            </Box>
          </Box>
        )}
        <IconButton
          size="small"
          onClick={() => setCollapsed(p => !p)}
          sx={{ color: TEXT_DIM, '&:hover': { bgcolor: BG_HOVER, color: '#fff' } }}
        >
          {collapsed ? <MenuIcon fontSize="small" /> : <MenuOpenIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* ── User Card ── */}
      {!collapsed && (
        <Box sx={{
          px: 2, py: 1.5,
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', gap: 1.5,
          flexShrink: 0,
        }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: BRAND, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {(user?.displayName || userData?.username || 'U').charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography sx={{
              color: '#fff', fontWeight: 600, fontSize: 13, lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {userData?.username || user?.displayName || 'User'}
            </Typography>
            <Chip
              label={userData?.role || 'USER'}
              size="small"
              sx={{
                height: 17, fontSize: 10, mt: 0.25,
                bgcolor: `${BRAND}25`, color: BRAND, fontWeight: 700,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          </Box>
        </Box>
      )}

      {/* ── Nav Items ── */}
      <Box sx={{
        flex: 1, overflowY: 'auto', overflowX: 'hidden',
        px: collapsed ? 0.75 : 1.25, py: 1,
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 4 },
      }}>
        <List disablePadding>
          {items.map(item => <NavItem key={item.id} item={item} />)}
        </List>
      </Box>

      {/* ── Logout ── */}
      <Box sx={{ px: collapsed ? 0.75 : 1.25, py: 1, borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <ListItemButton
            onClick={handleLogout}
            sx={{
              borderRadius: '8px',
              color: TEXT_DIM,
              minHeight: 42,
              justifyContent: collapsed ? 'center' : 'flex-start',
              '&:hover': { bgcolor: 'rgba(239,68,68,0.12)', color: '#ef4444' },
              transition: 'all 0.18s ease',
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 'auto' : 36, '& .MuiSvgIcon-root': { fontSize: 20 } }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            {!collapsed && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500, fontSize: 13.5 }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>

    </Box>
  )
}

export default Sidebar
