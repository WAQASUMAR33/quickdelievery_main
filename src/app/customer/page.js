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
  primary: '#D70F64',
  primaryDark: '#C20E5A',
  secondary: '#FF2E93',
  accent: '#E21B70',
  soft: '#FFF0F5',
  lightBg: '#FDF2F7',
  gradient: 'linear-gradient(135deg, #D70F64 0%, #E21B70 50%, #FF2E93 100%)',
  cardGradient: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,245,248,0.95) 100%)',
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
          borderRadius: 0,
          bgcolor: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            background: THEME.gradient,
            borderRadius: 0,
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
                borderRadius: 0,
                py: 1.25,
                px: 2,
                transition: 'all 0.25s ease',
                bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                color: isActive ? THEME.primaryDark : 'text.secondary',
                '&:hover': {
                  bgcolor: isActive ? 'rgba(99, 102, 241, 0.16)' : 'rgba(241, 245, 249, 0.8)',
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
                <Chip label="Live" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: '#dcfce7', color: '#15803d', borderRadius: 0 }} />
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
          borderRadius: 0,
          background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          border: '1px solid #e0e7ff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: '0 8px 20px rgba(99, 102, 241, 0.12)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={getTotalItems()} sx={{ '& .MuiBadge-badge': { bgcolor: THEME.secondary, color: '#fff', fontWeight: 800, borderRadius: 0 } }}>
              <ShoppingBagIcon sx={{ color: THEME.primaryDark, fontSize: 24 }} />
            </Badge>
            <Typography variant="body2" fontWeight={800} color="text.primary">
              My Basket
            </Typography>
          </Box>
          <Chip label={`${getTotalItems()} items`} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: '#ffffff', color: THEME.primaryDark, borderRadius: 0 }} />
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
              borderRadius: 0,
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
              <Avatar sx={{ bgcolor: THEME.primaryDark, width: 38, height: 38, fontWeight: 800, fontSize: 15, borderRadius: 0 }}>
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
              <IconButton size="small" onClick={handleSignOut} sx={{ color: 'error.main', borderRadius: 0 }}>
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
          <Box sx={{ width: '100%', py: { xs: 1, sm: 2 } }}>
            <ProductCatalog
              searchQuery={searchQuery}
              onToggleFavorite={() => {}}
              favorites={favorites}
              serviceMode={serviceMode}
              onServiceModeChange={setServiceMode}
              heroFirstName={heroFirstName}
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
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: 0, border: '1px solid #e2e8f0', p: 4 }}>
                <StarBorderIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="text.secondary">No favorites saved yet</Typography>
                <Typography variant="body2" color="text.disabled" mb={3}>
                  Save stores & restaurants by clicking the star on items you love.
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab('products')} sx={{ background: THEME.gradient, borderRadius: 0 }}>
                  Explore Stores
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {favorites.map((vendor, idx) => (
                  <Card key={idx} elevation={0} sx={{ borderRadius: 0, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
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
          bgcolor: '#ffffff',
          borderBottom: '1px solid #f0f0f0',
          color: 'text.primary',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '1440px', mx: 'auto', px: { xs: 2, sm: 3, md: 4 } }}>
          {/* ── ROW 1: Logo | Delivery Address | User & Basket ── */}
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: { xs: 1, md: 2 }, minHeight: { xs: 56, md: 64 } }}>
            {/* Left: Brand Logo & Delivery Address */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 3 } }}>
              <IconButton
                onClick={() => setShowMobileSidebar(true)}
                sx={{ display: { lg: 'none' }, color: THEME.primary, p: 0.5 }}
                aria-label="open navigation menu"
              >
                <MenuIcon />
              </IconButton>

              {/* Foodpanda-style Brand Logo */}
              <Box
                onClick={() => setActiveTab('products')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <Box
                  sx={{
                    width: { xs: 34, md: 38 },
                    height: { xs: 34, md: 38 },
                    borderRadius: '50%',
                    bgcolor: THEME.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 4px 12px rgba(215, 15, 100, 0.35)',
                  }}
                >
                  <DeliveryDiningIcon sx={{ fontSize: 22 }} />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={900}
                  sx={{
                    color: THEME.primary,
                    letterSpacing: -0.5,
                    fontSize: { xs: '1.15rem', md: '1.35rem' },
                    fontFamily: 'inherit',
                  }}
                >
                  quickdelivery
                </Typography>
              </Box>

              {/* Delivery Address Location Selector Pill */}
              <Box
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.6,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  '&:hover': { borderColor: THEME.primary, bgcolor: '#fff' },
                }}
              >
                <LocationOnIcon sx={{ color: THEME.primary, fontSize: 18 }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Deliver to:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ maxWidth: { sm: 140, md: 220 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {userData?.address || userData?.city || (user ? 'Select location' : 'Set location')}
                </Typography>
                <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Box>
            </Box>

            {/* Right Actions: Lang | Account | Basket */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              {/* Language Chip */}
              <Chip
                label="EN"
                size="small"
                variant="outlined"
                sx={{
                  display: { xs: 'none', sm: 'inline-flex' },
                  fontWeight: 700,
                  fontSize: 12,
                  borderColor: '#e2e8f0',
                  color: 'text.secondary',
                  borderRadius: '16px',
                }}
              />

              {/* Basket Trigger Button */}
              <Button
                onClick={() => handleTabSwitch('cart')}
                sx={{
                  color: 'text.primary',
                  textTransform: 'none',
                  fontWeight: 700,
                  px: { xs: 1, sm: 1.75 },
                  py: 0.5,
                  borderRadius: '24px',
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  '&:hover': { bgcolor: THEME.soft, borderColor: THEME.primary },
                }}
              >
                <Badge
                  badgeContent={getTotalItems()}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: THEME.primary,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 10,
                      minWidth: 16,
                      height: 16,
                      borderRadius: '50%',
                    }
                  }}
                >
                  <ShoppingBagOutlinedIcon sx={{ fontSize: 20, color: THEME.primary }} />
                </Badge>
                {getTotalItems() > 0 && (
                  <Typography variant="caption" fontWeight={800} color={THEME.primary} sx={{ ml: 1 }}>
                    Rs. {getTotalPrice().toFixed(0)}
                  </Typography>
                )}
              </Button>

              {/* User Authentication / Profile */}
              {isGuest ? (
                <Button
                  component={NextLink}
                  href="/login"
                  variant="contained"
                  size="small"
                  sx={{
                    bgcolor: THEME.primary,
                    color: '#fff',
                    borderRadius: '24px',
                    textTransform: 'none',
                    fontWeight: 800,
                    px: { xs: 1.75, sm: 2.5 },
                    py: 0.6,
                    fontSize: 13,
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: THEME.primaryDark,
                      boxShadow: '0 4px 12px rgba(215, 15, 100, 0.3)',
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
                    borderRadius: '24px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: '#f1f5f9' },
                  }}
                >
                  <Avatar
                    src={userData?.urlLogo || userData?.avatarUrl || userData?.photoURL || user?.photoURL || ''}
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: THEME.primary,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Typography variant="caption" fontWeight={700} noWrap sx={{ display: { xs: 'none', sm: 'block' }, maxWidth: 100 }}>
                    {user?.displayName || 'Account'}
                  </Typography>
                  <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
                </Box>
              )}
            </Stack>
          </Toolbar>

          {/* ── ROW 2: Service Mode Tabs (Delivery/Pick-up/Shops) | Wide Search Bar ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              pb: 1.5,
              pt: 0.25,
              borderTop: '1px solid #f3f4f6',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
            }}
          >
            {/* Service Mode Tabs: Delivery | Pick-up | pandamart | Shops */}
            <Stack direction="row" spacing={0.75} sx={{ overflowX: 'auto', py: 0.25, '&::-webkit-scrollbar': { display: 'none' } }}>
              {[
                { id: 'delivery', label: 'Delivery', icon: '🛵' },
                { id: 'pickup', label: 'Pick-up', icon: '🛍️' },
                { id: 'pandamart', label: 'pandamart', icon: '🏪' },
                { id: 'shops', label: 'Shops', icon: '🏬' },
              ].map((tab) => {
                const isActive = serviceMode === tab.id
                return (
                  <Button
                    key={tab.id}
                    onClick={() => {
                      setServiceMode(tab.id)
                      if (effectiveTab !== 'products') setActiveTab('products')
                    }}
                    size="small"
                    sx={{
                      borderRadius: '20px',
                      px: 2,
                      py: 0.6,
                      textTransform: 'none',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 13,
                      whiteSpace: 'nowrap',
                      bgcolor: isActive ? THEME.primary : '#f8fafc',
                      color: isActive ? '#ffffff' : '#374151',
                      border: isActive ? `1px solid ${THEME.primary}` : '1px solid #e5e7eb',
                      boxShadow: isActive ? '0 2px 8px rgba(215, 15, 100, 0.25)' : 'none',
                      '&:hover': {
                        bgcolor: isActive ? THEME.primaryDark : '#f3f4f6',
                      },
                    }}
                  >
                    <Box component="span" sx={{ mr: 0.75, fontSize: 14 }}>{tab.icon}</Box>
                    {tab.label}
                  </Button>
                )
              })}
            </Stack>

            {/* Pill Search Input */}
            <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 340, lg: 420 } }}>
              <TextField
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for restaurants, cuisines, and dishes…"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: THEME.primary, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '24px',
                    bgcolor: '#f8fafc',
                    height: 40,
                    fontSize: 13.5,
                    border: '1px solid #e2e8f0',
                    '&:hover fieldset': { borderColor: THEME.primary },
                    '&.Mui-focused fieldset': { borderColor: THEME.primary },
                  },
                }}
              />
            </Box>
          </Box>
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
                borderRadius: 0,
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
                    borderRadius: 0,
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

        {/* Tab View Body */}
        {renderActiveTabContent()}

        {/* Footer */}
        <CustomerFooter />

      </Box>



      {/* User Context Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{ elevation: 4, sx: { width: 260, borderRadius: 0, mt: 1 } }}
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
          borderRadius: 0,
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
            borderRadius: 0,
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
            borderRadius: 0,
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
            fontWeight: 800,
            borderRadius: 0,
          }}
        >
          <Badge
            badgeContent={getTotalItems()}
            sx={{ '& .MuiBadge-badge': { bgcolor: THEME.secondary, color: '#fff', fontWeight: 800, fontSize: 9, minWidth: 16, height: 16, borderRadius: 0 } }}
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
            borderRadius: 0,
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
            borderRadius: 0,
          }}
        >
          {effectiveTab === 'profile' ? <PersonIcon sx={{ fontSize: 22 }} /> : <PersonOutlineIcon sx={{ fontSize: 22 }} />}
          {isGuest ? 'Sign In' : 'Account'}
        </Button>
      </Paper>

    </Box>
  )
}
