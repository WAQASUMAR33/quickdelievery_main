'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import ProductCatalog from '@/components/customer/ProductCatalog'
import OrderHistory from '@/components/customer/OrderHistory'
import CustomerProfile from '@/components/customer/CustomerProfile'
import CartPage from '@/components/customer/CartPage'
import WishlistPage from '@/components/customer/WishlistPage'
import CustomerFooter from '@/components/customer/CustomerFooter'
import toast from 'react-hot-toast'

import AppBar              from '@mui/material/AppBar'
import Avatar              from '@mui/material/Avatar'
import Badge               from '@mui/material/Badge'
import Box                 from '@mui/material/Box'
import Button              from '@mui/material/Button'
import Card                from '@mui/material/Card'
import CardContent         from '@mui/material/CardContent'
import CardMedia           from '@mui/material/CardMedia'
import Chip                from '@mui/material/Chip'
import CircularProgress    from '@mui/material/CircularProgress'
import Divider             from '@mui/material/Divider'
import Drawer              from '@mui/material/Drawer'
import IconButton          from '@mui/material/IconButton'
import InputAdornment      from '@mui/material/InputAdornment'
import List                from '@mui/material/List'
import ListItemButton      from '@mui/material/ListItemButton'
import ListItemIcon        from '@mui/material/ListItemIcon'
import ListItemText        from '@mui/material/ListItemText'
import Menu                from '@mui/material/Menu'
import MenuItem            from '@mui/material/MenuItem'
import Paper               from '@mui/material/Paper'
import Stack               from '@mui/material/Stack'
import TextField           from '@mui/material/TextField'
import Toolbar             from '@mui/material/Toolbar'
import Tooltip             from '@mui/material/Tooltip'
import Typography          from '@mui/material/Typography'

import CloseIcon               from '@mui/icons-material/Close'
import DeliveryDiningIcon      from '@mui/icons-material/DeliveryDining'
import ExpandMoreIcon          from '@mui/icons-material/ExpandMore'
import FavoriteIcon            from '@mui/icons-material/Favorite'
import FavoriteBorderIcon      from '@mui/icons-material/FavoriteBorder'
import FlashOnIcon             from '@mui/icons-material/FlashOn'
import HomeIcon                from '@mui/icons-material/Home'
import HomeOutlinedIcon        from '@mui/icons-material/HomeOutlined'
import LocationOnIcon          from '@mui/icons-material/LocationOn'
import LogoutOutlinedIcon      from '@mui/icons-material/LogoutOutlined'
import MenuIcon                from '@mui/icons-material/Menu'
import PersonIcon              from '@mui/icons-material/Person'
import PersonOutlineIcon       from '@mui/icons-material/PersonOutline'
import SearchIcon              from '@mui/icons-material/Search'
import SecurityIcon            from '@mui/icons-material/Security'
import SettingsOutlinedIcon    from '@mui/icons-material/SettingsOutlined'
import ShoppingBagIcon         from '@mui/icons-material/ShoppingBag'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import StarIcon                from '@mui/icons-material/Star'
import StarBorderIcon          from '@mui/icons-material/StarBorder'
import StorefrontIcon          from '@mui/icons-material/Storefront'

const THEME = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#7c3aed',
  accent: '#a855f7',
  gradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 35%, #7c3aed 70%, #9333ea 100%)',
  cardGradient: 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
}

function storefrontGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function CustomerDashboard({ initialTab = 'products' }) {
  const { user, userData, logout, loading: authLoading } = useAuth()
  const { addToCart, getTotalItems, getTotalPrice } = useCart()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [categories, setCategories] = useState([])
  const [serviceMode, setServiceMode] = useState('delivery')

  useEffect(() => {
    if (authLoading || !user || !userData) return
    const access = checkUserAccess(user, userData, ['CUSTOMER'])
    if (access.hasAccess) return
    const role = getUserRole(userData)
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
    else if (role === 'VENDOR') router.push('/vendor/dashboard')
    else router.push(access.redirectTo)
  }, [user, userData, authLoading, router])

  useEffect(() => {
    const handleOpenCart = () => setActiveTab('cart')
    const handleGoProducts = () => setActiveTab('products')
    
    window.addEventListener('openCart', handleOpenCart)
    window.addEventListener('goProducts', handleGoProducts)
    
    return () => {
      window.removeEventListener('openCart', handleOpenCart)
      window.removeEventListener('goProducts', handleGoProducts)
    }
  }, [])

  const { isGuest, navTabs, effectiveTab } = useMemo(() => {
    const guest = userData?.role === 'GUEST' || !userData
    const tabDefs = [
      { id: 'products',  label: 'Explore & Home', icon: <HomeOutlinedIcon />, activeIcon: <HomeIcon />, protected: false },
      { id: 'orders',    label: 'My Orders',      icon: <ShoppingBagOutlinedIcon />, activeIcon: <ShoppingBagIcon />, protected: true },
      { id: 'favorites', label: 'Favourites',     icon: <StarBorderIcon />, activeIcon: <StarIcon />, protected: true },
      { id: 'wishlist',  label: 'Wishlist',       icon: <FavoriteBorderIcon />, activeIcon: <FavoriteIcon />, protected: true },
      { id: 'profile',   label: 'Profile Settings', icon: <PersonOutlineIcon />, activeIcon: <PersonIcon />, protected: true },
    ]
    const allowed = tabDefs.filter(tab => !guest || !tab.protected)
    const allowedIds = new Set(allowed.map(t => t.id))
    allowedIds.add('products')
    allowedIds.add('cart')
    return {
      isGuest: guest,
      navTabs: tabDefs,
      effectiveTab: allowedIds.has(activeTab) ? activeTab : 'products',
    }
  }, [userData?.role, activeTab, userData])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/products?type=categories')
        const data = await res.json()
        if (data.success) setCategories(data.data || [])
      } catch (e) { console.error('Error fetching categories:', e) }
    }
    fetchCategories()
  }, [])

  // Fetch Favorites from API
  useEffect(() => {
    if (userData?.id) {
      const fetchFavorites = async () => {
        try {
          const res = await fetch(`/api/customer/favorites?userId=${userData.id}`)
          const data = await res.json()
          if (data.success) {
            setFavorites(data.data || [])
          }
        } catch (e) { console.error('Error fetching favorites:', e) }
      }
      fetchFavorites()
    }
  }, [userData?.id])

  const heroFirstName = useMemo(() => {
    if (authLoading) return '…'
    const dn = user?.displayName?.trim()
    if (dn) return dn.split(/\s+/)[0]
    if (userData?.username) return userData.username
    return 'there'
  }, [authLoading, user?.displayName, userData?.username])

  const handleTabSwitch = (tabId) => {
    const tabDef = navTabs.find(t => t.id === tabId)
    if (tabDef?.protected && isGuest) {
      toast.error('Please sign in to access ' + tabDef.label)
      return
    }
    setActiveTab(tabId)
    setShowMobileSidebar(false)
  }

  const handleSignOut = async () => {
    setUserMenuAnchor(null)
    await logout()
    toast.success('Signed out successfully')
    router.push('/')
  }

  const renderSidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2.5, bgcolor: '#ffffff' }}>
      {/* Brand Header */}
      <Box
        onClick={() => { setActiveTab('products'); setShowMobileSidebar(false) }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          mb: 4,
          p: 1.5,
          borderRadius: '16px',
          bgcolor: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            background: THEME.gradient,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.35)',
          }}
        >
          <DeliveryDiningIcon sx={{ color: '#fff', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={900} sx={{ background: THEME.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5 }}>
            QuickDelivery
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ fontSize: 10, letterSpacing: 0.5 }}>
            FOOD & GROCERY
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <Typography variant="caption" fontWeight={700} color="text.disabled" textTransform="uppercase" letterSpacing={1} sx={{ px: 1.5, mb: 1, fontSize: 11 }}>
        Main Menu
      </Typography>

      <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {navTabs.map((tab) => {
          const isActive = effectiveTab === tab.id
          return (
            <ListItemButton
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              sx={{
                borderRadius: '14px',
                py: 1.25,
                px: 2,
                transition: 'all 0.25s ease',
                bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                color: isActive ? THEME.primaryDark : 'text.secondary',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'rgba(241, 245, 249, 0.8)',
                  transform: 'translateX(3px)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: isActive ? THEME.primaryDark : 'text.secondary',
                }}
              >
                {isActive ? tab.activeIcon : tab.icon}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: -0.2,
                }}
              />
              {tab.id === 'orders' && !isGuest && (
                <Chip label="Live" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d' }} />
              )}
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ my: 3 }} />

      {/* Cart Quick Trigger Card */}
      <Box
        onClick={() => { setActiveTab('cart'); setShowMobileSidebar(false) }}
        sx={{
          p: 2,
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          border: '1px solid #e0e7ff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'scale(1.02)', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.12)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={getTotalItems()} sx={{ '& .MuiBadge-badge': { bgcolor: THEME.secondary, color: '#fff', fontWeight: 800 } }}>
              <ShoppingBagIcon sx={{ color: THEME.primaryDark, fontSize: 24 }} />
            </Badge>
            <Typography variant="body2" fontWeight={800} color="text.primary">
              My Basket
            </Typography>
          </Box>
          <Chip label={`${getTotalItems()} items`} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#ffffff', color: THEME.primaryDark }} />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block">
          Tap to view bill & checkout
        </Typography>
      </Box>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* User Footer / Auth status */}
      <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {isGuest ? (
          <Button
            component={NextLink}
            href="/login"
            fullWidth
            variant="contained"
            startIcon={<PersonOutlineIcon />}
            sx={{
              background: THEME.gradient,
              borderRadius: '14px',
              py: 1.25,
              textTransform: 'none',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
            }}
          >
            Sign In / Register
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: THEME.primaryDark, width: 38, height: 38, fontWeight: 800, fontSize: 15 }}>
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap>
                  {user?.displayName || 'My Account'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user?.email || 'Customer'}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Sign Out">
              <IconButton size="small" onClick={handleSignOut} sx={{ color: 'error.main' }}>
                <LogoutOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  )

  const renderActiveTabContent = () => {
    switch (effectiveTab) {
      case 'products':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <ProductCatalog
              searchQuery={searchQuery}
              onToggleFavorite={() => {}}
              favorites={favorites}
            />
          </Box>
        )
      case 'orders':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <OrderHistory />
          </Box>
        )
      case 'wishlist':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <WishlistPage onAddToCart={(p) => addToCart(p)} />
          </Box>
        )
      case 'favorites':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <Typography variant="h5" fontWeight={800} mb={3}>
              Favorite Stores & Kitchens
            </Typography>
            {favorites.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: '24px', border: '1px solid #e2e8f0', p: 4 }}>
                <StarBorderIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="text.secondary">No favorites saved yet</Typography>
                <Typography variant="body2" color="text.disabled" mb={3}>
                  Save stores & restaurants by clicking the star on items you love.
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab('products')} sx={{ background: THEME.gradient, borderRadius: '12px' }}>
                  Explore Stores
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {favorites.map((vendor, idx) => (
                  <Card key={idx} elevation={0} sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height={140}
                      image={vendor.urlLogo || vendor.urlCoverPhoto || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80'}
                      alt="Store"
                    />
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={800}>{vendor.businessName || 'Verified Store'}</Typography>
                      <Typography variant="caption" color="text.secondary">Fast delivery ready</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )
      case 'profile':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <CustomerProfile />
          </Box>
        )
      case 'cart':
        return (
          <Box sx={{ width: '100%', py: { xs: 1, sm: 2 } }}>
            <CartPage
              onNavigateExplore={() => setActiveTab('products')}
              onNavigateOrders={() => setActiveTab('orders')}
            />
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        variant="temporary"
        open={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: 290, border: 'none' } }}
      >
        {renderSidebarContent()}
      </Drawer>

      {/* ── TOP HEADER NAVBAR (FULL-WIDTH MODERN E-COMMERCE NAVBAR) ── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary',
        }}
      >
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 } }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: { xs: 1, md: 2 }, minHeight: { xs: 62, md: 72 } }}>

            {/* ── Left: Brand Logo & Mobile Toggle ── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
              <IconButton
                onClick={() => setShowMobileSidebar(true)}
                sx={{ display: { lg: 'none' }, color: THEME.primaryDark, p: 1 }}
                aria-label="open navigation menu"
              >
                <MenuIcon />
              </IconButton>

              <Box
                onClick={() => setActiveTab('products')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.25,
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'transform 0.15s ease',
                  '&:hover': { transform: 'scale(1.02)' }
                }}
              >
                <Box
                  sx={{
                    width: { xs: 36, md: 42 },
                    height: { xs: 36, md: 42 },
                    background: THEME.gradient,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 6px 16px rgba(99, 102, 241, 0.3)',
                  }}
                >
                  <DeliveryDiningIcon sx={{ color: '#fff', fontSize: { xs: 22, md: 26 } }} />
                </Box>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    sx={{
                      background: THEME.gradient,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      lineHeight: 1.1,
                      letterSpacing: -0.5,
                      fontSize: { sm: '1.1rem', md: '1.25rem' }
                    }}
                  >
                    QuickDelivery
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ fontSize: 9.5, letterSpacing: 0.6 }}>
                    FOOD & GROCERY
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* ── Center: Navbar Nav Menu Tabs (Desktop) ── */}
            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                display: { xs: 'none', lg: 'flex' },
                alignItems: 'center',
                bgcolor: '#f1f5f9',
                p: 0.5,
                borderRadius: '9999px',
                border: '1px solid #e2e8f0',
              }}
            >
              {navTabs.map((tab) => {
                const isActive = effectiveTab === tab.id
                return (
                  <Button
                    key={tab.id}
                    onClick={() => handleTabSwitch(tab.id)}
                    startIcon={isActive ? tab.activeIcon : tab.icon}
                    size="small"
                    sx={{
                      borderRadius: '9999px',
                      px: 2,
                      py: 0.75,
                      textTransform: 'none',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 13.5,
                      transition: 'all 0.2s ease',
                      bgcolor: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? THEME.primaryDark : 'text.secondary',
                      boxShadow: isActive ? '0 2px 8px rgba(99, 102, 241, 0.15)' : 'none',
                      '&:hover': {
                        bgcolor: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                        color: THEME.primaryDark,
                      },
                    }}
                  >
                    {tab.label}
                  </Button>
                )
              })}
            </Stack>

            {/* ── Search Input (Desktop & Tablet) ── */}
            <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: 360, lg: 320 }, display: { xs: 'none', sm: 'block' } }}>
              <TextField
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, grocery, dishes…"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: THEME.primary, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '9999px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    height: 38,
                    fontSize: 13,
                    '&:hover fieldset': { borderColor: THEME.primary },
                    '&.Mui-focused fieldset': { borderColor: THEME.primary },
                  },
                }}
              />
            </Box>

            {/* ── Right Actions: Basket & User Account ── */}
            <Stack direction="row" alignItems="center" spacing={1.25}>
              
              {/* Basket Trigger Button */}
              <Button
                onClick={() => handleTabSwitch('cart')}
                variant="outlined"
                startIcon={
                  <Badge
                    badgeContent={getTotalItems()}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: THEME.secondary,
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: 10,
                        minWidth: 16,
                        height: 16,
                        px: 0.5,
                      }
                    }}
                  >
                    <ShoppingBagOutlinedIcon sx={{ fontSize: 20 }} />
                  </Badge>
                }
                sx={{
                  borderRadius: '9999px',
                  borderColor: '#e0e7ff',
                  bgcolor: 'rgba(99, 102, 241, 0.06)',
                  color: THEME.primaryDark,
                  textTransform: 'none',
                  fontWeight: 800,
                  px: { xs: 1.5, sm: 2 },
                  py: 0.75,
                  fontSize: 13,
                  '&:hover': {
                    bgcolor: 'rgba(99, 102, 241, 0.12)',
                    borderColor: THEME.primary,
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, mr: 0.5 }}>
                  Basket
                </Box>
                {getTotalItems() > 0 && (
                  <Chip
                    label={`Rs. ${getTotalPrice().toFixed(0)}`}
                    size="small"
                    sx={{
                      height: 20,
                      fontWeight: 800,
                      fontSize: 11,
                      bgcolor: THEME.primaryDark,
                      color: '#ffffff',
                      ml: 0.5,
                    }}
                  />
                )}
              </Button>

              {/* User Authentication Menu */}
              {isGuest ? (
                <Button
                  component={NextLink}
                  href="/login"
                  variant="contained"
                  size="small"
                  startIcon={<PersonOutlineIcon />}
                  sx={{
                    background: THEME.gradient,
                    borderRadius: '9999px',
                    textTransform: 'none',
                    fontWeight: 800,
                    px: { xs: 2, sm: 2.5 },
                    py: 0.85,
                    fontSize: 13,
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      background: THEME.gradient,
                      opacity: 0.95,
                    }
                  }}
                >
                  Sign In
                </Button>
              ) : (
                <Box
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 0.5,
                    pr: { xs: 0.5, sm: 1.5 },
                    borderRadius: '9999px',
                    bgcolor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': { bgcolor: '#e2e8f0' }
                  }}
                >
                  <Avatar
                    src={userData?.urlLogo || userData?.avatarUrl || userData?.photoURL || user?.photoURL || ''}
                    sx={{
                      width: 32,
                      height: 32,
                      background: THEME.gradient,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 13,
                      border: '2px solid #ffffff',
                    }}
                  >
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 100 }}>
                    <Typography variant="body2" fontWeight={800} noWrap sx={{ fontSize: 13, lineHeight: 1.1 }}>
                      {user?.displayName || 'My Account'}
                    </Typography>
                  </Box>
                  <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
                </Box>
              )}
            </Stack>

          </Toolbar>
        </Box>
      </AppBar>

      {/* ── Sub-bar for Mobile Search & Navigation Pills (Visible on xs/sm/md) ── */}
      <Box
        sx={{
          display: { xs: 'block', lg: 'none' },
          bgcolor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          px: { xs: 1.5, sm: 2 },
          py: 1.25,
        }}
      >
        {/* Mobile Search Input */}
        <Box sx={{ mb: 1, display: { xs: 'block', sm: 'none' } }}>
          <TextField
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search food, groceries, stores…"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: THEME.primary, fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '9999px',
                bgcolor: '#f8fafc',
                border: '1px solid #e2e8f0',
                height: 38,
                fontSize: 13,
                '&:hover fieldset': { borderColor: THEME.primary },
                '&.Mui-focused fieldset': { borderColor: THEME.primary },
              },
            }}
          />
        </Box>

        {/* Swipeable Tabs */}
        <Box
          sx={{
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ minWidth: 'max-content' }}>
            {navTabs.map((tab) => {
              const isActive = effectiveTab === tab.id
              return (
                <Chip
                  key={tab.id}
                  icon={isActive ? tab.activeIcon : tab.icon}
                  label={tab.label}
                  clickable
                  onClick={() => handleTabSwitch(tab.id)}
                  sx={{
                    fontWeight: isActive ? 800 : 600,
                    fontSize: 12.5,
                    borderRadius: '9999px',
                    bgcolor: isActive ? THEME.primaryDark : '#f1f5f9',
                    color: isActive ? '#ffffff' : 'text.primary',
                    '& .MuiChip-icon': { color: isActive ? '#ffffff' : 'inherit' },
                    '&:hover': {
                      bgcolor: isActive ? THEME.primaryDark : '#e2e8f0',
                    },
                  }}
                />
              )
            })}
          </Stack>
        </Box>
      </Box>

      {/* ── Main Content Area (Full-Width Container) ── */}
      <Box sx={{ flex: 1, width: '100%', pb: { xs: 8, md: 2 }, display: 'flex', flexDirection: 'column' }}>

        {/* ── HIGH-END HERO SECTION (Matching Violet/Purple Banking UI Theme) ── */}
        {effectiveTab === 'products' && (
          <Box sx={{ p: { xs: 1.5, sm: 3, md: 4, lg: 4, xl: 5 }, pb: 0, width: '100%' }}>
            <Box
              sx={{
                position: 'relative',
                borderRadius: { xs: '24px', md: '32px' },
                background: THEME.gradient,
                overflow: 'hidden',
                color: '#fff',
                p: { xs: 3, sm: 4, md: 5 },
                boxShadow: '0 20px 40px -15px rgba(99, 102, 241, 0.35)',
              }}
            >
              {/* Floating Decorative Glass Orbs (Matching UI Image) */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 70%)',
                  filter: 'blur(20px)',
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -60,
                  left: '35%',
                  width: 260,
                  height: 260,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(168,85,247,0.4) 0%, rgba(168,85,247,0) 70%)',
                  filter: 'blur(30px)',
                  pointerEvents: 'none',
                }}
              />

              <Box sx={{ position: 'relative', zIndex: 2, maxWidth: 840 }}>
                {/* Greeting Badge */}
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    borderRadius: '9999px',
                    bgcolor: 'rgba(255, 255, 255, 0.16)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    mb: 2.5,
                  }}
                >
                  <FlashOnIcon sx={{ fontSize: 18, color: '#fde047' }} />
                  <Typography variant="caption" fontWeight={800} letterSpacing={0.5}>
                    {storefrontGreeting()}, {heroFirstName}! Ready for swift delivery?
                  </Typography>
                </Box>

                {/* Hero Title */}
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: '1.75rem', sm: '2.5rem', md: '3rem' },
                    lineHeight: 1.15,
                    letterSpacing: -1,
                    mb: 1.5,
                  }}
                >
                  Fresh Food &amp; Groceries, <br />
                  <Box component="span" sx={{ color: '#fbcfe8' }}>
                    Delivered In Minutes.
                  </Box>
                </Typography>

                <Typography
                  variant="body1"
                  sx={{
                    opacity: 0.92,
                    fontSize: { xs: '0.95rem', md: '1.05rem' },
                    fontWeight: 500,
                    maxWidth: 580,
                    mb: 3.5,
                  }}
                >
                  Explore curated restaurant meals, local supermarket essentials, and today’s hottest deals right at your doorstep.
                </Typography>

                {/* Service Mode Pills */}
                <Stack direction="row" gap={1.25} flexWrap="wrap" sx={{ mb: 3 }}>
                  {[
                    { id: 'delivery', label: '🛵 Instant Delivery' },
                    { id: 'pickup', label: '🛍️ Store Pick-up' },
                    { id: 'shops', label: '🏬 Explore Shops' },
                    { id: 'dinein', label: '🍽️ Dine-in Menu' },
                  ].map((opt) => (
                    <Chip
                      key={opt.id}
                      label={opt.label}
                      clickable
                      onClick={() => setServiceMode(opt.id)}
                      sx={{
                        fontWeight: 800,
                        borderRadius: '9999px',
                        px: 1,
                        height: 40,
                        bgcolor: serviceMode === opt.id ? '#ffffff' : 'rgba(255,255,255,0.18)',
                        color: serviceMode === opt.id ? THEME.primaryDark : '#ffffff',
                        backdropFilter: 'blur(8px)',
                        border: serviceMode === opt.id ? 'none' : '1px solid rgba(255,255,255,0.3)',
                        boxShadow: serviceMode === opt.id ? '0 8px 20px rgba(0,0,0,0.15)' : 'none',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: serviceMode === opt.id ? '#ffffff' : 'rgba(255,255,255,0.28)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    />
                  ))}
                </Stack>

                {/* 3 Floating Benefit Highlights */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
                    gap: 2,
                    pt: 2,
                    borderTop: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <FlashOnIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>20-Min Delivery</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Live Rider GPS Tracking</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <SecurityIcon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>100% Guaranteed</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Verified Vendors Only</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <StarIcon sx={{ fontSize: 20, color: '#fde047' }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={800}>4.9+ Top Rated</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>Over 50,000+ Orders</Typography>
                    </Box>
                  </Box>
                </Box>

              </Box>
            </Box>
          </Box>
        )}

        {/* Tab View Body */}
        {renderActiveTabContent()}

        {/* Footer */}
        <CustomerFooter />

      </Box>

      {/* Cart Drawer */}
      <Drawer
        anchor="right"
        open={showCart}
        onClose={() => setShowCart(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 460 }, p: 0 } }}
      >
        <CartPage onClose={() => setShowCart(false)} />
      </Drawer>

      {/* User Context Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{ elevation: 4, sx: { width: 260, borderRadius: '16px', mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, background: THEME.gradient, color: '#fff' }}>
          <Typography fontWeight={800} fontSize={15}>{user?.displayName}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>{user?.email}</Typography>
        </Box>
        <MenuItem onClick={() => { setActiveTab('orders'); setUserMenuAnchor(null) }} sx={{ py: 1.25 }}>
          <ListItemIcon><ShoppingBagOutlinedIcon sx={{ color: THEME.primaryDark }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>My Orders</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setActiveTab('wishlist'); setUserMenuAnchor(null) }} sx={{ py: 1.25 }}>
          <ListItemIcon><FavoriteBorderIcon sx={{ color: THEME.primaryDark }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>Wishlist</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setActiveTab('profile'); setUserMenuAnchor(null) }} sx={{ py: 1.25 }}>
          <ListItemIcon><SettingsOutlinedIcon sx={{ color: THEME.primaryDark }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>Profile Settings</ListItemText>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleSignOut} sx={{ py: 1.25, color: 'error.main' }}>
          <ListItemIcon><LogoutOutlinedIcon sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 700 }}>Sign Out</ListItemText>
        </MenuItem>
      </Menu>

      {/* ── Fixed Mobile Bottom Navigation Bar (Visible on phones & tablets < md) ── */}
      <Paper
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1150,
          display: { xs: 'flex', md: 'none' },
          justifyContent: 'space-around',
          alignItems: 'center',
          py: 0.75,
          px: 1,
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid #e2e8f0',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Button
          onClick={() => handleTabSwitch('products')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'products' ? THEME.primaryDark : 'text.secondary',
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'products' ? 800 : 600,
          }}
        >
          {effectiveTab === 'products' ? <HomeIcon sx={{ fontSize: 22 }} /> : <HomeOutlinedIcon sx={{ fontSize: 22 }} />}
          Explore
        </Button>

        <Button
          onClick={() => handleTabSwitch('orders')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'orders' ? THEME.primaryDark : 'text.secondary',
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'orders' ? 800 : 600,
          }}
        >
          {effectiveTab === 'orders' ? <ShoppingBagIcon sx={{ fontSize: 22 }} /> : <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />}
          Orders
        </Button>

        {/* Center Prominent Cart Button */}
        <Button
          onClick={() => handleTabSwitch('cart')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'cart' ? THEME.primaryDark : 'text.secondary',
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'cart' ? 800 : 600,
          }}
        >
          <Badge
            badgeContent={getTotalItems()}
            sx={{ '& .MuiBadge-badge': { bgcolor: THEME.secondary, color: '#fff', fontWeight: 800, fontSize: 9, minWidth: 16, height: 16 } }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
          </Badge>
          Basket
        </Button>

        <Button
          onClick={() => handleTabSwitch('wishlist')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'wishlist' ? THEME.primaryDark : 'text.secondary',
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'wishlist' ? 800 : 600,
          }}
        >
          {effectiveTab === 'wishlist' ? <FavoriteIcon sx={{ fontSize: 22 }} /> : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
          Wishlist
        </Button>

        <Button
          onClick={() => isGuest ? router.push('/login') : handleTabSwitch('profile')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'profile' ? THEME.primaryDark : 'text.secondary',
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'profile' ? 800 : 600,
          }}
        >
          {effectiveTab === 'profile' ? <PersonIcon sx={{ fontSize: 22 }} /> : <PersonOutlineIcon sx={{ fontSize: 22 }} />}
          {isGuest ? 'Sign In' : 'Account'}
        </Button>
      </Paper>

    </Box>
  )
}
